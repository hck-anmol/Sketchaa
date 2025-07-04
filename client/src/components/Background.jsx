import React, { useEffect } from 'react'

const Background = () => {
    const numberOfStars = 100;

    const generateStars = () => {
        const stars = [];
        for (let i = 0; i < numberOfStars; i++) {
            const top = Math.random() * 100;
            const left = Math.random() * 100;
            const size = (Math.random() * 1.5 + 0.5).toFixed(2);
            const opacity = (Math.random() * 0.5 + 0.3).toFixed(2);
            const twinkleDuration = (Math.random() * 4 + 2).toFixed(1);

            stars.push(
                <div
                    key={i}
                    className="absolute bg-white rounded-full pointer-events-none"
                    style={{
                        top: `${top}%`,
                        left: `${left}%`,
                        width: `${size}px`,
                        height: `${size}px`,
                        opacity: opacity,
                        animation: `twinkle ${twinkleDuration}s infinite alternate`,
                    }}
                ></div>
            );
        }
        return stars;
    }


    return (
        <div className="min-h-screen -z-50  bg-gradient-to-br from-[#0f0f33] via-[#1a1a3f] to-black text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(0,255,255,0.15)_1px,_transparent_1px)] [background-size:100px_100px] opacity-30 pointer-events-none"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,0,255,0.1)_2px,_transparent_2px)] [background-size:200px_200px] opacity-20 pointer-events-none"></div>
            <div className="absolute inset-0 z-0 pointer-events-none">
                {generateStars()}
            </div>
        </div>

    )
}

export default Background