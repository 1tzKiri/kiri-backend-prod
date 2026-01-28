require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { OpenAI } = require("openai");

const app = express();
app.set("trust proxy", true);


// Middleware
app.use(cors());
app.use(express.json());

// OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// SERVE UI AT ROOT
app.get("/", (req, res) => {
  res.set("Content-Type", "text/plain");
  res.send("OK");
});

// Chat endpoint
app.post("/ask", async (req, res) => {
  try {
    const userMessage = req.body.message;

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
    console.error(error);
    res.status(500).json({ reply: "AI error occurred." });
  }
});

const PORT = process.env.PORT;

if (!PORT) {
  console.error("PORT is missing");
  process.exit(1);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log("Kiri backend running on port " + PORT);
});
