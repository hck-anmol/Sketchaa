import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, MessageSquare, X, Send, ArrowRight, Star, Trophy, Users, Check, Eye } from 'lucide-react';
import socket from '../socket';
import toast from 'react-hot-toast';
import Background from '../components/Background';
import Sketchaa from '../components/Sketchaa';
import { characterData, aboutImg } from '../assets/assets';
import Logo from '../components/Logo';

const JudgePage = () => {
    const { id: roomCode } = useParams();
    const navigate = useNavigate();
    const [gameResults, setGameResults] = useState(null);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [scores, setScores] = useState({});
    const [submittedScores, setSubmittedScores] = useState(new Set());
    const [timeLeft, setTimeLeft] = useState(60);
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [connectionStatus, setConnectionStatus] = useState('Connecting...');
    const [scoringHistory, setScoringHistory] = useState(new Set());
    const [canViewResults, setCanViewResults] = useState(false);
    const [votingComplete, setVotingComplete] = useState(false);

    const chatEndRef = useRef(null);
    const chatInputRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        const playerInfo = JSON.parse(localStorage.getItem('playerInfoMulti'));
        const storedResults = JSON.parse(sessionStorage.getItem('leaderboardData') || '{}');
        const storedChatMessages = JSON.parse(localStorage.getItem('chatMessages') || '[]');

        if (!playerInfo) {
            toast.error('Player info not found.');
            navigate('/');
            return;
        }

        setCurrentPlayer(playerInfo);
        setChatMessages(storedChatMessages);


        socket.emit('get-room-drawings', { roomCode });


        socket.emit('get-scoring-history', { roomCode, playerId: playerInfo.id });

        const handleConnect = () => {
            setIsConnected(true);
            setConnectionStatus('Connected');
        };

        const handleDisconnect = () => {
            setIsConnected(false);
            setConnectionStatus('Reconnecting...');
        };

        const handleNewMessage = (message) => {
            setChatMessages(prev => {
                const updated = [...prev, message];
                localStorage.setItem('chatMessages', JSON.stringify(updated));
                return updated;
            });
        };

        const handleRoomDrawings = ({ results, roomCode: responseRoomCode, selectedWord }) => {
            setGameResults({
                roomCode: responseRoomCode,
                results,
                selectedWord: selectedWord || localStorage.getItem('selectedWord') || ''
            });
        };

        const handleScoringHistory = ({ scoredDrawings }) => {
            const historySet = new Set(scoredDrawings);
            setScoringHistory(historySet);
            setSubmittedScores(historySet);
        };

        const handleScoreSubmitted = ({ success, targetPlayerId, newTotalScore, newTotalVotes, newAverageScore }) => {
            if (success) {
                toast.success('Score submitted!');
                setSubmittedScores(prev => new Set([...prev, targetPlayerId]));
                setScoringHistory(prev => new Set([...prev, targetPlayerId]));

                setGameResults(prev => {
                    if (!prev) return prev;

                    const updatedResults = prev.results.map(result => {
                        if (result.playerId === targetPlayerId) {
                            return {
                                ...result,
                                totalScore: newTotalScore,
                                totalVotes: newTotalVotes,
                                averageScore: newAverageScore
                            };
                        }
                        return result;
                    });

                    return { ...prev, results: updatedResults };
                });
            } else {
                toast.error('Failed to submit score. Please try again.');
            }
        };

        const handleVotingComplete = ({ message, canViewResults }) => {
            setVotingComplete(true);
            setCanViewResults(canViewResults);
            toast.success(message);
        };

        const handleScoreError = (message) => {
            toast.error(message);
        };

        const handleRoomError = (message) => {
            toast.error(message);
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('new-message', handleNewMessage);
        socket.on('room-drawings', handleRoomDrawings);
        socket.on('scoring-history', handleScoringHistory);
        socket.on('score-submitted', handleScoreSubmitted);
        socket.on('voting-complete', handleVotingComplete);
        socket.on('score-error', handleScoreError);
        socket.on('room-error', handleRoomError);

        if (socket.connected) {
            handleConnect();
        }

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);

                    socket.emit('judge-timer-ended', { roomCode });

                    setTimeout(() => {
                        navigate(`/room/${roomCode}/results`);
                    }, 1000);

                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('new-message', handleNewMessage);
            socket.off('room-drawings', handleRoomDrawings);
            socket.off('scoring-history', handleScoringHistory);
            socket.off('score-submitted', handleScoreSubmitted);
            socket.off('voting-complete', handleVotingComplete);
            socket.off('score-error', handleScoreError);
            socket.off('room-error', handleRoomError);
            clearInterval(timerRef.current);
        };
    }, [roomCode, navigate]);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages]);

    const handleScoreChange = (playerId, score) => {
        setScores((prev) => ({ ...prev, [playerId]: score }));
    };

    const handleSubmitScore = (targetPlayerId) => {
        const score = scores[targetPlayerId];

        if (score === undefined || score < 1 || score > 10) {
            toast.error('Score must be between 1 and 10');
            return;
        }

        if (submittedScores.has(targetPlayerId)) {
            toast.error('You have already scored this drawing');
            return;
        }

        if (targetPlayerId === currentPlayer?.id) {
            toast.error('You cannot score your own drawing');
            return;
        }

        setSubmittedScores(prev => new Set([...prev, targetPlayerId]));

        socket.emit('submit-score', {
            roomCode,
            scorerId: currentPlayer.id,
            targetPlayerId,
            score: parseInt(score)
        });
    };

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        socket.emit('send-message', {
            roomCode,
            message: newMessage.trim(),
            playerId: currentPlayer.id
        });

        setNewMessage('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!gameResults || !currentPlayer) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center overflow-auto">
                <div className="text-white text-xl flex items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    Loading game results...
                </div>
            </div>
        );
    }

    const scoreableDrawings = gameResults.results.filter(player =>
        player.playerId !== currentPlayer.id && player.hasSubmitted
    );

    const totalScoreableDrawings = scoreableDrawings.length;
    const totalScored = Array.from(submittedScores).filter(playerId => playerId !== currentPlayer.id).length;
    const allScoresSubmitted = totalScored >= totalScoreableDrawings;

    return (

        <div className="min-h-screen bg-gradient-to-br from-purple-900/0 via-blue-900/0 to-indigo-900 relative">
            <div className="fixed inset-0 -z-10">
                <Background />
            </div>
            <div className="relative z-10 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div onClick={() => { navigate('/') }} className='cursor-pointer'>
                                <Logo />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">Judge the Drawings</h1>
                                <p className="text-blue-200 flex items-center gap-2">
                                    <Trophy size={18} />
                                    Rate each drawing from 1-10 stars
                                </p>
                                <p className="text-sm text-gray-300 mt-1">
                                    Progress: {totalScored}/{totalScoreableDrawings} drawings scored
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-300">
                                {connectionStatus}
                            </div>

                            <div className="bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
                                <Clock size={20} className="text-yellow-400" />
                                <span className={`font-bold text-lg ${timeLeft <= 30 ? 'text-red-400' : 'text-white'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>

                            <button
                                onClick={() => setShowChat(!showChat)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <MessageSquare size={20} />
                                Chat
                            </button>
                        </div>
                    </div>

                    {votingComplete && (
                        <div className="text-center mb-6">
                            <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-4 inline-block">
                                <div className="flex items-center justify-center gap-2 text-white">
                                    <Trophy size={20} className="text-yellow-400" />
                                    <span className="font-bold">All players have finished voting! Results are ready.</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {gameResults.selectedWord && (
                        <div className="text-center mb-8">
                            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 inline-block">
                                <h2 className="text-white text-lg mb-2">The word was:</h2>
                                <div className="text-3xl font-bold text-yellow-400 bg-black/20 px-6 py-3 rounded-lg">
                                    {gameResults.selectedWord}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {gameResults.results.map((player, index) => {
                            const isOwnDrawing = player.playerId === currentPlayer.id;
                            const hasScored = submittedScores.has(player.playerId);

                            return (
                                <div key={player.playerId} className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">

                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            {isOwnDrawing ? <img src={player.character} alt="" className='rounded-full w-10 h-10' /> : ' '}

                                            <div>
                                                <h3 className="text-white font-bold text-lg">
                                                    {isOwnDrawing ? 'Your Drawing' : `Player ${index + 1}`}
                                                </h3>
                                                <div className="text-sm flex items-center gap-1 text-green-400">
                                                    <div className={`w-2 h-2 rounded-full ${player.hasSubmitted ? 'bg-green-400' : 'bg-red-400'}`} />
                                                    {player.hasSubmitted ? 'Submitted' : 'No submission'}
                                                </div>

                                            </div>
                                        </div>

                                        {isOwnDrawing && (
                                            <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-medium">
                                                Your Art
                                            </div>
                                        )}
                                        {!isOwnDrawing && hasScored && (
                                            <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                                <Check size={14} />
                                                Scored
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-6">
                                        {player.image ? (
                                            <div className="relative group">
                                                <img
                                                    src={player.image}
                                                    alt={`${player.playerName}'s drawing`}
                                                    className="w-full h-56 object-contain bg-white rounded-lg border-2 border-gray-600 transition-transform duration-300 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-300" />
                                            </div>
                                        ) : (
                                            <div className="w-full h-56 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
                                                <div className="text-center">
                                                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                                        <Sketchaa className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                    <span className="text-gray-400 text-sm">No drawing submitted</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {player.hasSubmitted && (
                                        <div className="mb-4 p-3 bg-black/20 rounded-lg">
                                            <div className="text-white text-sm">
                                                <div className="flex justify-between items-center">
                                                    <span>Current Score:</span>
                                                    <span className="font-bold">
                                                        {player.totalScore || 0} points ({player.totalVotes || 0} votes)
                                                    </span>
                                                </div>
                                                {player.totalVotes > 0 && (
                                                    <div className="flex justify-between items-center mt-1">
                                                        <span>Average:</span>
                                                        <span className="font-bold text-yellow-400">
                                                            {player.averageScore || 0} ⭐
                                                        </span>
                                                    </div>
                                                )}
                                                {player.scores && player.scores.length > 0 && (
                                                    <div className="flex justify-between items-center mt-1">
                                                        <span>Individual Scores:</span>
                                                        <span className="font-mono text-xs text-gray-300">
                                                            [{player.scores.join(', ')}]
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {player.hasSubmitted && !isOwnDrawing && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-white font-medium flex items-center gap-2">
                                                    <Star size={16} className="text-yellow-400" />
                                                    Rate this drawing:
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-yellow-400 font-bold text-lg">
                                                        {scores[player.playerId] || 1}
                                                    </span>
                                                    <span className="text-gray-400">/10</span>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="10"
                                                    value={scores[player.playerId] || 1}
                                                    onChange={(e) => handleScoreChange(player.playerId, Number(e.target.value))}
                                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                                                    disabled={hasScored}
                                                />
                                                <div className="flex justify-between text-xs text-gray-400">
                                                    <span>1 ⭐</span>
                                                    <span>5 ⭐</span>
                                                    <span>10 ⭐</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleSubmitScore(player.playerId)}
                                                disabled={hasScored}
                                                className={`w-full py-3 rounded-lg font-bold transition-all duration-300 flex items-center justify-center gap-2 ${hasScored
                                                    ? 'bg-green-600 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105'
                                                    } text-white`}
                                            >
                                                {hasScored ? (
                                                    <>
                                                        <Check size={16} />
                                                        Score Submitted
                                                    </>
                                                ) : (
                                                    <>
                                                        <Star size={16} />
                                                        Submit Score ({scores[player.playerId] || 1}/10)
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {isOwnDrawing && player.hasSubmitted && (
                                        <div className="text-center py-4">
                                            <div className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-lg text-sm">
                                                This is your drawing! Wait for others to score it.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {allScoresSubmitted && !votingComplete && (
                        <div className="text-center mt-12">
                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 inline-block">
                                <div className="flex items-center justify-center gap-3 mb-3">
                                    <Check size={24} className="text-green-400" />
                                    <h2 className="text-xl font-bold text-white">You've Scored All Drawings!</h2>
                                </div>
                                <p className="text-blue-100 mb-4">
                                    Great job! You've scored {totalScored} out of {totalScoreableDrawings} drawings.
                                </p>
                                <p className="text-blue-200 text-sm">
                                    Waiting for other players to finish voting...
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showChat && (
                <div className="fixed bottom-0 right-0 h-96 w-80 bg-black/80 backdrop-blur-sm flex flex-col z-50 border-l border-t border-white/10 rounded-tl-lg">
                    <div className="flex items-center justify-between p-4 border-b border-gray-600">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <MessageSquare size={18} />
                            Chat
                        </h3>
                        <button
                            onClick={() => setShowChat(false)}
                            className="text-white hover:text-gray-300 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {chatMessages.map((msg) => (
                            <div key={msg.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <img src={msg.character} alt="" className='rounded-full w-5 h-5' />
                                    <span className="text-white font-medium text-sm">{msg.playerName}</span>
                                </div>
                                <div className="text-gray-300 text-sm break-words">
                                    {msg.message}
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 border-t border-gray-600">
                        <div className="flex gap-2">
                            <textarea
                                ref={chatInputRef}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-600 transition-colors"
                                rows="1"
                                maxLength={500}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim()}
                                className={`px-4 py-2 rounded-lg flex items-center justify-center transition-colors ${newMessage.trim()
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default JudgePage;