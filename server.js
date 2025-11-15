

// server.js
const express = require("express");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const cors = require("cors");
const path = require("path");
const fetch = require("node-fetch");
const cheerio = require("cheerio"); // para parsear HTML

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// URL del sitio web de propiedades
const SITE_URL = "https://tu-sitio-web.com"; // Cambiar a la web del cliente

/* ==================== Funciones ==================== */
async function getPropertiesFromSite() {
  try {
    const response = await fetch(SITE_URL);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Ejemplo: parsear propiedades según estructura HTML de la web
    // Cambiar selectores según la web real del cliente
    const properties = [];
    $(".property-card").each((i, el) => {
      const title = $(el).find(".title").text().trim();
      const price = $(el).find(".price").text().trim();
      const location = $(el).find(".location").text().trim();
      const imgURL = $(el).find("img").attr("src") || "";
      if (title) {
        properties.push({ title, price, location, imgURL });
      }
    });
    return properties;
  } catch (err) {
    console.error("Error obteniendo propiedades:", err);
    return [];
  }
}

/* ==================== ENDPOINTS ==================== */
// Servir index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Procesar mensaje del usuario
app.post("/message", async (req, res) => {
  const { message } = req.body;
  const text = message.toLowerCase();

  try {
    // Respuestas básicas
    if (/^(hola|buenos días|buenas tardes|buenas noches|hi|hello)/.test(text)) {
      return res.json({ reply: "¡Hola! 😄 ¿En qué puedo ayudarte?" });
    }
    if (/^(adiós|chao|bye)/.test(text)) {
      return res.json({ reply: "¡Adiós! 👋 Que tengas un buen día." });
    }

    // Obtener propiedades del sitio
    const properties = await getPropertiesFromSite();

    // Usar OpenAI para filtrar según mensaje del usuario
    const prompt = `
Eres Louie, un asistente de bienes raíces. Tienes la siguiente lista de propiedades:

${JSON.stringify(properties)}

El usuario pregunta: "${message}"

Responde solo con las propiedades que coincidan con la pregunta, usando título, precio, ubicación e imagen. 
Devuelve un array de objetos JSON con title, price, location, imgURL. Si no hay coincidencias, responde con un mensaje de texto.
`;

    const completion = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    let output;
    try {
      output = JSON.parse(completion.output_text);
      if (!Array.isArray(output)) throw new Error("No es array");
      res.json({ reply: output });
    } catch (err) {
      // Si no se puede parsear como array, devolver como texto
      res.json({ reply: completion.output_text });
    }

  } catch (error) {
    console.error(error);
    res.json({ reply: "Louie: no pude procesar tu mensaje 😅" });
  }
});

/* ==================== INICIAR SERVIDOR ==================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
