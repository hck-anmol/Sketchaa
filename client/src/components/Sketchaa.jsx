import React from 'react'

const delays = ['0s','0.08s','0.16s','0.24s','0.32s','0.40s','0.48s','0.56s'];

const letters = [
    { char: 'S', color: '#f87171' },
    { char: 'k', color: '#fb923c' },
    { char: 'e', color: '#eab308' },
    { char: 't', color: '#22c55e' },
    { char: 'C', color: '#3b82f6' },
    { char: 'h', color: '#8b5cf6' },
    { char: 'a', color: '#ec4899' },
    { char: 'a', color: '#06b6d4' },
];

const Sketchaa = () => {
    return (
        <div className="flex items-end">
            {letters.map((l, i) => (
                <span
                    key={i}
                    className="text-4xl font-extrabold animate-bounce-custom leading-none select-none"
                    style={{
                        color: l.color,
                        animationDelay: delays[i],
                        letterSpacing: '-0.02em',
                    }}
                >
                    {l.char}
                </span>
            ))}
        </div>
    );
};

export default Sketchaa;