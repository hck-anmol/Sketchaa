import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, X, Send, Trophy, ArrowRight, Bot, AlertCircle, Sparkles } from 'lucide-react';
import socket from '../socket';
import toast from 'react-hot-toast';
import Sketchaa from '../components/Sketchaa';
import Logo from '../components/Logo';

const DrawingCard = ({ player, aiResult, index }) => {
    const isJudged = !!aiResult;
    return (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">

            {/* Header */}
            <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    {player.character && (
                        <img src={player.character} alt="" className="w-8 h-8 rounded-full border border-stone-200" />
                    )}
                    <div>
                        <p className="font-semibold text-stone-800 text-sm">{player.playerName || `Player ${index + 1}`}</p>
                        <p className={`text-xs font-medium ${player.hasSubmitted ? 'text-emerald-600' : 'text-red-500'}`}>
                            {player.hasSubmitted ? '✓ Submitted' : '✗ No submission'}
                        </p>
                    </div>
                </div>
                {isJudged ? (
                    <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 text-violet-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                        <Sparkles size={11} /> Judged
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full text-xs font-semibold animate-pulse">
                        <Bot size={11} /> Judging…
                    </div>
                )}
            </div>

            {/* Drawing */}
            <div className="mx-4 mb-3">
                {player.image ? (
                    <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
                        <img src={player.image} alt="drawing" className="w-full h-48 object-contain" />
                        {!isJudged && (
                            <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px] flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-10 h-10 border-3 border-stone-300 border-t-stone-800 rounded-full animate-spin mx-auto mb-2" style={{ borderWidth: 3 }} />
                                    <p className="text-stone-600 text-xs font-semibold">AI is evaluating…</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-48 rounded-xl border-2 border-dashed border-stone-200 flex items-center justify-center bg-stone-50">
                        <p className="text-stone-400 text-xs">No drawing submitted</p>
                    </div>
                )}
            </div>

            {/* Result */}
            <div className={`mx-4 mb-4 rounded-xl p-3.5 border transition-all duration-500 ${isJudged ? 'bg-violet-50 border-violet-200' : 'bg-stone-50 border-stone-100'}`}>
                {isJudged ? (
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-stone-500 flex items-center gap-1.5">
                                <Bot size={12} className="text-violet-500" /> AI Score
                            </span>
                            <span className="text-xl font-black text-stone-800">{aiResult.aiScore}<span className="text-sm font-medium text-stone-400">/10</span></span>
                        </div>
                        {/* Score bar */}
                        <div className="flex gap-0.5">
                            {[...Array(10)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i < aiResult.aiScore ? 'bg-violet-500' : 'bg-stone-200'}`}
                                    style={{ transitionDelay: `${i * 60}ms` }}
                                />
                            ))}
                        </div>
                        {aiResult.aiFeedback && (
                            <div className="bg-white rounded-lg px-3 py-2 border border-violet-100">
                                {aiResult.aiError && (
                                    <p className="text-xs text-amber-600 flex items-center gap-1 mb-1">
                                        <AlertCircle size={10} /> Fallback score
                                    </p>
                                )}
                                <p className="text-stone-600 text-xs italic leading-relaxed">"{aiResult.aiFeedback}"</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-stone-400 text-xs">
                        <div className="w-3.5 h-3.5 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                        Waiting for verdict…
                    </div>
                )}
            </div>
        </div>
    );
};

const JudgePage = () => {
    const { id: roomCode } = useParams();
    const navigate = useNavigate();
    const [players, setPlayers] = useState([]);
    const [aiResults, setAiResults] = useState({});
    const [totalDrawings, setTotalDrawings] = useState(0);
    const [selectedWord, setSelectedWord] = useState('');
    const [isJudgingStarted, setIsJudgingStarted] = useState(false);
    const [allJudged, setAllJudged] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const chatEndRef = useRef(null);
    const navigatedRef = useRef(false);

    useEffect(() => {
        const playerInfo = JSON.parse(localStorage.getItem('playerInfoMulti'));
        const storedChat = JSON.parse(localStorage.getItem('chatMessages') || '[]');
        const storedWord = localStorage.getItem('selectedWord') || '';
        if (!playerInfo) { toast.error('Player info not found.'); navigate('/'); return; }
        setCurrentPlayer(playerInfo);
        setChatMessages(storedChat);
        setSelectedWord(storedWord);

        const handleNewMessage = (msg) => setChatMessages(prev => { const u=[...prev,msg]; localStorage.setItem('chatMessages',JSON.stringify(u)); return u; });
        const handleAiJudgingStarted = ({ totalDrawings: total }) => { setIsJudgingStarted(true); setTotalDrawings(total); toast('🤖 AI is evaluating drawings…', { duration: 3000 }); };
        const handleAiJudgingProgress = ({ result }) => {
            setAiResults(prev => ({ ...prev, [result.playerId]: result }));
            setPlayers(prev => prev.map(p => p.playerId === result.playerId ? { ...p, image: result.image, hasSubmitted: result.hasSubmitted, character: result.character || p.character } : p));
        };
        const handleGameResults = (results) => { sessionStorage.setItem('leaderboardData', JSON.stringify(results)); setAllJudged(true); toast.success('All drawings judged!'); setTimeout(() => { if (!navigatedRef.current) { navigatedRef.current = true; navigate(`/room/${roomCode}/results`); } }, 3500); };
        const handleRoomDrawings = ({ results, selectedWord: word }) => { if (results) { setPlayers(results); setTotalDrawings(results.length); } if (word) setSelectedWord(word); };
        const handleRoomError = (msg) => toast.error(msg);

        socket.on('new-message', handleNewMessage);
        socket.on('ai-judging-started', handleAiJudgingStarted);
        socket.on('ai-judging-progress', handleAiJudgingProgress);
        socket.on('game-results', handleGameResults);
        socket.on('room-drawings', handleRoomDrawings);
        socket.on('room-error', handleRoomError);
        socket.emit('get-room-drawings', { roomCode });

        return () => {
            socket.off('new-message', handleNewMessage);
            socket.off('ai-judging-started', handleAiJudgingStarted);
            socket.off('ai-judging-progress', handleAiJudgingProgress);
            socket.off('game-results', handleGameResults);
            socket.off('room-drawings', handleRoomDrawings);
            socket.off('room-error', handleRoomError);
        };
    }, [roomCode, navigate]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

    const handleSendMessage = () => {
        if (!newMessage.trim() || !currentPlayer) return;
        socket.emit('send-message', { roomCode, message: newMessage.trim(), playerId: currentPlayer.id });
        setNewMessage('');
    };

    const judgedCount = Object.keys(aiResults).length;
    const progressPct = totalDrawings > 0 ? Math.round((judgedCount / totalDrawings) * 100) : 0;

    return (
        <div className="min-h-screen" style={{ background: '#f5f0e8' }}>

            {/* Header */}
            <div className="bg-white border-b border-stone-200 px-6 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="cursor-pointer" onClick={() => navigate('/')}><Sketchaa /></div>
                    <div className="h-5 w-px bg-stone-200" />
                    <div>
                        <h1 className="font-bold text-stone-800 text-base flex items-center gap-2">
                            <Bot size={16} className="text-violet-500" />
                            AI Judge
                        </h1>
                        <p className="text-xs text-stone-400">qwen2.5vl:7b</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowChat(!showChat)} className="btn btn-outline px-3 py-2 rounded-xl text-xs gap-1.5">
                        <MessageSquare size={13} /> Chat
                    </button>
                    {allJudged && (
                        <button
                            onClick={() => { navigatedRef.current = true; navigate(`/room/${roomCode}/results`); }}
                            className="btn btn-dark px-4 py-2 rounded-xl text-xs gap-1.5"
                        >
                            Results <ArrowRight size={13} />
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Word */}
                {selectedWord && (
                    <div className="text-center mb-8">
                        <div className="inline-block bg-white border border-stone-200 rounded-2xl px-8 py-4 shadow-sm">
                            <p className="text-xs text-stone-400 font-medium uppercase tracking-widest mb-1">The word was</p>
                            <p className="text-3xl font-black text-stone-800">{selectedWord}</p>
                        </div>
                    </div>
                )}

                {/* Progress */}
                <div className="bg-white border border-stone-200 rounded-2xl px-6 py-4 mb-8 shadow-sm">
                    <div className="flex items-center justify-between mb-2.5">
                        <span className="text-sm font-semibold text-stone-700 flex items-center gap-2">
                            <Bot size={15} className="text-violet-500" />
                            {allJudged ? '✅ All drawings judged!' : isJudgingStarted ? `Judging ${judgedCount} of ${totalDrawings}…` : 'Waiting…'}
                        </span>
                        <span className="text-sm font-bold text-stone-800">{progressPct}%</span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full transition-all duration-700" style={{ width: `${progressPct}%` }} />
                    </div>
                </div>

                {/* All judged banner */}
                {allJudged && (
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-8 py-4 font-semibold">
                            <Trophy size={20} className="text-emerald-500" />
                            All done! Heading to results…
                        </div>
                    </div>
                )}

                {/* Cards */}
                {players.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-3 border-stone-200 border-t-stone-800 rounded-full animate-spin mb-4" style={{ borderWidth: 3 }} />
                        <p className="text-stone-600 font-semibold">Loading drawings…</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {players.map((player, i) => (
                            <DrawingCard key={player.playerId} player={player} aiResult={aiResults[player.playerId] || null} index={i} />
                        ))}
                    </div>
                )}
            </div>

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

export default JudgePage;