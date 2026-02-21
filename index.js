require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { OpenAI } = require("openai");
const pool = require("./db");
const rateLimit = require("express-rate-limit");

const app = express();
app.set("trust proxy", true);

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
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
app.post("/ask", askLimiter, async (req, res) => {
  try {
    const { message, conversationId, site_key } = req.body;

    if (!site_key) {
      return res.status(400).json({ error: "Missing site key" });
    }

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    // Validate site
    const result = await pool.query(
      "SELECT * FROM sites WHERE site_key = $1 AND active = true",
      [site_key]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: "Invalid site key" });
    }

    const site = result.rows[0];

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
      ORDER BY created_at ASC
      LIMIT 10
      `,
      [convoId]
    );

    const messagesForAI = historyResult.rows.map(m => ({
      role: m.role,
      content: m.content
    }));

    messagesForAI.unshift({
      role: "system",
      content: "You are a helpful assistant."
    });

    // Generate AI response
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: messagesForAI,
      max_output_tokens: 300,
      temperature: 0.6
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

const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Kiri backend running on port " + PORT);
});
