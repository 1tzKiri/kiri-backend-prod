require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");

const app = express();

/* ===== middleware ===== */
app.use(cors());
app.use(express.json());

/* ===== OpenAI client ===== */
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ===== health check (IMPORTANT for Railway) ===== */
app.get("/", (req, res) => {
  res.status(200).send("Kiri backend is alive");
});

/* ===== chat endpoint ===== */
app.post("/ask", async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.status(400).json({ reply: "No message provided" });
    }

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

    res.json({ reply });
  } catch (error) {
    console.error("AI error:", error);
    res.status(500).json({ reply: "AI error occurred." });
  }
});

/* ===== start server (Railway REQUIRED) ===== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Kiri backend running on port", PORT);
});
