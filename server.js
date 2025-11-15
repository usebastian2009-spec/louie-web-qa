
// server.js
const express = require("express");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const cors = require("cors");
const fetch = require("node-fetch"); // necesario en CommonJS

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const SITE_URL = "https://tu-sitio-web.com"; // Cambia esto

app.post("/message", async (req, res) => {
  const { message } = req.body;

  try {
    if (message.toLowerCase().includes("hola")) {
      return res.json({ reply: "¡Hola! 😄" });
    }

    const completion = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: message,
    });

    res.json({ reply: completion.output_text });
  } catch (e) {
    res.json({ reply: "Louie no pudo procesar tu mensaje 😅" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
