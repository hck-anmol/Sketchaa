import React, { useRef, useEffect, useState } from 'react';
import Background from '../components/Background';
import Sketchaa from '../components/Sketchaa';
import Logo from '../components/Logo';
import DrawingCanvas from '../components/DrawingCanvas';
import { PencilIcon, LucideEraser, Trash, Send, Play, Users, Clock, MessageSquare, Crown, X, ChevronRight } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { drawingwords } from '../assets/assets';
import socket from '../socket';
import toast from 'react-hot-toast';
import { characterData, aboutImg } from '../assets/assets';

const COLORS = ['#1c1917','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#ffffff'];

const Room = () => {
    const { id: roomCode } = useParams();
    const [players, setPlayers] = useState([]);
    const [selectedWord, setSelectedWord] = useState('');
    const [containerWidth, setContainerWidth] = useState(800);
    const [containerHeight, setContainerHeight] = useState(600);
    const [isErasing, setIsErasing] = useState(false);
    const [time, setTime] = useState(60);
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [connectionStatus, setConnectionStatus] = useState('Connecting...');
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isHost, setIsHost] = useState(false);
    const [isWordChanging, setIsWordChanging] = useState(false);
    const [gameState, setGameState] = useState({ isStarted: false, startTime: null, duration: 60, remainingTime: 60 });
    const [isStartingGame, setIsStartingGame] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showPlayers, setShowPlayers] = useState(false);
    const [brushSize, setBrushSize] = useState(5);
    const [brushColor, setBrushColor] = useState('#1c1917');
    const [drawingSubmitted, setDrawingSubmitted] = useState(false);
    const [isSubmittingDrawing, setIsSubmittingDrawing] = useState(false);

    const canvasContainerRef = useRef(null);
    const canvasRef = useRef(null);
    const chatEndRef = useRef(null);
    const chatInputRef = useRef(null);
    const navigate = useNavigate();

    const getCharacterImage = (character) => {
        const map = { char1:'character3.png', char2:'character5.png', char3:'character6.png', char4:'character7.png', char5:'character8.png', char6:'character9.png', char7:'character10.png' };
        return map[character] || null;
    };

    const handleSubmitDrawing = () => {
        if (!currentPlayer || !canvasRef.current || drawingSubmitted || isSubmittingDrawing) return;
        if (!gameState.isStarted) { toast.error('Game must be started to submit drawing'); return; }
        setIsSubmittingDrawing(true);
        try {
            const image = canvasRef.current.getCanvasDataUrl();
            const characterImage = getCharacterImage(currentPlayer.character);
            socket.emit('submit-drawing', { roomCode, playerId: currentPlayer.id, playerName: currentPlayer.name, character: characterImage, image });
            setTimeout(() => { if (isSubmittingDrawing) setIsSubmittingDrawing(false); }, 10000);
        } catch (error) {
            setIsSubmittingDrawing(false);
            toast.error('Failed to submit drawing: ' + error.message);
        }
    };

    useEffect(() => { if (gameState.isStarted && time <= 0 && !drawingSubmitted) handleSubmitDrawing(); }, [time, gameState.isStarted, drawingSubmitted]);

    useEffect(() => {
        let id;
        if (gameState.isStarted && !drawingSubmitted) {
            id = setInterval(() => { if (time <= 3 && time > 0) handleSubmitDrawing(); }, 1000);
        }
        return () => { if (id) clearInterval(id); };
    }, [gameState.isStarted, drawingSubmitted, time]);

    useEffect(() => {
        const onUnload = () => {
            if (gameState.isStarted && !drawingSubmitted && canvasRef.current) {
                try { const image = canvasRef.current.getCanvasDataUrl(); const ci = getCharacterImage(currentPlayer?.character); socket.emit('submit-drawing', { roomCode, playerId: currentPlayer?.id, playerName: currentPlayer?.name, character: ci, image }); } catch {}
            }
        };
        window.addEventListener('beforeunload', onUnload);
        return () => window.removeEventListener('beforeunload', onUnload);
    }, [gameState.isStarted, drawingSubmitted, roomCode, currentPlayer]);

    useEffect(() => {
        const updateSize = () => {
            if (canvasContainerRef.current) {
                const r = canvasContainerRef.current.getBoundingClientRect();
                setContainerWidth(r.width); setContainerHeight(r.height);
            }
        };
        const playerInfo = JSON.parse(localStorage.getItem('playerInfoMulti'));
        if (!playerInfo) { toast.error('Player info not found.'); navigate('/'); return; }
        setCurrentPlayer(playerInfo);

        const storedRoomCode = localStorage.getItem('currentRoomCode');
        const storedPlayerId = localStorage.getItem('currentPlayerId');
        const storedPlayers = JSON.parse(localStorage.getItem('playersInRoom') || '[]');
        const storedWord = localStorage.getItem('selectedWord');
        const storedChat = JSON.parse(localStorage.getItem('chatMessages') || '[]');
        const storedGameState = JSON.parse(localStorage.getItem('gameState') || '{"isStarted":false,"startTime":null,"duration":60,"remainingTime":60}');

        if (storedPlayers.length > 0) { setPlayers(storedPlayers); const p = storedPlayers.find(x => x.playerId === playerInfo.id); if (p) setIsHost(p.isHost); }
        if (storedWord) setSelectedWord(storedWord);
        if (storedChat.length > 0) setChatMessages(storedChat);
        if (storedGameState) { setGameState(storedGameState); setTime(storedGameState.remainingTime); }

        updateSize();
        window.addEventListener('resize', updateSize);
        const ro = new ResizeObserver(updateSize);
        if (canvasContainerRef.current) ro.observe(canvasContainerRef.current);

        const handleConnect = () => {
            setIsConnected(true); setConnectionStatus('Connected');
            if (storedRoomCode === roomCode && storedPlayerId) socket.emit('rejoin-room', { roomCode, playerId: storedPlayerId });
        };
        const handleDisconnect = () => { setIsConnected(false); setConnectionStatus('Reconnecting...'); };
        const handlePlayersUpdated = (data) => {
            if (data && Array.isArray(data)) {
                setPlayers(data); localStorage.setItem('playersInRoom', JSON.stringify(data));
                setConnectionStatus(`${data.length} players`);
                const cp = data.find(p => p.playerId === localStorage.getItem('currentPlayerId'));
                if (cp) setIsHost(cp.isHost);
            }
        };
        const handleWordUpdated = (w) => { setSelectedWord(w); localStorage.setItem('selectedWord', w); setIsWordChanging(false); toast.success(`Word: ${w}`); };
        const handleNewMessage = (msg) => { setChatMessages(prev => { const u = [...prev, msg]; localStorage.setItem('chatMessages', JSON.stringify(u)); return u; }); };
        const handleGameStateUpdated = (gs) => { setGameState(gs); localStorage.setItem('gameState', JSON.stringify(gs)); if (gs.isStarted) setTime(gs.remainingTime); };
        const handleGameStarted = ({ startTime, duration }) => { setGameState(p => ({ ...p, isStarted: true, startTime, duration, remainingTime: duration })); setTime(duration); setIsStartingGame(false); setDrawingSubmitted(false); toast.success('Game started! Draw!'); };
        const handleTimeUpdate = (t) => { setTime(t); setGameState(p => ({ ...p, remainingTime: t })); };
        const handleRequestFinalDrawing = () => { if (canvasRef.current && !drawingSubmitted && gameState.isStarted) handleSubmitDrawing(); };
        const handleGameEnded = () => {
            if (gameState.isStarted && !drawingSubmitted) handleSubmitDrawing();
            setGameState(p => ({ ...p, isStarted: false, startTime: null, remainingTime: 60 })); setTime(60);
            toast.success('Game ended!'); navigate(`/room/${roomCode}/judge`);
        };
        const handleDrawingSubmitted = ({ success }) => { if (success) { setDrawingSubmitted(true); setIsSubmittingDrawing(false); } else { setIsSubmittingDrawing(false); toast.error('Failed to submit'); } };
        const handleRoomRejoined = ({ players: ps, selectedWord: w, chatMessages: chat, gameState: gs }) => {
            setPlayers(ps); setSelectedWord(w); setChatMessages(chat || []); setGameState(gs); setTime(gs.remainingTime);
            localStorage.setItem('playersInRoom', JSON.stringify(ps)); localStorage.setItem('selectedWord', w); localStorage.setItem('chatMessages', JSON.stringify(chat || [])); localStorage.setItem('gameState', JSON.stringify(gs));
            const cp = ps.find(p => p.playerId === localStorage.getItem('currentPlayerId')); if (cp) setIsHost(cp.isHost);
        };
        const handleRoomError = (msg) => { toast.error(msg); setIsStartingGame(false); setIsWordChanging(false); setIsSubmittingDrawing(false); };
        const handleGameResults = (r) => { sessionStorage.setItem('leaderboardData', JSON.stringify(r)); navigate(`/room/${roomCode}/judge`); };

        socket.on('connect', handleConnect); socket.on('disconnect', handleDisconnect); socket.on('players-updated', handlePlayersUpdated);
        socket.on('word-updated', handleWordUpdated); socket.on('new-message', handleNewMessage); socket.on('game-state-updated', handleGameStateUpdated);
        socket.on('game-started', handleGameStarted); socket.on('time-update', handleTimeUpdate); socket.on('request-final-drawing', handleRequestFinalDrawing);
        socket.on('game-ended', handleGameEnded); socket.on('drawing-submitted', handleDrawingSubmitted); socket.on('room-rejoined', handleRoomRejoined);
        socket.on('room-error', handleRoomError); socket.on('game-results', handleGameResults);
        socket.on('drawing-phase-ended', () => navigate(`/room/${roomCode}/judge`));
        if (socket.connected) handleConnect();

        return () => {
            socket.off('connect', handleConnect); socket.off('disconnect', handleDisconnect); socket.off('players-updated', handlePlayersUpdated);
            socket.off('word-updated', handleWordUpdated); socket.off('new-message', handleNewMessage); socket.off('game-state-updated', handleGameStateUpdated);
            socket.off('game-started', handleGameStarted); socket.off('time-update', handleTimeUpdate); socket.off('request-final-drawing', handleRequestFinalDrawing);
            socket.off('game-ended', handleGameEnded); socket.off('drawing-submitted', handleDrawingSubmitted); socket.off('room-rejoined', handleRoomRejoined);
            socket.off('room-error', handleRoomError); socket.off('game-results', handleGameResults); socket.off('drawing-phase-ended');
            window.removeEventListener('resize', updateSize); ro.disconnect();
        };
    }, [roomCode, navigate]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

    const handleStartGame = () => {
        if (!isHost) { toast.error('Only the host can start'); return; }
        if (gameState.isStarted) { toast.error('Game already started'); return; }
        sessionStorage.removeItem('leaderboardData'); localStorage.removeItem('chatMessages'); localStorage.removeItem('gameState');
        setIsStartingGame(true);
        socket.emit('start-game', { roomCode, playerId: currentPlayer.id });
    };
    const handleWordChange = () => {
        if (!isHost) { toast.error('Only the host can change the word'); return; }
        setIsWordChanging(true);
        socket.emit('change-word', { roomCode, newWord: drawingwords[Math.floor(Math.random() * drawingwords.length)], playerId: currentPlayer.id });
    };
    const handleSendMessage = () => {
        if (!newMessage.trim()) return;
        socket.emit('send-message', { roomCode, message: newMessage.trim(), playerId: currentPlayer.id });
        setNewMessage('');
    };
    const handleKeyPress = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };
    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const handleClearCanvas = () => { if (canvasRef.current) canvasRef.current.clearCanvas(); };
    const handleLeaveRoom = () => {
        ['currentRoomCode','currentPlayerId','playersInRoom','selectedWord','chatMessages','gameState'].forEach(k => localStorage.removeItem(k));
        sessionStorage.removeItem('leaderboardData');
        navigate('/room');
    };
    const handleManualSubmit = () => {
        if (!gameState.isStarted) { toast.error('Game must be started'); return; }
        if (drawingSubmitted) { toast.info('Already submitted'); return; }
        handleSubmitDrawing();
    };

    if (!currentPlayer) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f0e8' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800" />
        </div>
    );

    const timerPct = (time / 60) * 100;
    const timerColor = time <= 10 ? '#ef4444' : time <= 20 ? '#f97316' : '#1c1917';

    return (
        <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#f5f0e8' }}>

            {/* ── Top bar ── */}
            <div className="bg-white border-b border-stone-200 px-4 py-2.5 flex items-center justify-between flex-shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
                        <Sketchaa />
                    </div>
                    <div className="h-5 w-px bg-stone-200 hidden sm:block" />
                    <div className="hidden sm:flex items-center gap-1.5 bg-stone-100 rounded-lg px-2.5 py-1">
                        <span className="text-xs text-stone-500 font-medium">Room</span>
                        <span className="text-xs font-bold text-stone-800 font-mono">{roomCode}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Timer */}
                    <div
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 font-mono font-black text-lg"
                        style={{ borderColor: timerColor, color: timerColor, background: `${timerColor}10` }}
                    >
                        <Clock size={15} />
                        {formatTime(time)}
                    </div>

                    {/* Status */}
                    {gameState.isStarted && (
                        <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${drawingSubmitted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                            {drawingSubmitted ? '✓ Submitted' : 'Drawing…'}
                        </div>
                    )}

                    <button onClick={() => setShowPlayers(!showPlayers)} className="btn btn-outline px-3 py-1.5 rounded-xl text-xs gap-1.5">
                        <Users size={13} /> {players.length}
                    </button>
                    <button onClick={() => setShowChat(!showChat)} className="btn btn-outline px-3 py-1.5 rounded-xl text-xs gap-1.5">
                        <MessageSquare size={13} />
                        <span className="hidden sm:inline">Chat</span>
                    </button>
                    <button onClick={handleLeaveRoom} className="btn px-3 py-1.5 rounded-xl text-xs bg-red-50 text-red-600 border border-red-200 hover:bg-red-100">
                        Leave
                    </button>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 flex overflow-hidden">

                {/* ── Left sidebar ── */}
                <div className="w-64 xl:w-72 bg-white border-r border-stone-200 flex flex-col gap-3 p-4 overflow-y-auto no-scrollbar flex-shrink-0">

                    {/* Word */}
                    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
                        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">Word to Draw</p>
                        <p className="text-xl font-black text-stone-800 mb-3">
                            {selectedWord || <span className="text-stone-300">—</span>}
                        </p>
                        {isHost && !gameState.isStarted && (
                            <button
                                onClick={handleWordChange}
                                disabled={isWordChanging}
                                className={`btn w-full rounded-xl py-2 text-xs ${isWordChanging ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'btn-outline'}`}
                            >
                                {isWordChanging ? 'Changing…' : '🔀 New Word'}
                            </button>
                        )}
                    </div>

                    {/* Game control */}
                    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
                        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Game</p>
                        {isHost && !gameState.isStarted && (
                            <button
                                onClick={handleStartGame}
                                disabled={isStartingGame}
                                className={`btn w-full rounded-xl py-3 text-sm font-bold gap-2 ${isStartingGame ? 'bg-stone-100 text-stone-400' : 'btn-dark'}`}
                            >
                                {isStartingGame ? <><div className="w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" /> Starting…</> : <><Play size={15} /> Start Game</>}
                            </button>
                        )}
                        {!isHost && !gameState.isStarted && (
                            <p className="text-xs text-stone-400 text-center py-2">Waiting for host to start…</p>
                        )}
                        {gameState.isStarted && (
                            <div className="space-y-2">
                                <div className="text-center mb-2">
                                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">🎮 Game in Progress</span>
                                </div>
                                <button
                                    onClick={handleManualSubmit}
                                    disabled={drawingSubmitted || isSubmittingDrawing}
                                    className={`btn w-full rounded-xl py-2.5 text-sm font-semibold gap-2 ${drawingSubmitted ? 'bg-emerald-600 text-white cursor-not-allowed' : isSubmittingDrawing ? 'bg-stone-100 text-stone-400' : 'btn-dark'}`}
                                >
                                    <Send size={13} />
                                    {drawingSubmitted ? 'Submitted ✓' : isSubmittingDrawing ? 'Submitting…' : 'Submit Drawing'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Drawing tools */}
                    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex-1">
                        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Tools</p>

                        {/* Pen / Eraser toggle */}
                        <div className="flex gap-1.5 mb-4 p-1 bg-stone-100 rounded-xl">
                            <button
                                onClick={() => setIsErasing(false)}
                                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${!isErasing ? 'bg-white text-stone-800 shadow-sm border border-stone-200' : 'text-stone-500'}`}
                            >
                                <PencilIcon size={12} /> Draw
                            </button>
                            <button
                                onClick={() => setIsErasing(true)}
                                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${isErasing ? 'bg-white text-stone-800 shadow-sm border border-stone-200' : 'text-stone-500'}`}
                            >
                                <LucideEraser size={12} /> Erase
                            </button>
                        </div>

                        {/* Color palette */}
                        <div className="mb-4">
                            <p className="text-xs text-stone-400 mb-2">Color</p>
                            <div className="flex flex-wrap gap-1.5">
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => { setBrushColor(c); setIsErasing(false); }}
                                        className="w-7 h-7 rounded-lg border-2 transition-all hover:scale-110"
                                        style={{
                                            background: c,
                                            borderColor: brushColor === c && !isErasing ? '#1c1917' : c === '#ffffff' ? '#d6d3d1' : c,
                                            boxShadow: brushColor === c && !isErasing ? '0 0 0 2px #f5f0e8, 0 0 0 4px #1c1917' : 'none'
                                        }}
                                    />
                                ))}
                                {/* Custom color */}
                                <div className="relative w-7 h-7">
                                    <input
                                        type="color"
                                        value={brushColor}
                                        onChange={e => { setBrushColor(e.target.value); setIsErasing(false); }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="w-7 h-7 rounded-lg border-2 border-stone-300 border-dashed flex items-center justify-center text-stone-400 text-xs pointer-events-none">+</div>
                                </div>
                            </div>
                        </div>

                        {/* Brush size */}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-xs text-stone-400">Brush Size</p>
                                <span className="text-xs font-bold text-stone-600">{brushSize}px</span>
                            </div>
                            <input type="range" min="1" max="30" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-full slider" />
                        </div>

                        {/* Clear */}
                        <button
                            onClick={handleClearCanvas}
                            className="btn btn-outline w-full rounded-xl py-2 text-xs text-red-500 border-red-200 hover:bg-red-50 gap-1.5"
                        >
                            <Trash size={12} /> Clear Canvas
                        </button>
                    </div>
                </div>

                {/* ── Canvas ── */}
                <div className="flex-1 p-4 flex items-center justify-center bg-stone-50/60">
                    <div
                        ref={canvasContainerRef}
                        className="w-full h-full bg-white rounded-2xl shadow-md overflow-hidden border border-stone-200"
                        style={{ maxHeight: 'calc(100vh - 120px)' }}
                    >
                        <DrawingCanvas
                            ref={canvasRef}
                            width={containerWidth}
                            height={containerHeight}
                            brushSize={brushSize}
                            brushColor={brushColor}
                            isErasing={isErasing}
                            disabled={!gameState.isStarted}
                        />
                    </div>
                </div>
            </div>

            {/* ── Players panel ── */}
            {showPlayers && (
                <div className="fixed top-0 right-0 h-full w-72 bg-white border-l border-stone-200 p-5 z-40 shadow-xl flex flex-col">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-stone-800">Players ({players.length})</h3>
                        <button onClick={() => setShowPlayers(false)} className="text-stone-400 hover:text-stone-700">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="space-y-2 overflow-y-auto no-scrollbar">
                        {players.map(p => (
                            <div key={p.playerId} className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl p-3">
                                <img src={p.character} alt="" className="w-9 h-9 rounded-full" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-stone-800 text-sm flex items-center gap-1.5 truncate">
                                        {p.playerName}
                                        {p.isHost && <Crown size={13} className="text-amber-500 flex-shrink-0" />}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Chat panel ── */}
            {showChat && (
                <div className="fixed bottom-0 right-0 h-96 w-80 bg-white border-l border-t border-stone-200 rounded-tl-2xl flex flex-col z-50 shadow-xl">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
                        <h3 className="font-semibold text-stone-800 text-sm flex items-center gap-2">
                            <MessageSquare size={15} className="text-stone-400" /> Chat
                        </h3>
                        <button onClick={() => setShowChat(false)} className="text-stone-400 hover:text-stone-700">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
                        {chatMessages.map(msg => (
                            <div key={msg.id} className="bg-stone-50 border border-stone-100 rounded-xl p-2.5">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <img src={msg.character} alt="" className="w-5 h-5 rounded-full" />
                                    <span className="text-stone-700 font-semibold text-xs">{msg.playerName}</span>
                                </div>
                                <p className="text-stone-600 text-xs break-words leading-relaxed">{msg.message}</p>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <div className="p-3 border-t border-stone-200">
                        <div className="flex gap-2">
                            <textarea
                                ref={chatInputRef}
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Say something…"
                                className="flex-1 bg-stone-50 border border-stone-200 text-stone-800 placeholder-stone-300 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-stone-800/15 text-xs"
                                rows="1"
                                maxLength={500}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim()}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${newMessage.trim() ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-100 text-stone-300 cursor-not-allowed'}`}
                            >
                                <Send size={13} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Room;