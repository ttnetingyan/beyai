import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" })); // Veri limiti arttırıldı
app.use(cors({ origin: process.env.FRONTEND_URL }));

let COLAB_URL = process.env.COLAB_URL || "";

// === COLAB BAĞLANTI ENDPOINT'İ ===
app.post("/api/setcolab", (req, res) => {
  const { url } = req.body;
  COLAB_URL = url;
  console.log(`🔗 Yeni Colab URL alındı: ${COLAB_URL}`);
  res.json({ ok: true, url: COLAB_URL });
});

// === VİDEO ÜRETİM ENDPOINT'İ ===
app.post("/api/generate", async (req, res) => {
  try {
    if (!COLAB_URL) {
      return res.status(503).json({ 
        error: "Colab bağlı değil.", 
        hint: "Colab not defterinin çalışıp bu proxy'ye URL bildirdiğinden emin olun." 
      });
    }
    
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
  console.log(`🚀 Proxy Server çalışıyor, port: ${PORT}`);
});
