import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" }));

const frontendUrl = process.env.FRONTEND_URL || '*'; 
app.use(cors({ origin: frontendUrl }));

let COLAB_URL = process.env.COLAB_URL || "";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. Statik Dosya Sunumu ---
app.use(express.static(__dirname));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- 2. Proxy Mantığı ---

// Colab'ın URL bildirdiği endpoint
app.post("/api/setcolab", (req, res) => {
  const { url } = req.body;
  COLAB_URL = url;
  console.log(`🔗 Yeni Colab URL alındı: ${COLAB_URL}`);
  res.json({ ok: true, url: COLAB_URL });
});

// === 🟢 YENİ EKLENEN TEST ROTASI 🟢 ===
// /api/test isteğini Colab'a yönlendirir.
app.get("/api/test", async (req, res) => {
  try {
    if (!COLAB_URL) {
      return res.status(503).json({ error: "Colab bağlı değil." });
    }
    console.log(`⏩ Test isteğini Colab'a yönlendiriyor: ${COLAB_URL}/api/test`);
    
    // Colab'dan yanıtı bekle
    const colabResponse = await fetch(`${COLAB_URL}/api/test`);
    const result = await colabResponse.json();
    
    // Colab'dan gelen yanıtı ve status kodunu aynen geri gönder
    res.status(colabResponse.status).json(result);
  } catch (err) {
    res.status(500).json({ error: `Test proxy hatası: ${err.message}` });
  }
});

// Video üretim endpoint'i
app.post("/api/generate", async (req, res) => {
  try {
    if (!COLAB_URL) {
      return res.status(503).json({ 
        error: "Colab bağlı değil.", 
        hint: "Colab not defterinin çalıştığından emin olun." 
      });
    }
    
    console.log(`⏩ Video isteğini Colab'a yönlendiriyor: ${COLAB_URL}/api/generate`);
    
    const colabResponse = await fetch(`${COLAB_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const result = await colabResponse.json();

    if (!colabResponse.ok) {
        return res.status(colabResponse.status).json(result);
    }
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: `Proxy yönlendirme hatası: ${err.message}` });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Sunucu çalışıyor, port: ${PORT}`);
});
