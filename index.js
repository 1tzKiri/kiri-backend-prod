require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { OpenAI } = require("openai");
const pool = require("./db");

const app = express();
app.set("trust proxy", true);


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// SERVE UI AT ROOT
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "chat.html"));
});


// Chat endpoint
app.post("/ask", async (req, res) => {
  try {
  
  const { message, conversationId } = req.body;

let convoId = conversationId;

if (!convoId) {
  const convo = await pool.query(
    "INSERT INTO conversations DEFAULT VALUES RETURNING id"
  );
  convoId = convo.rows[0].id;
}

await pool.query(
  "INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)",
  [conversationId, "user", message]
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


   const response = await client.responses.create({
  model: "gpt-4.1-mini",
  input: messagesForAI
});

   const messagesForAI = historyResult.rows.map(m => ({
  role: m.role,
  content: m.content
}));

messagesForAI.unshift({
  role: "system",
  content: "You are a professional customer support assistant. Be clear and helpful."
});


    const reply =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "No response";

// after assistant reply is saved

await pool.query(
  "INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)",
  [convoId, "assistant", reply]
);

    res.json({ reply, conversationId: convoId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "AI error occurred." });
  }
});

const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Kiri backend running on port " + PORT);
});


