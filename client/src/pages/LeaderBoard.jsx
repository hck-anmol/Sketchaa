import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, Home, MessageSquare, X, Send, Crown, Medal, Award, Bot, Sparkles, Users } from 'lucide-react';
import socket from '../socket';
import toast from 'react-hot-toast';
import Sketchaa from '../components/Sketchaa';

const RankBadge = ({ rank }) => {
    if (rank === 1) return <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-md"><Crown size={16} className="text-white" /></div>;
    if (rank === 2) return <div className="w-8 h-8 bg-stone-400 rounded-full flex items-center justify-center shadow-sm"><Medal size={16} className="text-white" /></div>;
    if (rank === 3) return <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center shadow-sm"><Award size={16} className="text-white" /></div>;
    return <div className="w-8 h-8 bg-stone-100 border border-stone-200 rounded-full flex items-center justify-center text-stone-600 font-bold text-sm">{rank}</div>;
};

const ScoreBar = ({ score }) => (
    <div className="flex gap-0.5 mt-1.5">
        {[...Array(10)].map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full ${i < score ? 'bg-violet-500' : 'bg-stone-200'}`} />
        ))}
    </div>
);

const LeaderboardPage = () => {
    const { id: roomCode } = useParams();
    const navigate = useNavigate();
    const [gameResults, setGameResults] = useState(null);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedDrawing, setSelectedDrawing] = useState(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        const playerInfo = JSON.parse(localStorage.getItem('playerInfoMulti'));
        const storedResults = JSON.parse(sessionStorage.getItem('leaderboardData') || 'null');
        const storedChat = JSON.parse(localStorage.getItem('chatMessages') || '[]');
        if (!playerInfo) { toast.error('Player info not found.'); navigate('/'); return; }
        setCurrentPlayer(playerInfo);
        setChatMessages(storedChat);
        if (storedResults?.results) { setGameResults(storedResults); } else { socket.emit('request-game-results', { roomCode }); }

        const handleNewMessage = (msg) => setChatMessages(prev => { const u=[...prev,msg]; localStorage.setItem('chatMessages',JSON.stringify(u)); return u; });
        const handleGameResults = (r) => { setGameResults(r); sessionStorage.setItem('leaderboardData', JSON.stringify(r)); };
        socket.on('new-message', handleNewMessage);
        socket.on('game-results', handleGameResults);
        return () => { socket.off('new-message', handleNewMessage); socket.off('game-results', handleGameResults); };
    }, [roomCode, navigate]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

    const handleSendMessage = () => {
        if (!newMessage.trim() || !currentPlayer) return;
        socket.emit('send-message', { roomCode, message: newMessage.trim(), playerId: currentPlayer.id });
        setNewMessage('');
    };

    const handleBackToHome = () => {
        ['leaderboardData'].forEach(k => sessionStorage.removeItem(k));
        ['chatMessages','playerInfoMulti','selectedWord','currentRoomCode','currentPlayerId','playersInRoom','gameState'].forEach(k => localStorage.removeItem(k));
        navigate('/');
    };

    if (!gameResults || !currentPlayer) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f0e8' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800" />
            </div>
        );
    }

    const sorted = [...gameResults.results].sort((a, b) => {
        if (b.aiScore !== a.aiScore) return b.aiScore - a.aiScore;
        if (a.hasSubmitted && !b.hasSubmitted) return -1;
        if (!a.hasSubmitted && b.hasSubmitted) return 1;
        return 0;
    }).map((r, i) => ({ ...r, rank: i + 1 }));

    const winner = sorted[0];
    const me = sorted.find(r => r.playerId === currentPlayer.id);

    return (
        <div className="min-h-screen" style={{ background: '#f5f0e8' }}>

            {/* Header */}
            <div className="bg-white border-b border-stone-200 px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="cursor-pointer" onClick={() => navigate('/')}><Sketchaa /></div>
                    <div className="h-5 w-px bg-stone-200" />
                    <div>
                        <h1 className="font-bold text-stone-800 flex items-center gap-2">
                            <Trophy size={16} className="text-amber-500" /> Final Results
                        </h1>
                        <p className="text-xs text-stone-400 flex items-center gap-1">
                            <Bot size={10} className="text-violet-500" />
                            Judged by qwen2.5vl:7b · {gameResults.results.length} players
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowChat(!showChat)} className="btn btn-outline px-3 py-2 rounded-xl text-xs gap-1.5">
                        <MessageSquare size={13} /> Chat
                    </button>
                    <button onClick={handleBackToHome} className="btn btn-dark px-4 py-2 rounded-xl text-xs gap-1.5">
                        <Home size={13} /> Home
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

                {/* Word */}
                {gameResults.selectedWord && (
                    <div className="text-center">
                        <div className="inline-block bg-white border border-stone-200 rounded-2xl px-8 py-4 shadow-sm">
                            <p className="text-xs text-stone-400 font-medium uppercase tracking-widest mb-1">The word was</p>
                            <p className="text-3xl font-black text-stone-800">{gameResults.selectedWord}</p>
                        </div>
                    </div>
                )}

                {/* Winner */}
                {winner?.hasSubmitted && (
                    <div className="bg-white border-2 border-amber-300 rounded-3xl p-8 text-center shadow-md relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300" />
                        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
                            <Crown size={13} /> Winner
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            {winner.image && (
                                <img src={winner.image} alt="winning drawing" className="w-32 h-32 object-contain bg-stone-50 rounded-2xl border-2 border-amber-200" />
                            )}
                            <div className="text-left sm:text-left">
                                <div className="flex items-center gap-3 mb-2">
                                    <img src={winner.character} alt="" className="w-10 h-10 rounded-full border-2 border-amber-300" />
                                    <p className="text-2xl font-black text-stone-800">{winner.playerName}</p>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Bot size={14} className="text-violet-500" />
                                    <span className="font-bold text-stone-700">Score: <span className="text-violet-600">{winner.aiScore}</span>/10</span>
                                </div>
                                {winner.aiFeedback && (
                                    <p className="text-stone-500 text-sm italic max-w-xs">"{winner.aiFeedback}"</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Your result */}
                {me && (
                    <div className={`bg-white border-2 rounded-2xl p-5 shadow-sm ${me.rank === 1 ? 'border-amber-300' : me.rank <= 3 ? 'border-stone-300' : 'border-stone-200'}`}>
                        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Your Result</p>
                        <div className="flex items-center gap-6 flex-wrap">
                            <div className="flex items-center gap-2">
                                <RankBadge rank={me.rank} />
                                <div>
                                    <p className="font-bold text-stone-800">Rank #{me.rank}</p>
                                    <p className="text-xs text-stone-400">of {sorted.length}</p>
                                </div>
                            </div>
                            <div className="h-8 w-px bg-stone-100" />
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <Bot size={13} className="text-violet-500" />
                                    <span className="font-black text-stone-800 text-xl">{me.aiScore}</span>
                                    <span className="text-stone-400 text-sm font-medium">/10</span>
                                </div>
                                <ScoreBar score={me.aiScore} />
                            </div>
                            {me.aiFeedback && (
                                <>
                                    <div className="h-8 w-px bg-stone-100 hidden sm:block" />
                                    <p className="text-stone-500 text-sm italic flex-1">"{me.aiFeedback}"</p>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Rankings */}
                <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-2">
                        <Trophy size={16} className="text-amber-500" />
                        <h2 className="font-bold text-stone-800">Leaderboard</h2>
                    </div>
                    <div className="divide-y divide-stone-100">
                        {sorted.map((player) => (
                            <div
                                key={player.playerId}
                                onClick={() => setSelectedDrawing(player)}
                                className={`flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-stone-50 transition-colors ${player.rank === 1 ? 'bg-amber-50/50' : ''}`}
                            >
                                <RankBadge rank={player.rank} />
                                <img src={player.character} alt="" className="w-10 h-10 rounded-full border border-stone-200" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-stone-800 text-sm truncate flex items-center gap-2">
                                        {player.playerName}
                                        {player.playerId === currentPlayer.id && <span className="text-xs text-stone-400 font-normal">(you)</span>}
                                    </div>
                                    {player.aiFeedback && (
                                        <p className="text-xs text-stone-400 truncate italic">{player.aiFeedback}</p>
                                    )}
                                    <ScoreBar score={player.aiScore} />
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className="flex items-center gap-1 justify-end">
                                        <span className="text-xl font-black text-stone-800">{player.aiScore}</span>
                                        <span className="text-stone-400 text-xs">/10</span>
                                    </div>
                                    {player.image && (
                                        <img src={player.image} alt="" className="w-12 h-12 object-contain bg-stone-50 rounded-lg border border-stone-200 mt-1 ml-auto" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-stone-200 rounded-2xl p-5 text-center shadow-sm">
                        <p className="text-2xl font-black text-stone-800 mb-1">{gameResults.results.filter(p => p.hasSubmitted).length}</p>
                        <p className="text-xs text-stone-400 font-medium">Drawings Submitted</p>
                    </div>
                    <div className="bg-white border border-stone-200 rounded-2xl p-5 text-center shadow-sm">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                            <Bot size={16} className="text-violet-500" />
                            <p className="text-sm font-bold text-stone-800">Local AI</p>
                        </div>
                        <p className="text-xs text-stone-400 font-medium">qwen2.5vl:7b · No API key</p>
                    </div>
                </div>
            </div>

            {/* Drawing modal */}
            {selectedDrawing && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedDrawing(null)}>
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <img src={selectedDrawing.character} alt="" className="w-9 h-9 rounded-full border border-stone-200" />
                                <div>
                                    <p className="font-bold text-stone-800">{selectedDrawing.playerName}</p>
                                    <div className="flex items-center gap-1">
                                        <RankBadge rank={selectedDrawing.rank} />
                                        <span className="text-xs text-stone-400">Rank #{selectedDrawing.rank}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedDrawing(null)} className="text-stone-400 hover:text-stone-700"><X size={20} /></button>
                        </div>
                        {selectedDrawing.image ? (
                            <img src={selectedDrawing.image} alt="drawing" className="w-full h-64 object-contain bg-stone-50 rounded-2xl border border-stone-200 mb-4" />
                        ) : (
                            <div className="h-64 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200 flex items-center justify-center mb-4">
                                <p className="text-stone-400 text-sm">No drawing submitted</p>
                            </div>
                        )}
                        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-violet-600 flex items-center gap-1.5"><Sparkles size={12} /> AI Score</span>
                                <span className="font-black text-stone-800 text-xl">{selectedDrawing.aiScore}<span className="text-sm text-stone-400 font-normal">/10</span></span>
                            </div>
                            <ScoreBar score={selectedDrawing.aiScore} />
                            {selectedDrawing.aiFeedback && (
                                <p className="text-stone-600 text-sm italic mt-3 leading-relaxed">"{selectedDrawing.aiFeedback}"</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Chat */}
            {showChat && (
                <div className="fixed bottom-0 right-0 h-96 w-80 bg-white border-l border-t border-stone-200 rounded-tl-2xl flex flex-col z-50 shadow-xl">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
                        <h3 className="font-semibold text-stone-800 text-sm">Chat</h3>
                        <button onClick={() => setShowChat(false)} className="text-stone-400 hover:text-stone-700"><X size={18} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
                        {chatMessages.map(msg => (
                            <div key={msg.id} className="bg-stone-50 border border-stone-100 rounded-xl p-2.5">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <img src={msg.character} alt="" className="w-4 h-4 rounded-full" />
                                    <span className="text-xs font-semibold text-stone-700">{msg.playerName}</span>
                                </div>
                                <p className="text-xs text-stone-600 break-words">{msg.message}</p>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <div className="p-3 border-t border-stone-200">
                        <div className="flex gap-2">
                            <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyPress={e => e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),handleSendMessage())} placeholder="Say something…" className="flex-1 bg-stone-50 border border-stone-200 text-stone-800 placeholder-stone-300 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-stone-800/15 text-xs" rows="1" maxLength={500} />
                            <button onClick={handleSendMessage} disabled={!newMessage.trim()} className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${newMessage.trim() ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-stone-100 text-stone-300 cursor-not-allowed'}`}><Send size={13} /></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaderboardPage;