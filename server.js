// server.js
const express = require("express");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const cors = require("cors");
const path = require("path");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// URL del sitio web que se va a leer
const SITE_URL = "https://tu-sitio-web.com";

/* ==== Funciones ===== */
function extractTextFromHTML(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function chunkText(text, maxLength = 1500) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + maxLength));
    start += maxLength;
  }
  return chunks;
}

/* ==== GET / (sirve index.html) ===== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* ==== POST /message ===== */
app.post("/message", async (req, res) => {
  const { message } = req.body;
  const text = message.toLowerCase();

  try {
    // Respuestas básicas
    if (/^(hola|buenos días|buenas tardes|buenas noches|hi|hello)/.test(text)) {
      return res.json({ reply: "¡Hola! ¿En qué puedo ayudarte?" });
    }

    // Descargar contenido del sitio
    const response = await fetch(SITE_URL);
    const html = await response.text();
    const fullText = extractTextFromHTML(html);
    const chunks = chunkText(fullText);

    let prompt = "Eres Louie, un asistente que solo responde usando la información del sitio.\n\n";
    chunks.forEach((chunk, i) => {
      prompt += `Chunk ${i + 1}:\n${chunk}\n\n`;
    });
    prompt += `Pregunta del usuario: "${message}"\nResponde solo con información del sitio.`;


    // ===== OPENAI =====
    const completion = await openai.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
    });

    res.json({ reply: completion.output_text });

  } catch (error) {
    console.error("ERROR:", error);
    res.json({ reply: "Louie: no pude procesar tu mensaje 😅" });
  }
});

/* ==== Iniciar servidor ===== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));

