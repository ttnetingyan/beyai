import React, { useState, useCallback } from 'react';
import { Upload, X, Loader2, Video, Send } from 'lucide-react';

// API URL, Render Proxy Sunucunuzun Adresi
// Colab URL'si bu adrese bildirilir ve istekler buradan Colab'a yönlendirilir.
const API_URL = "https://beyai.onrender.com"; 

const App = () => {
    // State'ler
    const [prompt, setPrompt] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    const [isError, setIsError] = useState(false);
    const [customMessage, setCustomMessage] = useState('');

    // Görsel Yükleme İşlemi
    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            // 5MB limit kontrolü
            if (file.size > 5 * 1024 * 1024) { 
                setCustomMessage("Hata: Görsel boyutu 5MB'ı geçmemelidir.");
                return;
            }
            setSelectedImage(file);
            setVideoUrl('');
            setCustomMessage('');
            setIsError(false);
        }
    };

    // Video Üretim İşlemi
    const handleGenerateVideo = useCallback(async () => {
        if (!selectedImage || isLoading) return;

        setIsLoading(true);
        setVideoUrl('');
        setCustomMessage('');
        setIsError(false);

        try {
            // 1. Görseli Base64'e çevir (API'ye göndermek için)
            const reader = new FileReader();
            reader.readAsDataURL(selectedImage);
            reader.onloadend = async () => {
                const base64Image = reader.result.split(',')[1];
                
                setCustomMessage("Video üretim isteği gönderiliyor. Colab sunucusunun yanıt vermesi 30-60 saniye sürebilir...");

                // 2. Proxy Sunucusuna İsteği Gönder
                const response = await fetch(`${API_URL}/api/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image: base64Image,
                        prompt: prompt || "stabil ve güzel bir video",
                        // Diğer SVD parametreleri buraya eklenebilir
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    setIsError(true);
                    setCustomMessage(`Sunucu Hatası: ${data.error || 'Video üretilemedi.'}`);
                    setVideoUrl('');
                    return;
                }

                if (data.video) {
                    // Base64 video verisini URL'ye çevir
                    const videoBlob = await (await fetch(`data:video/mp4;base64,${data.video}`)).blob();
                    setVideoUrl(URL.createObjectURL(videoBlob));
                    setCustomMessage("🎉 Video başarıyla oluşturuldu!");
                } else {
                    setIsError(true);
                    setCustomMessage("Hata: Sunucudan geçerli bir video verisi alınamadı.");
                }
            };
            reader.onerror = () => {
                setIsError(true);
                setCustomMessage("Görsel okuma hatası.");
            };

        } catch (error) {
            console.error("API Call Error:", error);
            setIsError(true);
            setCustomMessage(`Genel Bağlantı Hatası. Colab sunucusunun çalıştığından emin olun. Hata: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [selectedImage, prompt, isLoading]);


    // Ana içerik ve durum görüntüleyici
    const renderContent = () => {
        if (videoUrl) {
            return (
                <div className="w-full max-w-lg mx-auto">
                    <video 
                        src={videoUrl} 
                        controls 
                        autoPlay
                        loop
                        muted
                        className="w-full h-auto rounded-xl shadow-2xl border-4 border-gray-700"
                    >
                        Tarayıcınız video etiketini desteklemiyor.
                    </video>
                </div>
            );
        }

        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-gray-700 rounded-xl shadow-xl">
                    <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                    <p className="text-white text-center font-medium">{customMessage || "Lütfen bekleyin, video hazırlanıyor..."}</p>
                </div>
            );
        }

        if (isError) {
            return (
                <div className="p-4 bg-red-800 text-white rounded-xl shadow-xl border-2 border-red-600">
                    <p className="font-bold mb-2">Üretim Hatası</p>
                    <p>{customMessage}</p>
                    <p className="mt-2 text-sm">Lütfen Colab sunucunuzun çalıştığından ve URL'sinin Render Proxy'ye doğru bildirildiğinden emin olun.</p>
                </div>
            );
        }

        if (selectedImage) {
            return (
                <div className="flex flex-col items-center space-y-4">
                    <img 
                        src={URL.createObjectURL(selectedImage)} 
                        alt="Seçilen Görsel" 
                        className="w-48 h-48 object-cover rounded-xl shadow-xl border-4 border-gray-700"
                    />
                    <div className="text-gray-300 text-sm">Görsel Yüklendi ({selectedImage.name})</div>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center h-48 border-4 border-dashed border-gray-500 rounded-xl p-6 bg-gray-800 transition duration-300 hover:border-blue-500 cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-gray-400 text-center">Video oluşturmak için bir görsel seçin.</p>
                <p className="text-xs text-gray-500 mt-1">(Max 5MB)</p>
            </div>
        );
    };

    // Ana Bileşen Görünümü
    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 font-sans">
            <header className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                    SVD Video Oluşturucu
                </h1>
                <p className="text-gray-400 mt-2">Görselden video üretimi (Colab & Render ile güçlendirilmiştir)</p>
            </header>

            <div className="max-w-3xl mx-auto space-y-8">
                
                {/* 1. Görsel Yükleme Alanı */}
                <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl">
                    <h2 className="text-2xl font-semibold mb-4 text-blue-400">1. Görsel Yükle</h2>
                    <label className="block">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        {/* Görsel Yükleme İkonu veya Önizleme */}
                        {renderContent()}
                    </label>

                    {selectedImage && (
                        <button
                            onClick={() => {
                                setSelectedImage(null);
                                setVideoUrl('');
                                setCustomMessage('');
                                setIsError(false);
                            }}
                            className="mt-4 flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition duration-200 shadow-md"
                        >
                            <X className="w-5 h-5 mr-2" />
                            Görseli Kaldır
                        </button>
                    )}
                </div>

                {/* 2. Prompt ve Üretim Alanı */}
                <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl space-y-4">
                    <h2 className="text-2xl font-semibold text-blue-400">2. Prompt Gir & Üret</h2>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Örn: 'Fotoğraf yavaşça hareket ediyor, hafif bir kamera sallanmasıyla.'"
                        rows="3"
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                        disabled={!selectedImage || isLoading}
                    />
                    
                    <p className="text-sm text-gray-400">
                        *Prompt girmek zorunlu değildir, ancak video hareketini yönlendirmeye yardımcı olur.
                    </p>

                    <button
                        onClick={handleGenerateVideo}
                        disabled={!selectedImage || isLoading}
                        className={`w-full flex items-center justify-center px-6 py-3 font-bold rounded-lg transition duration-300 shadow-lg ${
                            selectedImage && !isLoading
                                ? 'bg-green-600 hover:bg-green-700 text-white transform hover:scale-[1.01]'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Video Oluşturuluyor...
                            </>
                        ) : (
                            <>
                                <Video className="w-5 h-5 mr-2" />
                                Video Oluştur
                            </>
                        )}
                    </button>
                </div>
                
                {/* 3. Sonuç ve Mesaj Alanı (Video Gösterimi için renderContent tekrar çağrılır) */}
                <div className="min-h-[300px] flex items-center justify-center flex-col space-y-4">
                   {renderContent()} 
                   {(customMessage && !videoUrl) && (
                        <p className={`text-sm text-center font-medium ${isError ? 'text-red-400' : 'text-yellow-400'}`}>
                            {customMessage}
                        </p>
                    )}
                </div>

                {/* API URL Bilgisi */}
                 <div className="text-center pt-4 text-gray-500 text-xs">
                    <p>API Proxy URL'si: <code className="bg-gray-700 p-1 rounded">https://beyai.onrender.com</code></p>
                    <p>Lütfen Colab sunucusunun çalıştığından ve URL'sinin Render Proxy'ye başarıyla bildirildiğinden emin olun.</p>
                </div>

            </div>
        </div>
    );
};

export default App;
