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
    const userMessage = req.body.message;

await pool.query(
  "INSERT INTO messages (role, content) VALUES ($1, $2)",
  ["user", userMessage]
);

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are a professional customer support assistant for a modern business. Be polite, clear, and concise."
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    const reply =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "No response";

await pool.query(
  "INSERT INTO messages (role, content) VALUES ($1, $2)",
  ["assistant", reply]
);

    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "AI error occurred." });
  }
});

app.get("/db-check", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ ok: true, time: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Kiri backend running on port " + PORT);
});
