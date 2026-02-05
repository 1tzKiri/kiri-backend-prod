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
const ALLOWED_ORIGINS = [
  "https://your-site.com",
  "http://localhost:3000"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));
app.use(express.json());
app.use(express.static(__dirname));

const askLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false
});

// OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// SERVE UI AT ROOT
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "chat.html"));
});


// Chat endpoint
app.post("/ask", askLimiter, async (req, res) => {
  try {
    if (!req.body || !req.body.message) {
      return res.status(400).json({ error: "Missing message" });
    }

    const { message, conversationId } = req.body;
    let convoId = conversationId || null;

    if (!convoId) {
      const convo = await pool.query(
        "INSERT INTO conversations DEFAULT VALUES RETURNING id"
      );
      convoId = convo.rows[0].id;
    }

    await pool.query(
      "INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)",
      [convoId, "user", message]
    );

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
      content: "You are a professional customer support assistant. Be clear and helpful."
    });

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: messagesForAI
    });

    const reply =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "No response";

    await pool.query(
      "INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)",
      [convoId, "assistant", reply]
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


