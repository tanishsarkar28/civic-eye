import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Child component to handle map flyTo
const MapController = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 14, { duration: 2 });
        }
    }, [center, map]);
    return null;
};

const AdminDashboard = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIssueId, setSelectedIssueId] = useState(null);
    const [showIssues, setShowIssues] = useState(false);
    const [statusFilter, setStatusFilter] = useState(null); // 'Pending' | 'Resolved' | null

    const fetchIssues = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/issues`);
            const data = await response.json();
            setIssues(data);
        } catch (error) {
            console.error("Error fetching issues:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchIssues();
    }, []);

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/issues/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            setIssues(issues.map(issue =>
                issue._id === id ? { ...issue, status: newStatus } : issue
            ));
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    // Helper to handle overlapping markers (Simple Jitter)
    const getJitteredIssues = (issuesList) => {
        const locationCounts = {};
        return issuesList.map(issue => {
            const key = `${issue.location.lat.toFixed(6)},${issue.location.lng.toFixed(6)}`;

            if (!locationCounts[key]) {
                locationCounts[key] = 0;
            }

            const count = locationCounts[key];
            locationCounts[key]++;

            // Add small offset if duplicate (approx 5-10 meters per step)
            // Spiral-like offset could be better, but diagonal is enough for <5 overlapping
            const offset = 0.00015 * count;

            return {
                ...issue,
                displayLocation: {
                    lat: issue.location.lat + offset,
                    lng: issue.location.lng + offset
                }
            };
        });
    };

    const displayIssues = getJitteredIssues(issues);
    const selectedIssue = displayIssues.find(i => i._id === selectedIssueId);

    const mapCenter = selectedIssue
        ? [selectedIssue.displayLocation.lat, selectedIssue.displayLocation.lng]
        : (issues.length > 0 ? [issues[0].location.lat, issues[0].location.lng] : [28.6139, 77.2090]);

    if (loading) return (
        <div className="flex items-center justify-center h-screen text-indigo-600">
            <svg className="animate-spin h-10 w-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    );



    return (
        <div className="relative h-[calc(100vh-100px)] sm:h-[calc(100vh-140px)] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/50">

            {/* Mobile Toggle Button */}
            <button
                onClick={() => setShowIssues(!showIssues)}
                className="md:hidden absolute top-4 right-4 z-[1001] bg-white p-3 rounded-full shadow-lg text-indigo-600"
            >
                {showIssues ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
                )}
            </button>

            {/* Sidebar / Overlay (Responsive) */}
            <div className={`
                absolute z-[1000] flex flex-col gap-4 transition-all duration-300 pointer-events-none
                
                /* Mobile: Bottom Sheet style or Full Overlay */
                ${showIssues ? 'inset-0 bg-white/90 backdrop-blur-md p-4 pointer-events-auto' : 'hidden'}
                
                /* Desktop: Floating Sidebar */
                md:flex md:top-4 md:left-4 md:bottom-4 md:w-96 md:bg-transparent md:inset-auto md:pointer-events-none
            `}>

                {/* Stats Card */}
                <div className="glass-panel p-4 sm:p-5 rounded-2xl pointer-events-auto shadow-sm md:shadow-none">
                    <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        Live Dashboard
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                        <div
                            onClick={() => setStatusFilter(statusFilter === 'Pending' ? null : 'Pending')}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${statusFilter === 'Pending'
                                ? 'bg-orange-100 border-orange-300 ring-2 ring-orange-200'
                                : 'bg-orange-50 border-orange-100 hover:bg-orange-100'
                                }`}
                        >
                            <p className="text-2xl font-bold text-orange-600">{issues.filter(i => i.status === 'Pending').length}</p>
                            <p className="text-xs text-orange-400 font-medium uppercase tracking-wide">Pending</p>
                        </div>
                        <div
                            onClick={() => setStatusFilter(statusFilter === 'Resolved' ? null : 'Resolved')}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${statusFilter === 'Resolved'
                                ? 'bg-emerald-100 border-emerald-300 ring-2 ring-emerald-200'
                                : 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100'
                                }`}
                        >
                            <p className="text-2xl font-bold text-emerald-600">{issues.filter(i => i.status === 'Resolved').length}</p>
                            <p className="text-xs text-emerald-400 font-medium uppercase tracking-wide">Resolved</p>
                        </div>
                    </div>
                </div>

                {/* Issue List */}
                <div className="glass-panel rounded-2xl flex-1 overflow-hidden flex flex-col pointer-events-auto shadow-sm md:shadow-none bg-white">
                    <div className="p-4 border-b border-slate-100">
                        <h3 className="font-semibold text-slate-700">Recent Reports</h3>
                    </div>
                    <div className="overflow-y-auto p-3 space-y-3 flex-1 custom-scrollbar">
                        {issues
                            .filter(issue => statusFilter ? issue.status === statusFilter : true)
                            .map(issue => (
                                <div
                                    key={issue._id}
                                    onClick={() => {
                                        setSelectedIssueId(issue._id);
                                        setShowIssues(false); // Close on mobile selection
                                    }}

                                    className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${selectedIssueId === issue._id
                                        ? 'bg-indigo-50 border-indigo-200 shadow-md transform scale-[1.02]'
                                        : 'bg-white border-slate-100 hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider 
                                        ${issue.status === 'Resolved' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                            {issue.status}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            {/* Simple date formatter */}
                                            {issue.timestamp ? new Date(issue.timestamp).toLocaleDateString() : 'Just now'}
                                        </span>
                                    </div>
                                    <div className="flex gap-3">
                                        <img src={issue.imageUrl} alt="Thumb" className="w-16 h-16 rounded-lg object-cover bg-slate-200" />
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">{issue.category}</h4>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                {issue.description || "Location detected. awaiting review."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        {issues.length === 0 && <p className="text-center p-4 text-gray-500">No issues found.</p>}
                    </div>
                </div>
            </div>

            {/* Map */}
            <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                <MapController center={mapCenter} />
                {displayIssues.filter(i => i.status !== 'Resolved').map(issue => (
                    <Marker
                        key={issue._id}
                        position={[issue.displayLocation.lat, issue.displayLocation.lng]}
                        eventHandlers={{
                            click: () => setSelectedIssueId(issue._id),
                        }}
                    >
                        <Popup className="glass-popup">
                            <div className="min-w-[200px] font-sans">
                                <div className="relative">
                                    <img src={issue.imageUrl} alt="Issue" className="w-full h-32 object-cover rounded-lg mb-3" />
                                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur text-white text-xs px-2 py-1 rounded">
                                        {issue.status}
                                    </div>
                                    {/* Directions Button */}
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${issue.location.lat},${issue.location.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute bottom-2 right-2 bg-white/90 p-1.5 rounded-full shadow-md text-indigo-600 hover:scale-110 transition-transform"
                                        title="Get Directions"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.809-.983L15 9m0 0l-5-2.5" />
                                        </svg>
                                    </a>
                                </div>
                                <h3 className="font-bold text-lg text-slate-800 mb-1">{issue.category}</h3>
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => handleStatusUpdate(issue._id, 'Resolved')}
                                        className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors"
                                    >
                                        RESOLVE
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(issue._id, 'Pending')}
                                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        REOPEN
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default AdminDashboard;
