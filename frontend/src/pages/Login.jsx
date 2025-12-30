import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // Hardcoded simple auth for prototype
        if (password === 'admin123') {
            sessionStorage.setItem('isAdmin', 'true');
            navigate('/admin');
        } else {
            setError('Invalid access key');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20">
            <div className="glass-panel p-8 rounded-3xl text-center shadow-xl">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                    🔒
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Admin Access</h2>
                <p className="text-slate-500 mb-6">Enter secure passkey to view dashboard</p>

                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter Passkey"
                        className="bg-white/50 border border-slate-200 text-center text-lg px-4 py-3 rounded-xl w-full focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />

                    {error && <p className="text-rose-500 text-sm font-medium">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5"
                    >
                        Unlock Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
