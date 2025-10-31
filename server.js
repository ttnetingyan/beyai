<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Video Generator - Sadeleştirilmiş</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { margin: 0; min-height: 100vh; font-family: 'Inter', sans-serif; }
    </style>
</head>
<body>
    <div id="root"></div>

    <script type="text/babel">
        // Lucide ikonlarının basit bir kopyası (JSX içinde SVG olarak kullanılacak)
        const { Camera, RefreshCw, Loader, AlertTriangle, ArrowRight } = { 
            Camera: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h.5a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2v-3"></path><path d="M20.5 8.5l-3.5 3.5m0 0l-3.5-3.5m3.5 3.5l3.5 3.5"></path></svg>,
            RefreshCw: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.49"></path></svg>,
            Loader: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"></path><path d="M12 18v4"></path><path d="M4.93 4.93l2.83 2.83"></path><path d="M16.24 16.24l2.83 2.83"></path><path d="M2 12h4"></path><path d="M18 12h4"></path><path d="M4.93 19.07l2.83-2.83"></path><path d="M16.24 7.76l2.83-2.83"></path></svg>,
            AlertTriangle: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
            ArrowRight: (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
        };

        const API_URL = "https://beyai.onrender.com"; 
        const MAX_FILE_SIZE = 5 * 1024 * 1024;

        function App() {
            const [image, setImage] = React.useState(null);
            const [prompt, setPrompt] = React.useState('a futuristic city street at sunset, cinematic, 4k');
            const [videoUrl, setVideoUrl] = React.useState(null);
            const [loading, setLoading] = React.useState(false);
            const [error, setError] = React.useState(null);
            const [progress, setProgress] = React.useState(0); 

            const handleImageChange = (e) => {
                setError(null);
                const file = e.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    if (file.size > MAX_FILE_SIZE) {
                        setError('Görüntü boyutu 5MB\'dan küçük olmalıdır.');
                        setImage(null);
                        return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setImage(reader.result.split(',')[1]); 
                    };
                    reader.readAsDataURL(file);
                } else if (file) {
                    setError('Lütfen bir resim dosyası seçin.');
                }
            };

            const generateVideo = React.useCallback(async () => {
                if (!image) {
                    setError('Lütfen önce bir resim yükleyin.');
                    return;
                }

                setLoading(true);
                setError(null);
                setVideoUrl(null);
                setProgress(0);

                const interval = setInterval(() => {
                    setProgress(prev => (prev < 90 ? prev + 1 : 90));
                }, 400);

                try {
                    const payload = { image: image, prompt: prompt };

                    const response = await fetch(`${API_URL}/api/generate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });

                    clearInterval(interval);
                    setProgress(100);

                    const result = await response.json();

                    if (!response.ok) {
                        const errorMsg = result.error || `Bilinmeyen Hata: ${response.status} ${response.statusText}`;
                        if (errorMsg.includes("Colab bağlı değil") || response.status === 503) {
                            setError("❌ BAĞLANTI HATASI (503): Colab sunucusu Render Proxy'ye bağlı değil. Lütfen Colab not defterinizi çalıştırdığınızdan emin olun.");
                        } else {
                            setError(`Video Üretiminde Hata: ${errorMsg}`);
                        }
                        setVideoUrl(null);
                        return;
                    }

                    if (result.video) {
                        const videoBlob = await (await fetch(`data:video/mp4;base64,${result.video}`)).blob();
                        setVideoUrl(URL.createObjectURL(videoBlob));
                    } else {
                        setError('Sunucudan geçerli bir video verisi alınamadı.');
                    }
                } catch (err) {
                    clearInterval(interval);
                    setProgress(0);
                    // Bu hatayı daha spesifik hale getirdik, büyük ihtimalle Colab tünel hatasından kaynaklanır.
                    setError(`Ağ Hatası: Render Proxy'den geçerli yanıt alınamadı. Colab'ın hala bağlı olduğundan emin olun.`); 
                } finally {
                    setLoading(false);
                }
            }, [image, prompt]);

            const previewImage = React.useMemo(() => {
                return image ? `data:image/jpeg;base64,${image}` : null;
            }, [image]);

            return (
                <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-8">
                    <header className="text-center mb-8">
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-indigo-800">AI Video Generator</h1>
                        <p className="mt-2 text-lg text-gray-600">SVD ile Canlandırın</p>
                    </header>
                    <div className="w-full max-w-4xl bg-white shadow-2xl rounded-xl p-6 sm:p-10 border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Resim Yükleme */}
                            <div className="flex flex-col space-y-4">
                                <h2 className="text-xl font-semibold text-gray-700 flex items-center"><Camera className="w-5 h-5 mr-2 text-indigo-500" /> 1. Görüntü Yükle</h2>
                                <label htmlFor="file-upload" className="block cursor-pointer p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 transition duration-300 bg-gray-50 text-center">
                                    {previewImage ? (<img src={previewImage} alt="Önizleme" className="w-full h-auto max-h-64 object-contain rounded-md mx-auto" />) : (
                                        <div className='text-gray-500'><p className="font-medium">Bir dosya seçin veya buraya sürükleyin</p><p className="text-sm mt-1">JPEG veya PNG (Max 5MB)</p></div>
                                    )}
                                    <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange}/>
                                </label>
                            </div>
                            {/* Prompt Alanı */}
                            <div className="flex flex-col space-y-4">
                                <h2 className="text-xl font-semibold text-gray-700 flex items-center"><ArrowRight className="w-5 h-5 mr-2 text-indigo-500" /> 2. Hareket Açıklaması</h2>
                                <textarea
                                    className="w-full p-3 h-36 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 resize-none"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Görüntünün nasıl hareket etmesini istediğinizi açıklayın..."
                                />
                            </div>
                        </div>
                        {/* 3. Üretim Butonu ve Hata/Yüklenme Mesajları */}
                        <div className="flex flex-col items-center">
                            <button
                                onClick={generateVideo}
                                disabled={loading || !image}
                                className={`flex items-center justify-center px-8 py-3 text-lg font-bold rounded-full shadow-lg transition-all duration-300 ${loading || !image ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-xl active:scale-95'}`}
                            >
                                {loading ? (<><Loader className="w-5 h-5 mr-3 animate-spin" />Video Üretiliyor ({progress}%)</>) : (<><RefreshCw className="w-5 h-5 mr-2" />Video Üret</>)}
                            </button>
                            {error && (<div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start w-full"><AlertTriangle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" /><p className="text-sm font-medium">{error}</p></div>)}
                        </div>
                        {/* 4. Sonuç Alanı */}
                        {videoUrl && (
                            <div className="mt-10 pt-6 border-t border-gray-200">
                                <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">🎬 Üretilen Video</h2>
                                <div className="flex justify-center">
                                    <video key={videoUrl} controls autoPlay loop className="w-full max-w-xl rounded-xl shadow-2xl border border-gray-200">
                                        <source src={videoUrl} type="video/mp4" />
                                        Tarayıcınız video etiketini desteklemiyor.
                                    </video>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // Uygulamayı başlat
        ReactDOM.createRoot(document.getElementById('root')).render(<App />);

    </script>
</body>
</html>
