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
app.use(cors({
  origin: ["https://kiri-frontend.vercel.app"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "x-admin-secret"]
}));

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

    if (!site_key) {
      return res.status(400).json({ error: "Missing site key" });
    }

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

const result = await pool.query(
  `SELECT sites.*, plans.monthly_limit
   FROM sites
   JOIN plans ON sites.plan_id = plans.id
   WHERE sites.site_key = $1 AND sites.active = true`,
  [site_key]
);

if (result.rows.length === 0) {
  return res.status(403).json({ error: "Invalid site key" });
}

const site = result.rows[0];

const knowledge = await pool.query(
  "SELECT content FROM knowledge_chunks WHERE site_id = $1 LIMIT 5",
  [site.id]
);

const knowledgeText = knowledge.rows.map(r => r.content).join("\n\n");

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

// 🔐 DOMAIN VALIDATION
const origin = req.headers.origin;

if (!origin) {
  return res.status(403).json({ error: "Missing origin header" });
}

// Normalize origin
const requestDomain = origin
  .replace(/^https?:\/\//, "")
  .split("/")[0];

console.log("Origin:", origin);
console.log("RequestDomain:", requestDomain);
console.log("AllowedDomain:", site.allowed_domain);

// Allow subdomains
if (site.allowed_domain && !requestDomain.endsWith(site.allowed_domain)) {
  return res.status(403).json({ error: "Unauthorized domain" });
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

const takeoverCheck = await pool.query(
  "SELECT human_takeover FROM conversations WHERE id = $1",
  [convoId]
);

if (takeoverCheck.rows[0]?.human_takeover) {
  return res.json({
    reply: "A human agent will continue this conversation shortly."
  });


      await pool.query(
        "UPDATE sites SET total_conversations = total_conversations + 1 WHERE id = $1",
        [site.id]
      );
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

let allText = "";

while (toVisit.length > 0 && visited.size < 10) {
  const currentUrl = toVisit.shift();

  if (visited.has(currentUrl)) continue;
  visited.add(currentUrl);

  try {
    const response = await axios.get(currentUrl);
    const html = response.data;

    const $ = cheerio.load(html);

    $("p, h1, h2, h3, li").each((i, el) => {
      allText += $(el).text() + "\n";
    });

    $("a").each((i, el) => {
      const link = $(el).attr("href");

      if (!link) return;

      if (link.startsWith("/") || link.startsWith(url)) {
        const full =
          link.startsWith("http") ? link : new URL(link, url).href;

        if (!visited.has(full)) {
          toVisit.push(full);
        }
      }
    });

  } catch (err) {
    console.log("skip", currentUrl);
  }
}

await pool.query(
  "INSERT INTO knowledge_chunks (site_id, content) VALUES ($1, $2)",
  [siteId, allText]
);

res.json({ success: true, pages_scraped: visited.size });

} catch (err) {
  console.error("Scrape error:", err);
  res.status(500).json({ error: "Scrape failed" });
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

const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Kiri backend running on port " + PORT);
});
