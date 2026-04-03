global.File = class {};
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { OpenAI } = require("openai");
const pool = require("./db");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const ADMIN_SECRET = process.env.ADMIN_SECRET;

const app = express();
app.set("trust proxy", true);

// Middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://kiri-frontend.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());
app.use(express.static(__dirname));

const askLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
});

// OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Serve UI
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "chat.html"));
});

// Chat endpoint
app.post("/ask", async (req, res) => {
  try {
const { message, conversationId, site_key } = req.body;

// 🔥 DEBUG
console.log("SITE_KEY:", site_key);

if (!site_key) {
  return res.status(400).json({ error: "Missing site key" });
}

if (!message) {
  return res.status(400).json({ error: "Missing message" });
}

console.log("ALL SITES TEST:");
const test = await pool.query("SELECT site_key FROM sites");
console.log(test.rows);

const result = await pool.query(  
`SELECT sites.*, plans.monthly_limit
   FROM sites
   LEFT JOIN plans ON sites.plan_id = plans.id
   WHERE LOWER(sites.site_key) = LOWER($1)`,
  [site_key]
);

// 🔥 DEBUG
console.log("DB RESULT:", result.rows);

if (result.rows.length === 0) {
  return res.status(403).json({ error: "Invalid site key" });
}

const site = result.rows[0];
const knowledge = await pool.query(
  "SELECT content FROM knowledge_chunks WHERE site_id = $1 LIMIT 5",
  [site.id]
);

const knowledgeText = knowledge.rows.map(r => r.content).join("\n\n");

// 🔥 DOMAIN DEBUG
const origin = req.headers.origin;

console.log("ORIGIN:", origin);
console.log("ALLOWED DOMAIN:", site.allowed_domain);

// ✅ CLEAN DOMAIN VALIDATION
if (origin && site.allowed_domain) {
  const requestDomain = origin
    .replace(/^https?:\/\//, "")
    .split("/")[0];

  if (!requestDomain.endsWith(site.allowed_domain)) {
    return res.status(403).json({ error: "Unauthorized domain" });
  }
}

// --- AUTO MONTHLY RESET LOGIC ---

const now = new Date();
const lastReset = new Date(site.last_reset_at);

const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

const resetMonth = lastReset.getMonth();
const resetYear = lastReset.getFullYear();

// If new month started → reset counter
if (currentMonth !== resetMonth || currentYear !== resetYear) {
  await pool.query(
    `UPDATE sites
     SET monthly_message_count = 0,
         last_reset_at = NOW()
     WHERE id = $1`,
    [site.id]
  );

  site.monthly_message_count = 0;
}


const plan = site.plan || "free";

// 🔥 Tier-based rate limiting per site_key
const limits = {
  free: 10,
  pro: 100,
  enterprise: 1000
};

const limit = limits[plan] || 10;

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
const requestCount = parseInt(rateResult.rows[0].count);

if (requestCount >= limit) {
  return res.status(429).json({
    error: "Rate limit exceeded for your plan."
  });
}
   
   

    // Check monthly limit
    if (site.monthly_message_count >= site.monthly_limit) {
      return res.status(403).json({ error: "Monthly message limit reached" });
    }

    let convoId = conversationId || null;

    // Create new conversation if needed
    if (!convoId) {
      const convo = await pool.query(
        "INSERT INTO conversations (site_id) VALUES ($1) RETURNING id",
        [site.id]
      );

      convoId = convo.rows[0].id;

      await pool.query(
        "UPDATE sites SET total_conversations = total_conversations + 1 WHERE id = $1",
        [site.id]
      );
     }

const takeoverCheck = await pool.query(
  "SELECT human_takeover FROM conversations WHERE id = $1",
  [convoId]
);

const msg = message.toLowerCase();

if (takeoverCheck.rows[0]?.human_takeover) {

  if (
    msg.includes("return to ai") ||
    msg.includes("back to ai") ||
    msg.includes("cancel human") ||
    msg.includes("use ai")
  ) {

    await pool.query(
      "UPDATE conversations SET human_takeover = false WHERE id = $1",
      [convoId]
    );

  } else {

    return res.json({
      reply: "A human agent will continue this conversation shortly."
    });

  }

}

    // Save user message
    await pool.query(
      "INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)",
      [convoId, "user", message]
    );

    // Get last messages
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

  const messagesForAI = historyResult.rows
  .reverse()
  .map(m => ({
    role: m.role,
    content: m.content
  }));

const systemPrompt = `
You are KIRI AI, a focused technical assistant embedded on a website.

Website knowledge:
${knowledgeText}

Rules:
- Always respond in the same language as the user's last message.
- If the user writes in Polish, respond in Polish.
- If the user writes in German, respond in German.
- Otherwise respond in English.
- Answer directly and cleanly.
- Do not add unnecessary greetings.
- Be concise and structured.
`;

const humanTriggers = [
  "human",
  "agent",
  "support",
  "real person",
  "talk to human",
  "customer service",
  "talk to a person"
];

const wantsHuman = humanTriggers.some(trigger =>
  message.toLowerCase().includes(trigger)
);

if (wantsHuman) {

  await pool.query(
    "UPDATE conversations SET human_takeover = true WHERE id = $1",
    [convoId]
  );

  return res.json({
    reply: "Sure — a human agent will join the conversation shortly."
  });

}

const lastMessages = messagesForAI.slice(-10);

const conversationText = lastMessages
  .map(m => `${m.role.toUpperCase()}: ${m.content}`)
  .join("\n");

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

    // Save assistant message
    await pool.query(
      "INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)",
      [convoId, "assistant", reply]
    );

    // Update usage counters
    await pool.query(
      `
      UPDATE sites
      SET total_messages = total_messages + 1,
          monthly_message_count = monthly_message_count + 1
      WHERE id = $1
      `,
      [site.id]
    );

    res.json({ reply, conversationId: convoId });

  } catch (err) {
    console.error("ASK ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/create-site", async (req, res) => {
  try {
    const { name, domain, plan } = req.body;

    if (!name || !domain || !plan) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Find plan in DB
    const planResult = await pool.query(
      "SELECT * FROM plans WHERE name = $1",
      [plan]
    );

    if (planResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const planData = planResult.rows[0];

    // Generate site key
    const siteKey = require("crypto").randomBytes(16).toString("hex");

    // Insert new site
    await pool.query(
      `INSERT INTO sites (name, domain, site_key, plan_id)
       VALUES ($1, $2, $3, $4)`,
      [name, domain, siteKey, planData.id]
    );

    const embed = `<script src="https://kiri-backend-prod-production.up.railway.app/widget.js" data-site-key="${siteKey}"></script>`;

    res.json({ siteKey, embed });

  } catch (err) {
    console.error("Create site error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/upgrade-plan", async (req, res) => {
  const { siteKey, newPlan } = req.body;

  if (!siteKey || !newPlan) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // Find plan
  const planResult = await pool.query(
    "SELECT * FROM plans WHERE name = $1",
    [newPlan]
  );

  if (planResult.rows.length === 0) {
    return res.status(400).json({ error: "Invalid plan" });
  }

  const planId = planResult.rows[0].id;

  // Update site
  const updateResult = await pool.query(
    "UPDATE sites SET plan_id = $1 WHERE site_key = $2 RETURNING *",
    [planId, siteKey]
  );

  if (updateResult.rows.length === 0) {
    return res.status(404).json({ error: "Site not found" });
  }

  res.json({ message: "Plan upgraded successfully" });
});

app.post("/site-usage", async (req, res) => {
  const { siteKey } = req.body;

  if (!siteKey) {
    return res.status(400).json({ error: "Missing site key" });
  }

  // Get site with plan info
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
    JOIN plans p ON s.plan_id = p.id
    WHERE s.site_key = $1
    `,
    [siteKey]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Site not found" });
  }

  const site = result.rows[0];

  const remaining = site.monthly_limit - site.monthly_message_count;

  res.json({
    name: site.name,
    plan: site.plan_name,
    monthlyUsed: site.monthly_message_count,
    monthlyLimit: site.monthly_limit,
    remaining,
    price: site.price,
    lastReset: site.last_reset_at
  });
});

function verifyAdmin(req, res, next) {
  const adminKey = req.headers["x-admin-secret"];

  if (!adminKey || adminKey !== ADMIN_SECRET) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  next();
}

app.get("/admin-overview", verifyAdmin, async (req, res) => {
  try {
    // Get all sites with plan info
    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.monthly_message_count,
        s.site_key,
        p.name AS plan_name,
        p.monthly_limit,
        p.price
      FROM sites s
      JOIN plans p ON s.plan_id = p.id
      ORDER BY s.id DESC
    `);

    const sites = result.rows;

    const totalSites = sites.length;

    const totalMonthlyRevenue = sites.reduce((sum, site) => {
      return sum + parseFloat(site.price);
    }, 0);

    res.json({
      totalSites,
      totalMonthlyRevenue,
      sites
    });

  } catch (err) {
    console.error("Admin overview error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/admin-update-plan", verifyAdmin, async (req, res) => {
  const { siteId, newPlanName } = req.body;

  if (!siteId || !newPlanName) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const planResult = await pool.query(
      "SELECT * FROM plans WHERE name = $1",
      [newPlanName]
    );

    if (planResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const plan = planResult.rows[0];

    await pool.query(
      "UPDATE sites SET plan_id = $1 WHERE id = $2",
      [plan.id, siteId]
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/admin-delete-site", verifyAdmin, async (req, res) => {
  const { siteId } = req.body;

  if (!siteId) {
    return res.status(400).json({ error: "Missing siteId" });
  }

  try {
    await pool.query("DELETE FROM sites WHERE id = $1", [siteId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/admin-conversations/:siteId", verifyAdmin, async (req, res) => {
  const { siteId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        c.id as conversation_id,
        c.created_at,
        m.role,
        m.content,
        m.created_at as message_time
      FROM conversations c
      JOIN messages m ON m.conversation_id = c.id
      WHERE c.site_id = $1
      ORDER BY m.created_at ASC
    `, [siteId]);

    res.json({ messages: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/admin-scrape-site", verifyAdmin, async (req, res) => {
  const { siteId, url } = req.body;

  try {
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

        const html = response.data;

        const $ = cheerio.load(html);

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
        console.log("skip:", currentUrl);
      }

    }

    // remove old knowledge
    await pool.query(
      "DELETE FROM knowledge_chunks WHERE site_id = $1",
      [siteId]
    );

    // split into chunks
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

    console.error("Scrape error:", err);

    res.status(500).json({
      error: "Scrape failed"
    });

  }

});

app.post("/admin/takeover", verifyAdmin, async (req, res) => {
  const { conversationId } = req.body;

  if (!conversationId) {
    return res.status(400).json({ error: "Missing conversationId" });
  }

  await pool.query(
    "UPDATE conversations SET human_takeover = true WHERE id = $1",
    [conversationId]
  );

  res.json({ success: true });
});

app.get("/admin/conversations", async (req, res) => {
  const result = await pool.query(`
    SELECT conversations.id, conversations.created_at, sites.domain
    FROM conversations
    JOIN sites ON conversations.site_id = sites.id
    ORDER BY conversations.created_at DESC
    LIMIT 50
  `);

  res.json(result.rows);
});

app.get("/admin/messages/:conversationId", async (req, res) => {

  const { conversationId } = req.params;

  const messages = await pool.query(
    "SELECT role, content, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
    [conversationId]
  );

  res.json(messages.rows);

});

app.post("/admin/reply", async (req, res) => {

  const { conversationId, message } = req.body;

  await pool.query(
    "INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)",
    [conversationId, "assistant", message]
  );

  res.json({ success: true });

});

app.post("/admin/return-to-ai", async (req, res) => {

  const { conversationId } = req.body;

  try {

    await pool.query(
      "UPDATE conversations SET human_takeover = false WHERE id = $1",
      [conversationId]
    );

    res.json({ success: true });

  } catch (err) {

    console.error("Return to AI error:", err);
    res.status(500).json({ error: "Failed to return to AI" });

  }

});

app.post("/admin/return-to-ai", async (req, res) => {

  const { conversationId } = req.body;

  if (!conversationId) {
    return res.status(400).json({ error: "Missing conversationId" });
  }

  try {

    await pool.query(
      "UPDATE conversations SET human_takeover = false WHERE id = $1",
      [conversationId]
    );

    res.json({ success: true });

  } catch (err) {

    console.error("Return to AI error:", err);
    res.status(500).json({ error: "Failed to return to AI" });

  }

});

app.get("/admin/conversations", async (req, res) => {
  const result = await pool.query(`
    SELECT conversations.id, conversations.created_at, conversations.human_takeover, sites.domain
    FROM conversations
    JOIN sites ON conversations.site_id = sites.id
    ORDER BY conversations.created_at DESC
  `);

  res.json(result.rows);
});

app.get("/admin/messages/:id", async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    "SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
    [id]
  );

  res.json(result.rows);
});

app.post("/admin/reply", async (req, res) => {
  const { conversationId, message } = req.body;

  if (!conversationId || !message) {
    return res.status(400).json({ error: "Missing data" });
  }

  await pool.query(
    "INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)",
    [conversationId, "human", message]
  );

  res.json({ success: true });
});


app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. create user
    const userResult = await pool.query(
      `INSERT INTO users (email, password, role)
       VALUES ($1, $2, 'user')
       RETURNING id`,
      [email, password]
    );

    const userId = userResult.rows[0].id;

    // 2. generate site key
    const siteKey = Math.random().toString(36).substring(2, 15);

    // 3. create site
    await pool.query(
      `INSERT INTO sites (user_id, name, site_key, plan_id, active)
       VALUES ($1, $2, $3, 1, true)`,
      [userId, "New Site", siteKey]
    );

    res.json({
      success: true,
      site_key: siteKey
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "User exists or error" });
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
      role: user.role,
      site_key: user.site_key
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/conversations", async (req, res) => {
  try {
    const { site_key } = req.query;

    const result = await pool.query(
      "SELECT * FROM conversations WHERE site_key = $1 ORDER BY id DESC",
      [site_key]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/admin/create-user", async (req, res) => {
  try {
    const { email, password } = req.body;

    const site_key = Math.random().toString(36).substring(2, 10);

    await pool.query(
      "INSERT INTO users (email, password, role, site_key) VALUES ($1, $2, $3, $4)",
      [email, password, "user", site_key]
    );

  await pool.query(
  "INSERT INTO sites (name, site_key) VALUES ($1, $2)",
  ["New Client", site_key]
);

    res.json({ success: true, site_key });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "error creating user" });
  }
});

const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Kiri backend running on port " + PORT);
});
