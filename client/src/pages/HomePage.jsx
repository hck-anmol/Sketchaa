import React, { useState, useEffect } from 'react';
import Sketchaa from '../components/Sketchaa';
import Logo from '../components/Logo';
import Background from '../components/Background';
import { characterData, aboutImg } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { drawingwords } from '../assets/assets';
import { ChevronLeft, ChevronRight, Pencil, Users, Bot, Zap } from 'lucide-react';

const HomePage = () => {
    const [name, setName] = useState('');
    const [characterIndex, setCharacterIndex] = useState(0);
    const navigate = useNavigate();
    const [playerId, setPlayerId] = useState('');

    useEffect(() => {
        const existing = JSON.parse(localStorage.getItem('playerInfoSolo'));
        if (existing?.name) setName(existing.name);
        if (existing?.character) {
            const idx = characterData.findIndex(c => c === existing.character);
            if (idx >= 0) setCharacterIndex(idx);
        }
    }, []);

    const handlePrev = () =>
        setCharacterIndex(p => (p === 0 ? characterData.length - 1 : p - 1));
    const handleNext = () =>
        setCharacterIndex(p => (p === characterData.length - 1 ? 0 : p + 1));

    const generatePlayerId = () => {
        const id = Math.floor(100000000 + Math.random() * 900000000).toString();
        setPlayerId(id);
        return id;
    };

    const buildPlayerData = (generatedId) => {
        const existing = JSON.parse(localStorage.getItem('playerInfoSolo'));
        const finalName = name.trim() || existing?.name;
        if (!finalName) { toast.error('Please enter your name!'); return null; }
        return { id: generatedId, name: finalName, character: characterData[characterIndex] };
    };

    const handlePlayClick = () => {
        const generatedId = generatePlayerId();
        const playerData = buildPlayerData(generatedId);
        if (!playerData) return;

        const randomIndex = Math.floor(Math.random() * drawingwords.length);
        const word = drawingwords[randomIndex];
        localStorage.setItem('practice-word', JSON.stringify(word));
        localStorage.setItem('playerInfoSolo', JSON.stringify(playerData));
        navigate(`/game/${generatedId}`);
    };

    const handleRoomClick = () => {
        const generatedId = generatePlayerId();
        const playerData = buildPlayerData(generatedId);
        if (!playerData) return;

        localStorage.setItem('playerInfoMulti', JSON.stringify(playerData));
        localStorage.setItem('playerInfoSolo', JSON.stringify(playerData));
        navigate('/room');
    };

    const features = [
        { icon: '⏱️', label: '60 seconds', desc: 'Draw as fast as you can' },
        { icon: '🤖', label: 'AI Judge', desc: 'qwen2.5vl scores every drawing' },
        { icon: '🏆', label: 'Leaderboard', desc: 'Best drawing wins the round' },
    ];

    return (
        <>
            <div className="fixed inset-0 -z-10"><Background /></div>

            <div className="min-h-screen flex flex-col items-center justify-start px-4 py-10 pb-16">

                {/* ── Logo ── */}
                <div
                    className="flex items-center gap-3 cursor-pointer mb-10 animate-fade-slide-up"
                    onClick={() => navigate('/')}
                    style={{ animationDelay: '0s' }}
                >
                    <Sketchaa />
                    <Logo />
                </div>

                {/* ── Main card ── */}
                <div
                    className="card w-full max-w-sm p-8 flex flex-col items-center gap-6 animate-fade-slide-up"
                    style={{ animationDelay: '0.08s' }}
                >
                    {/* Name */}
                    <div className="w-full">
                        <label className="block text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">
                            Your Name
                        </label>
                        <input
                            type="text"
                            placeholder="Enter your name…"
                            maxLength={20}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 text-stone-800 placeholder-stone-300 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-stone-800/20 focus:border-stone-400 transition-all"
                        />
                        <p className="text-xs text-stone-400 mt-1.5">
                            {name.trim() ? `Playing as "${name.trim()}"` : 'Will use saved name if empty'}
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="w-full flex items-center gap-3">
                        <div className="flex-1 h-px bg-stone-100" />
                        <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Character</span>
                        <div className="flex-1 h-px bg-stone-100" />
                    </div>

                    {/* Character picker */}
                    <div className="flex flex-col items-center gap-3 w-full">
                        <div className="flex items-center gap-5">
                            <button
                                onClick={handlePrev}
                                className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-all"
                            >
                                <ChevronLeft size={17} />
                            </button>

                            <div className="relative">
                                <img
                                    src={characterData[characterIndex]}
                                    alt="character"
                                    className="w-24 h-24 rounded-full object-cover border-[3px] border-stone-800 shadow-md transition-all duration-200"
                                />
                            </div>

                            <button
                                onClick={handleNext}
                                className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-all"
                            >
                                <ChevronRight size={17} />
                            </button>
                        </div>

                        {/* Dot indicators */}
                        <div className="flex gap-1.5">
                            {characterData.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCharacterIndex(i)}
                                    className={`rounded-full transition-all duration-200 ${
                                        i === characterIndex
                                            ? 'w-4 h-2 bg-stone-800'
                                            : 'w-2 h-2 bg-stone-300 hover:bg-stone-500'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="w-full flex flex-col gap-2.5 mt-1">
                        <button
                            onClick={handleRoomClick}
                            className="w-full btn btn-dark py-3.5 rounded-2xl text-sm font-semibold gap-2"
                        >
                            <Users size={16} />
                            Play with Friends
                        </button>
                        <button
                            onClick={handlePlayClick}
                            className="w-full btn btn-outline py-3.5 rounded-2xl text-sm font-semibold gap-2"
                        >
                            <Pencil size={16} />
                            Practice Solo
                        </button>
                    </div>
                </div>

                {/* ── Feature pills ── */}
                <div
                    className="flex flex-wrap gap-2 justify-center mt-8 max-w-sm animate-fade-slide-up"
                    style={{ animationDelay: '0.18s' }}
                >
                    {features.map(f => (
                        <div
                            key={f.label}
                            className="flex items-center gap-2 bg-white/80 border border-stone-200 rounded-full px-4 py-2 shadow-sm"
                        >
                            <span className="text-sm">{f.icon}</span>
                            <span className="text-xs font-semibold text-stone-700">{f.label}</span>
                            <span className="text-xs text-stone-400 hidden sm:inline">— {f.desc}</span>
                        </div>
                    ))}
                </div>

                {/* ── Info cards ── */}
                <div
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 w-full max-w-3xl animate-fade-slide-up"
                    style={{ animationDelay: '0.26s' }}
                >
                    <div className="card p-5">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center mb-3">
                            <span className="text-base">🎨</span>
                        </div>
                        <h3 className="font-semibold text-stone-800 text-sm mb-1.5">About</h3>
                        <p className="text-xs text-stone-500 leading-relaxed">
                            A fast-paced multiplayer drawing game. Draw a word and let a local AI model score everyone's artwork.
                        </p>
                    </div>

                    <div className="card p-5">
                        <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center mb-3">
                            <Bot size={15} className="text-violet-500" />
                        </div>
                        <h3 className="font-semibold text-stone-800 text-sm mb-1.5">AI Judge</h3>
                        <ul className="text-xs text-stone-500 space-y-1.5">
                            <li className="flex items-center gap-1.5">
                                <Zap size={10} className="text-violet-400 flex-shrink-0" />
                                Powered by qwen2.5vl:7b
                            </li>
                            <li className="flex items-center gap-1.5">
                                <Zap size={10} className="text-violet-400 flex-shrink-0" />
                                Runs fully locally via Ollama
                            </li>
                            <li className="flex items-center gap-1.5">
                                <Zap size={10} className="text-violet-400 flex-shrink-0" />
                                Scores + feedback per drawing
                            </li>
                        </ul>
                    </div>

                    <div className="card p-5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
                            <span className="text-base">📖</span>
                        </div>
                        <h3 className="font-semibold text-stone-800 text-sm mb-1.5">How to Play</h3>
                        {aboutImg && (
                            <img src={aboutImg} alt="How to play" className="w-full rounded-lg mb-2 object-cover opacity-90" />
                        )}
                        <p className="text-xs text-stone-500">
                            Get word → Draw → AI scores → Leaderboard reveals the winner!
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-1 mt-10 animate-fade-slide-up" style={{ animationDelay: '0.32s' }}>
                    {['Contact', 'Terms', 'Privacy'].map((label, i) => (
                        <React.Fragment key={label}>
                            <button className="text-stone-400 hover:text-stone-600 transition-colors text-xs px-3 py-1 rounded-lg hover:bg-stone-100">
                                {label}
                            </button>
                            {i < 2 && <span className="text-stone-300 text-xs">·</span>}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </>
    );
};

export default HomePage;