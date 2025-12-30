import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);

    // Simple scroll effect
    window.addEventListener('scroll', () => {
        setScrolled(window.scrollY > 20);
    });

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-2 sm:py-4' : 'py-3 sm:py-6'}`}>
            <div className={`container mx-auto px-4 max-w-5xl transition-all duration-300 ${scrolled ? 'glass-panel rounded-full py-2 px-4 sm:py-3 sm:px-8' : 'bg-transparent'}`}>
                <div className="flex justify-between items-center">
                    <Link to="/" className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-indigo-900 group">
                        <span className="bg-indigo-600 text-white w-10 h-10 flex items-center justify-center rounded-xl shadow-lg ring-4 ring-indigo-100 group-hover:ring-indigo-200 transition-all text-xl">
                            👁️
                        </span>
                        <span className="tracking-tight">Civic<span className="text-indigo-600">Eye</span></span>
                    </Link>

                    <div className="flex gap-1 bg-slate-100/50 p-1 rounded-full backdrop-blur-sm border border-slate-200/60 text-sm sm:text-base">
                        <NavLink to="/" current={location.pathname === "/"}>Report Issue</NavLink>
                        <NavLink to="/admin" current={location.pathname === "/admin"}>Dashboard</NavLink>
                    </div>
                </div>
            </div>
        </nav>
    );
};

const NavLink = ({ to, children, current }) => (
    <Link
        to={to}
        className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${current
            ? 'bg-white shadow-md text-indigo-700'
            : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
            }`}
    >
        {children}
    </Link>
);

export default Navbar;
