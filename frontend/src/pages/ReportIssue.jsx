import React, { useState, useEffect } from 'react';

const ReportIssue = () => {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [category, setCategory] = useState(''); // New state for dropdown
    const [description, setDescription] = useState(''); // User description
    const [aiConfidence, setAiConfidence] = useState(false); // Visual indicator

    const CATEGORIES = ["Pothole", "Garbage", "Broken Streetlight", "Normal", "Other"];

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setStatus('Please enable location services to report issues.');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge: 0
                }
            );
        }
    }, []);

    const handleImageChange = async (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            setPreview(URL.createObjectURL(file));

            // Analyze immediately
            setCategory('');
            setAiConfidence(true); // "Analyzing..." state

            const formData = new FormData();
            formData.append('file', file);

            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/predict`, { method: 'POST', body: formData });
                const data = await res.json();
                if (data.category) {
                    setCategory(data.category);
                }
            } catch (err) {
                console.error("AI Prediction failed", err);
            }
            setAiConfidence(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!image || !location || !category) {
            return;
        }

        setLoading(true);
        setStatus('Submitting report...');

        const formData = new FormData();
        formData.append('file', image);
        formData.append('lat', location.lat);
        formData.append('lng', location.lng);
        formData.append('category', category); // Send manual/AI category
        formData.append('description', description || 'Reported via Civic-Eye Web App');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/issues`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('Report submitted successfully! Thank you.');

                // Clear form after delay
                setTimeout(() => {
                    setImage(null);
                    setPreview(null);
                    setStatus('');
                    setCategory('');
                    setDescription('');
                }, 3000);
            } else {
                throw new Error(data.error || 'Server Error');
            }

        } catch (error) {
            console.error("Error submitting report:", error);
            setStatus('Error submitting report. Is the backend running?');
        }
        setLoading(false);
    };

    return (
        <div className="max-w-xl mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-3">
                    Report an Issue
                </h1>
                <p className="text-slate-500 text-lg">Spot something wrong? Snap a picture, we'll handle the rest.</p>
            </div>

            {/* Main Card */}
            <div className="glass-panel rounded-2xl sm:rounded-3xl p-1 shadow-2xl shadow-indigo-100/50">
                <div className="bg-white/50 rounded-xl sm:rounded-[1.4rem] p-4 sm:p-8">

                    {/* Location Badge */}
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 transition-colors duration-300 ${location ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                        <div className={`p-2 rounded-full ${location ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-bold text-sm">Location Status</p>
                            <p className="text-xs opacity-80">
                                {location
                                    ? `Locked: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                                    : "Acquiring GPS..."}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Upload Area */}
                        <div className="group relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className={`border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${preview
                                ? 'border-indigo-300 bg-indigo-50/30'
                                : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                                }`}>

                                {preview ? (
                                    <div className="relative z-0">
                                        <img src={preview} alt="Preview" className="w-full h-64 object-cover rounded-xl shadow-md rotate-1 transition-transform group-hover:rotate-0" />
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-700">Tap to open camera</h3>
                                        <p className="text-slate-400 text-sm mt-1">or select from gallery</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Category Selection (AI suggested) */}
                        {preview && (
                            <div className="space-y-2 animate-fade-in-up">
                                <label className="text-sm font-bold text-slate-600 ml-1 flex justify-between">
                                    Issue Type
                                    {aiConfidence && <span className="text-indigo-500 text-xs animate-pulse">AI Analyzing...</span>}
                                </label>
                                <div className="relative">
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full p-4 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                                    >
                                        <option value="" disabled>Select Category</option>
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 ml-1">
                                    {category ? "AI suggestion applied. Check ensuring correctness." : "Waiting for image..."}
                                </p>
                            </div>
                        )}

                        {/* Description Input */}
                        {preview && (
                            <div className="space-y-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                                <label className="text-sm font-bold text-slate-600 ml-1">
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe the issue..."
                                    className="w-full p-4 rounded-xl bg-white border border-slate-200 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow h-24 resize-none"
                                />
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !location || !image || !category}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl shadow-indigo-200 transition-all transform ${loading || !location || !image || !category
                                ? 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
                                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white hover:-translate-y-1 hover:shadow-indigo-300'
                                }`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </div>
                            ) : "Submit Reports"}
                        </button>
                    </form>
                </div>
            </div>

            {/* Success/Error Toast */}
            {(status && status !== 'Submitting report...') && (
                <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl font-medium backdrop-blur-md z-50 animate-fade-in-up ${status.includes('success') ? 'bg-emerald-500/90 text-white' : 'bg-slate-800/90 text-white'
                    }`}>
                    {status}
                </div>
            )}
        </div>
    );
};

export default ReportIssue;
