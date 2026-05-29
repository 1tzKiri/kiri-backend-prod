global.File = class {};

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const Stripe = require("stripe");
const { OpenAI } = require("openai");

const pool = require("./db");

const app = express();
app.set("trust proxy", true);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const ADMIN_SECRET = process.env.ADMIN_SECRET;

const FRONTEND_URL = "https://kiri-frontend.vercel.app";

// STRIPE WEBHOOK MUST BE BEFORE express.json()
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const site_key = session.metadata?.site_key;
      const plan = (session.metadata?.plan || "pro").toLowerCase();

      if (site_key && ["starter", "pro"].includes(plan)) {
        await pool.query(
          `
          UPDATE sites
SET 
  plan_id = (SELECT id FROM plans WHERE LOWER(name) = $1),
  current_plan = $1
WHERE site_key = $2
          `,
          [plan, site_key]
        );

        console.log("✅ Stripe payment success. Plan upgraded:", site_key, plan);
      }
    }

    res.json({ received: true });

  } catch (err) {
    console.log("❌ Webhook error:", err.message);
    res.sendStatus(400);
  }
});

// MIDDLEWARE
app.use(cors({
  origin: FRONTEND_URL,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-admin-secret"]
}));

app.use(express.json());
app.use(express.static(__dirname));

const askLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

// HELPERS
function verifyAdmin(req, res, next) {
  const adminKey = req.headers["x-admin-secret"];

  if (!ADMIN_SECRET || adminKey !== ADMIN_SECRET) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  next();
}

async function getSiteByKey(site_key) {
  const result = await pool.query(
    `
    SELECT 
      s.*,
      p.name AS plan_name,
      p.monthly_limit
    FROM sites s
    LEFT JOIN plans p ON s.plan_id = p.id
    WHERE LOWER(s.site_key) = LOWER($1)
    `,
    [site_key]
  );

  return result.rows[0] || null;
}

async function checkConversationAccess(conversationId, site_key) {
  const result = await pool.query(
    `
    SELECT c.id
    FROM conversations c
    JOIN sites s ON c.site_id = s.id
    WHERE c.id = $1
    AND s.site_key = $2
    `,
    [conversationId, site_key]
  );

  return result.rows.length > 0;
}

// ROOT
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "chat.html"));
});

