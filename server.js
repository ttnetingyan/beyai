import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(cors({ origin: process.env.FRONTEND_URL }));

let COLAB_URL = process.env.COLAB_URL || "";

app.post("/api/setcolab", (req, res) => {
  const { url } = req.body;
  COLAB_URL = url;
  console.log("🔗 Yeni Colab URL alındı:", COLAB_URL);
  res.json({ ok: true });
});

app.post("/api/generate", async (req, res) => {
  try {
    if (!COLAB_URL) return res.status(500).json({ error: "Colab bağlı değil" });

    const colabResponse = await fetch(`${COLAB_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const result = await colabResponse.json();
    if (result.video) {
      const videoBuffer = Buffer.from(result.video, "base64");
      fs.writeFileSync("output.mp4", videoBuffer);
      console.log("🎥 Video üretildi!");
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Server çalışıyor, port:", process.env.PORT || 3000);
});
