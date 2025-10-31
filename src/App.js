import { useState } from "react";

export default function App() {
  const [image, setImage] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  };

  const generateVideo = async (continuePrompt = "") => {
    setLoading(true);
    const finalPrompt = continuePrompt || prompt;

    const res = await fetch("https://beyai.onrender.com/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, prompt: finalPrompt }),
    });

    const data = await res.json();
    if (data.video) setVideo(`data:video/mp4;base64,${data.video}`);
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center p-8 space-y-4">
      <h1 className="text-2xl font-bold">🎬 Görsel + Metin → Video</h1>

      <input type="file" accept="image/*" onChange={handleFile} />
      <textarea
        placeholder="Ne olacağını yaz (örnek: kamera sağdan dönsün)"
        className="border p-2 w-80 h-20"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={() => generateVideo()}
        disabled={loading}
      >
        {loading ? "Oluşturuluyor..." : "Videoyu Oluştur"}
      </button>

      {video && (
        <div className="flex flex-col items-center space-y-2">
          <video src={video} controls className="w-80 rounded-lg shadow" />
          <button
            onClick={async () => {
              const devamPrompt = prompt(
                "Yeni sahne için ne olacağını yaz (örnek: karakter yürümeye başlasın)"
              );
              if (devamPrompt) await generateVideo(devamPrompt);
            }}
            className="bg-green-500 text-white px-3 py-1 rounded"
          >
            ➕ Devam Et
          </button>
        </div>
      )}
    </div>
  );
}
