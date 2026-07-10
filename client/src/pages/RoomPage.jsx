import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Background from '../components/Background';
import Sketchaa from '../components/Sketchaa';
import Logo from '../components/Logo';
import { drawingwords } from '../assets/assets';
import socket from '../socket';
import { Plus, ArrowRight, Bot, Clock, Trophy, Copy, Check, Wifi, WifiOff } from 'lucide-react';

const RoomPage = () => {
    const [roomCode, setRoomCode] = useState('');
    const [inputCode, setInputCode] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [copied, setCopied] = useState(false);
    const [connected, setConnected] = useState(socket.connected);
    const navigate = useNavigate();

    const playerInfo = JSON.parse(localStorage.getItem('playerInfoMulti'));

    useEffect(() => {
        if (!playerInfo) {
            toast.error("Player not found. Please go back and enter your name.");
            navigate('/');
            return;
        }

        const onConnect    = () => setConnected(true);
        const onDisconnect = () => setConnected(false);
        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        if (socket.connected) setConnected(true);

        const setupSocketListeners = () => {
            socket.on('room-created', ({ roomCode, players, selectedWord, gameState }) => {
                localStorage.setItem('playersInRoom', JSON.stringify(players));
                localStorage.setItem('selectedWord', selectedWord);
                localStorage.setItem('currentRoomCode', roomCode);
                localStorage.setItem('currentPlayerId', playerInfo.id);
                localStorage.setItem('gameState', JSON.stringify(gameState));
                setIsCreating(false);
                toast.success(`Room created!`);
                navigate(`/room/${roomCode}`);
            });

            socket.on('room-joined', ({ roomCode, players, selectedWord, chatMessages, gameState }) => {
                localStorage.setItem('playersInRoom', JSON.stringify(players));
                localStorage.setItem('selectedWord', selectedWord);
                localStorage.setItem('currentRoomCode', roomCode);
                localStorage.setItem('currentPlayerId', playerInfo.id);
                localStorage.setItem('chatMessages', JSON.stringify(chatMessages || []));
                localStorage.setItem('gameState', JSON.stringify(gameState));
                setIsJoining(false);
                toast.success(`Joined room!`);
                navigate(`/room/${roomCode}`);
            });

            socket.on('room-error', (message) => {
                toast.error(message);
                setIsCreating(false);
                setIsJoining(false);
            });
        };

        if (socket.connected) setupSocketListeners();
        else socket.on('connect', setupSocketListeners);

        return () => {
            socket.off('room-created');
            socket.off('room-joined');
            socket.off('room-error');
            socket.off('connect');
            socket.off('disconnect');
        };
    }, [navigate]);

    const handleCreateRoom = () => {
        if (!socket.connected) { toast.error('Not connected to server.'); return; }
        setIsCreating(true);
        const code = generateRoomCode();
        setRoomCode(code);
        const word = drawingwords[Math.floor(Math.random() * drawingwords.length)];
        socket.emit('create-room', {
            roomCode: code,
            hostPlayer: { playerId: playerInfo.id, playerName: playerInfo.name, isHost: true, score: 0, character: playerInfo.character, socketId: socket.id },
            selectedWord: word
        });
    };

    const handleJoinRoom = () => {
        if (!inputCode.trim()) { toast.error('Enter a room code.'); return; }
        if (!socket.connected) { toast.error('Not connected to server.'); return; }
        setIsJoining(true);
        socket.emit('join-room', {
            roomCode: inputCode,
            player: { playerId: playerInfo.id, playerName: playerInfo.name, isHost: false, score: 0, character: playerInfo.character, socketId: socket.id },
        });
    };

    const generateRoomCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen flex flex-col items-center px-4 py-10">
            <div className="fixed inset-0 -z-10"><Background /></div>

            {/* Header */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-12">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                    <Sketchaa />
                    <Logo />
                </div>

                {playerInfo && (
                    <div className="flex items-center gap-2.5">
                        {/* Connection badge */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                            connected
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-red-50 border-red-200 text-red-600'
                        }`}>
                            {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
                            {connected ? 'Connected' : 'Disconnected'}
                        </div>
                        {/* Player badge */}
                        <div className="flex items-center gap-2 card px-3 py-1.5 rounded-full border-stone-200">
                            <img src={playerInfo.character} alt="" className="w-6 h-6 rounded-full" />
                            <span className="text-xs font-semibold text-stone-700">{playerInfo.name}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Page title */}
            <div className="text-center mb-10 animate-fade-slide-up">
                <h1 className="text-3xl font-extrabold text-stone-800 mb-2">Choose how to play</h1>
                <p className="text-stone-500 text-sm">Create a room or join one with a code</p>
            </div>

            {/* Cards */}
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-slide-up" style={{ animationDelay: '0.08s' }}>

                {/* ── Create Room ── */}
                <div className="card p-7 flex flex-col gap-5 group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                    <div>
                        <div className="w-11 h-11 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mb-4">
                            <Plus size={20} className="text-violet-600" />
                        </div>
                        <h2 className="font-bold text-stone-800 text-base mb-1">Create a Room</h2>
                        <p className="text-stone-500 text-xs leading-relaxed">
                            Start a new game. Share the code with friends so they can join.
                        </p>
                    </div>

                    <button
                        onClick={handleCreateRoom}
                        disabled={isCreating || !connected}
                        className={`btn w-full rounded-xl py-3 text-sm ${
                            isCreating || !connected
                                ? 'bg-stone-100 text-stone-400 cursor-not-allowed shadow-none'
                                : 'btn-dark'
                        }`}
                    >
                        {isCreating ? (
                            <><div className="w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" /> Creating…</>
                        ) : (
                            <><Plus size={15} /> Create Room</>
                        )}
                    </button>

                    {roomCode && (
                        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-center">
                            <p className="text-xs text-stone-400 font-medium mb-2 uppercase tracking-widest">Share this code</p>
                            <p className="font-mono text-3xl font-black text-stone-800 tracking-[0.2em] mb-3">{roomCode}</p>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 mx-auto text-xs text-stone-500 hover:text-stone-800 transition-colors bg-white border border-stone-200 rounded-full px-3 py-1.5"
                            >
                                {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                {copied ? 'Copied!' : 'Copy code'}
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Join Room ── */}
                <div className="card p-7 flex flex-col gap-5 group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                    <div>
                        <div className="w-11 h-11 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center mb-4">
                            <ArrowRight size={20} className="text-cyan-600" />
                        </div>
                        <h2 className="font-bold text-stone-800 text-base mb-1">Join a Room</h2>
                        <p className="text-stone-500 text-xs leading-relaxed">
                            Have a code? Enter it below to jump into an existing game.
                        </p>
                    </div>

                    <input
                        type="text"
                        placeholder="A1B2C3"
                        value={inputCode}
                        onChange={e => setInputCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && handleJoinRoom()}
                        maxLength={6}
                        className="w-full bg-stone-50 border border-stone-200 text-stone-800 placeholder-stone-300 rounded-xl px-4 py-3.5 font-mono text-2xl font-bold tracking-[0.3em] text-center uppercase focus:outline-none focus:ring-2 focus:ring-stone-800/15 focus:border-stone-400 transition-all"
                    />

                    <button
                        onClick={handleJoinRoom}
                        disabled={isJoining || !connected}
                        className={`btn w-full rounded-xl py-3 text-sm ${
                            isJoining || !connected
                                ? 'bg-stone-100 text-stone-400 cursor-not-allowed shadow-none'
                                : 'btn-dark'
                        }`}
                    >
                        {isJoining ? (
                            <><div className="w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" /> Joining…</>
                        ) : (
                            <><ArrowRight size={15} /> Join Room</>
                        )}
                    </button>
                </div>

                {/* ── How it works ── */}
                <div className="card p-7 flex flex-col gap-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                    <div>
                        <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-4">
                            <Bot size={20} className="text-amber-600" />
                        </div>
                        <h2 className="font-bold text-stone-800 text-base mb-1">How it works</h2>
                        <p className="text-stone-500 text-xs leading-relaxed">
                            A local AI model judges — no player voting, no bias.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        {[
                            { icon: <Clock size={13} className="text-stone-500" />, text: '60 seconds to draw your word' },
                            { icon: <Bot size={13} className="text-violet-500" />,  text: 'AI scores each drawing 1–10' },
                            { icon: <Trophy size={13} className="text-amber-500" />, text: 'Leaderboard reveals the winner' },
                        ].map((step, i) => (
                            <div key={i} className="flex items-center gap-3 bg-stone-50 rounded-xl px-3.5 py-2.5 border border-stone-100">
                                <div className="w-7 h-7 rounded-lg bg-white border border-stone-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                                    {step.icon}
                                </div>
                                <p className="text-xs text-stone-600 font-medium leading-snug">{step.text}</p>
                            </div>
                        ))}
                    </div>

                    <p className="text-xs text-stone-400 text-center mt-auto pt-2 border-t border-stone-100">
                        Runs locally · No API key required
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RoomPage;