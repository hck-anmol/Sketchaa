import React from 'react'

const delays = [
    '0s', '0.075s', '0.15s', '0.225s', '0.3s', '0.375s', '0.45s', '0.525s'
]
const letters = [
    { char: 'S', color: '#FF4C4C' },
    { char: 'k', color: '#FFA500' },
    { char: 'e', color: '#FFD700' },
    { char: 't', color: '#32CD32' },
    { char: 'C', color: '#1E90FF' },
    { char: 'h', color: '#8A2BE2' },
    { char: 'a', color: '#FF69B4' },
    { char: 'a', color: '#00FFFF' },

]

const Sketchaa = () => {
    return (
        <div>
            <div className='flex'>
                {letters.map((l, i) => (
                    <span
                        key={i}
                        className='text-5xl font-semibold animate-bounce-custom'
                        style={{ color: l.color, animationDelay: delays[i] }}
                    >
                        {l.char}
                    </span>
                ))}
            </div>
        </div>
    )
}

export default Sketchaa