// ASK / WIDGET CHAT
app.post("/ask", askLimiter, async (req, res) => {
  try {
    const { message, conversationId, site_key, language } = req.body;

    if (!site_key) return res.status(400).json({ error: "Missing site key" });
    if (!message) return res.status(400).json({ error: "Missing message" });

    const site = await getSiteByKey(site_key);

    if (!site) {
      return res.status(403).json({ error: "Invalid site key" });
    }

    // Domain validation
    const origin = req.headers.origin;

    if (origin && site.allowed_domain) {
      const requestDomain = origin.replace(/^https?:\/\//, "").split("/")[0];

      if (!requestDomain.endsWith(site.allowed_domain)) {
        return res.status(403).json({ error: "Unauthorized domain" });
      }
    }

    // monthly reset
    const now = new Date();
    const lastReset = site.last_reset_at ? new Date(site.last_reset_at) : new Date(0);

    if (
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear()
    ) {
      await pool.query(
        `
        UPDATE sites
        SET monthly_message_count = 0,
            last_reset_at = NOW()
        WHERE id = $1
        `,
        [site.id]
      );

      site.monthly_message_count = 0;
    }

    const monthlyLimit = site.monthly_limit || 10;

    if (site.monthly_message_count >= monthlyLimit) {
      return res.status(403).json({ error: "Monthly message limit reached" });
    }

    // rate limit by plan
    const planName = (site.plan_name || site.current_plan || "starter").toLowerCase();

   const limits = {
  starter: 30,
  pro: 300
};

    const perMinuteLimit = limits[planName] || 30;
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    const rateResult = await pool.query(
      `
      SELECT COUNT(*)
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.site_id = $1
      AND m.role = 'user'
      AND m.created_at > $2
      `,
      [site.id, oneMinuteAgo]
    );

    if (parseInt(rateResult.rows[0].count) >= perMinuteLimit) {
      return res.status(429).json({ error: "Rate limit exceeded for your plan." });
    }

    let convoId = conversationId || null;

    // create new conversation
    if (!convoId) {
      const convo = await pool.query(
        "INSERT INTO conversations (site_id) VALUES ($1) RETURNING id",
        [site.id]
      );

      convoId = convo.rows[0].id;

      await pool.query(
        "UPDATE sites SET total_conversations = COALESCE(total_conversations,0) + 1 WHERE id = $1",
        [site.id]
      );
    }

    // verify conversation belongs to site
    const allowed = await checkConversationAccess(convoId, site_key);

    if (!allowed) {
      return res.status(403).json({ error: "Unauthorized conversation" });
    }

    const convoResult = await pool.query(
      "SELECT human_takeover FROM conversations WHERE id = $1",
      [convoId]
    );

    const isHumanTakeover = convoResult.rows[0]?.human_takeover === true;

    // always save user message
    await pool.query(
      "INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'user', $2)",
      [convoId, message]
    );

    // if already in human takeover, AI must NOT answer
    if (isHumanTakeover) {
      return res.json({
        reply: null,
        human_takeover: true,
        conversationId: convoId
      });
    }

    const msg = message.toLowerCase();

    const humanTriggers = [
      "human",
      "agent",
      "support",
      "real person",
      "talk to human",
      "customer service",
      "talk to a person",
      "person",
      "człowiek",
      "konsultant",
      "pomoc"
    ];

    const wantsHuman = humanTriggers.some(trigger => msg.includes(trigger));

    if (wantsHuman) {
      await pool.query(
        "UPDATE conversations SET human_takeover = true WHERE id = $1",
        [convoId]
      );

      const humanReply = "Sure — a human agent will join the conversation shortly.";

      await pool.query(
        "INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'assistant', $2)",
        [convoId, humanReply]
      );

      return res.json({
        reply: humanReply,
        human_takeover: true,
        conversationId: convoId
      });
    }

    const knowledge = await pool.query(
      "SELECT content FROM knowledge_chunks WHERE site_id = $1 LIMIT 8",
      [site.id]
    );

    const knowledgeText = knowledge.rows.map(r => r.content).join("\n\n");

    const historyResult = await pool.query(
      `
      SELECT role, content
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at DESC
      LIMIT 10
      `,
      [convoId]
    );

    const history = historyResult.rows.reverse();

    const conversationText = history
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const systemPrompt = `
You are Kiri AI, a focused assistant embedded on a website.

Website knowledge:
${knowledgeText}

Rules:
- Always respond in the same language as the user's last message.
- If the user writes in Polish, respond in Polish.
- If the user writes in German, respond in German.
- Otherwise respond in English.
- Answer directly and cleanly.
- Be concise.
- Do not add unnecessary greetings.
`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `${systemPrompt}

Conversation so far:
${conversationText}

Assistant:`,
      temperature: 0.4,
      max_output_tokens: 300
    });

    const reply =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "No response";

    await pool.query(
      "INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'assistant', $2)",
      [convoId, reply]
    );

    await pool.query(
      `
      UPDATE sites
      SET total_messages = COALESCE(total_messages,0) + 1,
          monthly_message_count = COALESCE(monthly_message_count,0) + 1
      WHERE id = $1
      `,
      [site.id]
    );

    res.json({
      reply,
      human_takeover: false,
      conversationId: convoId
    });

  } catch (err) {
    console.error("ASK ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// AUTH
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const userResult = await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, 'user') RETURNING id, email, role",
      [email, password]
    );

    const user = userResult.rows[0];
    const siteKey = crypto.randomBytes(12).toString("hex");

    await pool.query(
      `
      INSERT INTO sites (user_id, name, site_key, active)
      VALUES ($1, $2, $3, true)
      `,
      [user.id, "New Site", siteKey]
    );

    await pool.query(
      "UPDATE users SET site_key = $1 WHERE id = $2",
      [siteKey, user.id]
    );

    res.json({
      success: true,
      id: user.id,
      email: user.email,
      role: user.role,
      site_key: siteKey
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "Register failed" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND password = $2",
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid login" });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      id: user.id,
      email: user.email,
      role: user.role,
      site_key: user.site_key
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// CLIENT DATA
app.post("/site-usage", async (req, res) => {
  try {
    const { siteKey } = req.body;

    if (!siteKey) {
      return res.status(400).json({ error: "Missing site key" });
    }

    const result = await pool.query(
      `
      SELECT 
        s.id,
        s.name,
        s.monthly_message_count,
        s.last_reset_at,
        p.name AS plan_name,
        p.monthly_limit,
        p.price
      FROM sites s
      LEFT JOIN plans p ON s.plan_id = p.id
      WHERE s.site_key = $1
      `,
      [siteKey]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Site not found" });
    }

    const site = result.rows[0];
    const limit = site.monthly_limit || 500;
    const used = site.monthly_message_count || 0;

    res.json({
      name: site.name,
      site.plan_name || site.current_plan || "starter",
      monthlyUsed: used,
      monthlyLimit: limit,
      remaining: limit - used,
      price: site.price,
      lastReset: site.last_reset_at
    });

  } catch (err) {
    console.error("SITE USAGE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/conversations", async (req, res) => {
  try {
    const { site_key } = req.query;

    if (!site_key) {
      return res.status(400).json({ error: "Missing site key" });
    }

    const site = await getSiteByKey(site_key);

    if (!site) {
      return res.status(404).json({ error: "Site not found" });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM conversations
      WHERE site_id = $1
      ORDER BY created_at DESC
      `,
      [site.id]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("CONVERSATIONS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/messages/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { site_key } = req.query;

    if (!site_key) {
      return res.status(400).json({ error: "Missing site key" });
    }

    const allowed = await checkConversationAccess(conversationId, site_key);

    if (!allowed) {
      return res.status(403).json({ error: "Unauthorized conversation" });
    }

    const result = await pool.query(
      `
      SELECT *
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
      `,
      [conversationId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("MESSAGES ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/reply", async (req, res) => {
  try {
    const { conversationId, message, site_key } = req.body;

    if (!conversationId || !message || !site_key) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const allowed = await checkConversationAccess(conversationId, site_key);

    if (!allowed) {
      return res.status(403).json({ error: "Unauthorized conversation" });
    }

    await pool.query(
      "INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'human', $2)",
      [conversationId, message]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("REPLY ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/return-to-ai", async (req, res) => {
  try {
    const { conversationId, site_key } = req.body;

    if (!conversationId || !site_key) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const allowed = await checkConversationAccess(conversationId, site_key);

    if (!allowed) {
      return res.status(403).json({ error: "Unauthorized conversation" });
    }

    await pool.query(
      "UPDATE conversations SET human_takeover = false WHERE id = $1",
      [conversationId]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("RETURN TO AI ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// WIDGET SETTINGS
app.get("/widget-settings", async (req, res) => {
  try {
    const { site_key } = req.query;

    if (!site_key) {
      return res.status(400).json({ error: "Missing site key" });
    }

    const result = await pool.query(
      `
      SELECT widget_title, welcome_message, primary_color, bot_instructions
      FROM sites
      WHERE site_key = $1
      `,
      [site_key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Site not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error("WIDGET SETTINGS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/widget-settings", async (req, res) => {
  try {
    const {
      site_key,
      widget_title,
      welcome_message,
      primary_color,
      bot_instructions
    } = req.body;

    if (!site_key) {
      return res.status(400).json({ error: "Missing site key" });
    }

    await pool.query(
      `
      UPDATE sites
      SET widget_title = $1,
          welcome_message = $2,
          primary_color = $3,
          bot_instructions = $4
      WHERE site_key = $5
      `,
      [
        widget_title || "Kiri AI",
        welcome_message || "Hi! How can I help you today?",
        primary_color || "#2563eb",
        bot_instructions || "",
        site_key
      ]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("SAVE WIDGET SETTINGS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// STRIPE
app.post("/create-checkout", async (req, res) => {
  try {
    const { site_key, plan } = req.body;

    if (!site_key) {
      return res.status(400).json({ error: "Missing site key" });
    }

    const selectedPlan = (plan || "pro").toLowerCase();

    const plans = {
      starter: {
        name: "Kiri AI Starter",
        amount: 3000
      },
      pro: {
        name: "Kiri AI Pro",
        amount: 12000
      }
    };

    if (!plans[selectedPlan]) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      metadata: {
        site_key,
        plan: selectedPlan
      },
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: plans[selectedPlan].name },
          unit_amount: plans[selectedPlan].amount
        },
        quantity: 1
      }],
     success_url: `${FRONTEND_URL}/app.html?payment=success`,
cancel_url: `${FRONTEND_URL}/app.html?payment=cancelled`
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error("STRIPE ERROR:", err);
    res.status(500).json({ error: "Stripe error" });
  }
});

// ADMIN ROUTES
app.get("/admin-overview", verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        s.id,
        s.name,
        s.site_key,
        s.monthly_message_count,
        p.name AS plan_name,
        p.monthly_limit,
        p.price
      FROM sites s
      LEFT JOIN plans p ON s.plan_id = p.id
      ORDER BY s.id DESC
      `
    );

    const sites = result.rows;

    const totalMonthlyRevenue = sites.reduce((sum, site) => {
      return sum + Number(site.price || 0);
    }, 0);

    res.json({
      totalSites: sites.length,
      totalMonthlyRevenue,
      sites
    });

  } catch (err) {
    console.error("ADMIN OVERVIEW ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/admin-update-plan", verifyAdmin, async (req, res) => {
  try {
    const { siteId, newPlanName } = req.body;

    const planResult = await pool.query(
      "SELECT * FROM plans WHERE name = $1",
      [newPlanName]
    );

    if (planResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    await pool.query(
      "UPDATE sites SET plan_id = $1 WHERE id = $2",
      [planResult.rows[0].id, siteId]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("ADMIN UPDATE PLAN ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/admin/conversations", verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        c.id,
        c.created_at,
        c.human_takeover,
        s.name AS site_name,
        s.site_key
      FROM conversations c
      JOIN sites s ON c.site_id = s.id
      ORDER BY c.created_at DESC
      LIMIT 100
      `
    );

    res.json(result.rows);

  } catch (err) {
    console.error("ADMIN CONVERSATIONS ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/admin/messages/:conversationId", verifyAdmin, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
      `,
      [conversationId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("ADMIN MESSAGES ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// KNOWLEDGE SCRAPE ADMIN
app.post("/admin-scrape-site", verifyAdmin, async (req, res) => {
  try {
    const { siteId, url } = req.body;

    if (!siteId || !url) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const axios = require("axios");
    const cheerio = require("cheerio");

    const visited = new Set();
    const toVisit = [url];
    const baseDomain = new URL(url).hostname;

    let allText = "";

    while (toVisit.length > 0 && visited.size < 15) {
      const currentUrl = toVisit.shift();

      if (visited.has(currentUrl)) continue;

      visited.add(currentUrl);

      try {
        const response = await axios.get(currentUrl, { timeout: 10000 });
        const $ = cheerio.load(response.data);

        $("p, h1, h2, h3, li").each((i, el) => {
          const text = $(el).text().trim();

          if (text.length > 30) {
            allText += text + "\n";
          }
        });

        $("a").each((i, el) => {
          const link = $(el).attr("href");
          if (!link) return;

          let full;

          if (link.startsWith("http")) {
            full = link;
          } else if (link.startsWith("/")) {
            full = new URL(link, url).href;
          } else {
            return;
          }

          try {
            const hostname = new URL(full).hostname;

            if (hostname === baseDomain && !visited.has(full)) {
              toVisit.push(full);
            }
          } catch {}
        });

      } catch {
        console.log("Skipped:", currentUrl);
      }
    }

    await pool.query(
      "DELETE FROM knowledge_chunks WHERE site_id = $1",
      [siteId]
    );

    const chunks = allText.match(/.{1,1200}/gs) || [];

    for (const chunk of chunks) {
      await pool.query(
        "INSERT INTO knowledge_chunks (site_id, content) VALUES ($1, $2)",
        [siteId, chunk]
      );
    }

    res.json({
      success: true,
      pages_scraped: visited.size,
      chunks_created: chunks.length
    });

  } catch (err) {
    console.error("SCRAPE ERROR:", err);
    res.status(500).json({ error: "Scrape failed" });
  }
});

// START SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Kiri backend running on port " + PORT);
});
