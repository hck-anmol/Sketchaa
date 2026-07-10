import React from 'react'

const Background = () => {
    return (
        <div className="fixed inset-0 -z-50" style={{ background: '#f5f0e8' }}>
            {/* Subtle warm paper grain */}
            <div
                className="absolute inset-0 opacity-40 pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
                    backgroundSize: '200px 200px',
                }}
            />

            {/* Dot grid */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle, #c8bfa8 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                    opacity: 0.45,
                }}
            />

            {/* Corner doodles – top left */}
            <svg className="absolute top-0 left-0 opacity-10 pointer-events-none" width="260" height="260" viewBox="0 0 260 260" fill="none">
                <circle cx="30" cy="30" r="18" stroke="#1c1917" strokeWidth="1.5" strokeDasharray="4 4"/>
                <rect x="60" y="20" width="22" height="22" rx="3" stroke="#1c1917" strokeWidth="1.5" strokeDasharray="3 3"/>
                <path d="M20 80 Q50 60 80 80 Q110 100 140 80" stroke="#1c1917" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <path d="M15 110 L35 95 L55 110 L35 125 Z" stroke="#1c1917" strokeWidth="1.5" fill="none"/>
                <circle cx="100" cy="50" r="8" stroke="#1c1917" strokeWidth="1.2" fill="none"/>
                <path d="M110 120 Q130 100 150 120" stroke="#1c1917" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                <circle cx="50" cy="160" r="12" stroke="#1c1917" strokeWidth="1.2" fill="none" strokeDasharray="3 3"/>
                <path d="M80 140 L95 155 L80 170" stroke="#1c1917" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>

            {/* Corner doodles – bottom right */}
            <svg className="absolute bottom-0 right-0 opacity-10 pointer-events-none" width="260" height="260" viewBox="0 0 260 260" fill="none">
                <circle cx="230" cy="230" r="18" stroke="#1c1917" strokeWidth="1.5" strokeDasharray="4 4"/>
                <rect x="180" y="220" width="22" height="22" rx="3" stroke="#1c1917" strokeWidth="1.5" strokeDasharray="3 3"/>
                <path d="M240 180 Q210 200 180 180 Q150 160 120 180" stroke="#1c1917" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                <path d="M245 150 L225 165 L205 150 L225 135 Z" stroke="#1c1917" strokeWidth="1.5" fill="none"/>
                <circle cx="160" cy="210" r="8" stroke="#1c1917" strokeWidth="1.2" fill="none"/>
                <path d="M150 140 Q130 160 110 140" stroke="#1c1917" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                <circle cx="210" cy="100" r="12" stroke="#1c1917" strokeWidth="1.2" fill="none" strokeDasharray="3 3"/>
            </svg>

            {/* Top right subtle star */}
            <svg className="absolute top-8 right-10 opacity-10 pointer-events-none" width="60" height="60" viewBox="0 0 60 60" fill="none">
                <path d="M30 5 L34 22 L51 22 L37 33 L42 50 L30 40 L18 50 L23 33 L9 22 L26 22 Z" stroke="#1c1917" strokeWidth="1.3" fill="none"/>
            </svg>

            {/* Bottom left subtle spiral */}
            <svg className="absolute bottom-10 left-8 opacity-8 pointer-events-none" width="80" height="80" viewBox="0 0 80 80" fill="none">
                <path d="M40 40 Q50 30 50 40 Q50 55 35 55 Q20 55 20 40 Q20 20 40 20 Q62 20 62 40 Q62 65 40 65 Q15 65 15 40" stroke="#1c1917" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
            </svg>
        </div>
    );
};

export default Background;