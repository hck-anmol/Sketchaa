import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, Star, Home, MessageSquare, X, Send, Crown, Medal, Award, Users, Clock, ArrowLeft } from 'lucide-react';
import socket from '../socket';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';
import { characterData, aboutImg } from '../assets/assets';
import Background from '../components/Background';


const RankIcon = ({ rank }) => {
  if (rank === 1) return <Crown size={24} className="text-yellow-400" />;
  if (rank === 2) return <Medal size={24} className="text-gray-400" />;
  if (rank === 3) return <Award size={24} className="text-amber-600" />;
  return <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">{rank}</div>;
};

const LeaderboardPage = () => {
  const { id: roomCode } = useParams();
  const navigate = useNavigate();
  const [gameResults, setGameResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [connectionStatus, setConnectionStatus] = useState('Connected');
  const [selectedDrawing, setSelectedDrawing] = useState(null);
  const [confettiShow, setConfettiShow] = useState(false);

  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);
  const timeRef = useRef(null);


  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

    setConfettiShow(true);
    setTimeout(() => setConfettiShow(false), 3000);

    if (storedResults && storedResults.results) {
      setGameResults(storedResults);
    } else {
      socket.emit('request-game-results', { roomCode });
    }

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

    const handleGameResults = (results) => {
      setGameResults(results);
      sessionStorage.setItem('leaderboardData', JSON.stringify(results));
    };

    const handleRoomError = (message) => {
      toast.error(message);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('new-message', handleNewMessage);
    socket.on('game-results', handleGameResults);
    socket.on('room-error', handleRoomError);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('new-message', handleNewMessage);
      socket.off('game-results', handleGameResults);
      socket.off('room-error', handleRoomError);
    };
  }, [roomCode, navigate]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  useEffect(() => {
    timeRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timeRef.current);
          setTimeout(() => {
            navigate('/');
            scrollTo(0, 0);
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [roomCode, navigate])

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

  const handleBackToHome = () => {
    sessionStorage.removeItem('leaderboardData');
    localStorage.removeItem('chatMessages');
    localStorage.removeItem('playerInfoMulti');
    localStorage.removeItem('selectedWord');

    navigate('/');
  };

  const handleBackToJudge = () => {
    navigate(`/room/${roomCode}/judge`);
  };

  if (!gameResults || !currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center overflow-auto">
        <div className="text-white text-xl flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          Loading results...
        </div>
      </div>
    );
  }

  const sortedResults = [...gameResults.results].sort((a, b) => {
    if (b.averageScore !== a.averageScore) {
      return b.averageScore - a.averageScore;
    }
    if (b.totalVotes !== a.totalVotes) {
      return b.totalVotes - a.totalVotes;
    }
    if (a.hasSubmitted && !b.hasSubmitted) {
      return -1;
    }
    if (!a.hasSubmitted && b.hasSubmitted) {
      return 1;
    }
    return 0;
  });

  sortedResults.forEach((result, index) => {
    result.rank = index + 1;
  });

  const winner = sortedResults[0];
  const currentPlayerResult = sortedResults.find(r => r.playerId === currentPlayer.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-blue-900 to-indigo-900 relative overflow-auto">
      {confettiShow && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4 cursor-pointer">
              <div className='cursor-pointer' onClick={() => { navigate('/') }}>
                <Logo />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                  <Trophy className="text-yellow-400" size={36} />
                  Final Results
                </h1>
                <p className="text-blue-200 flex items-center gap-2">
                  <Users size={18} />
                  {gameResults.results.length} players participated
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
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <MessageSquare size={20} />
                Chat
              </button>
            </div>
          </div>

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

          {winner && winner.hasSubmitted && (
            <div className="text-center mb-12">
              <div className="bg-gradient-to-r from-yellow-600 to-orange-600/70 rounded-xl p-8 inline-block transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Crown size={32} className="text-yellow-200" />
                  <h2 className="text-2xl font-bold text-white">🎉 WINNER! 🎉</h2>
                  <Crown size={32} className="text-yellow-200" />
                </div>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <img src={winner.character} alt="" className='rounded-full w-20 h-20' />
                  <div className="text-left">
                    <p className="text-2xl font-bold text-white">{winner.playerName}</p>
                    <p className="text-yellow-200 text-lg">
                      Average Score: {winner.averageScore} ⭐
                    </p>
                    <p className="text-yellow-200 text-sm">
                      Total: {winner.totalScore} points from {winner.totalVotes} votes
                    </p>
                  </div>
                </div>
                {winner.image && (
                  <div className="mt-4">
                    <img
                      src={winner.image}
                      alt="Winning drawing"
                      className="w-32 h-32 object-contain bg-white rounded-lg border-4 border-yellow-400 mx-auto"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {currentPlayerResult && (
            <div className="mb-8">
              <div className={`rounded-xl p-6 ${currentPlayerResult.rank === 1
                ? 'bg-gradient-to-r from-yellow-600 to-orange-600'
                : currentPlayerResult.rank <= 3
                  ? 'bg-gradient-to-r from-green-600 to-blue-600'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                }`}>
                <h3 className="text-xl font-bold text-white mb-4 text-center">Your Performance</h3>
                <div className="flex items-center justify-center gap-6">
                  <div className="flex items-center gap-3">
                    <RankIcon rank={currentPlayerResult.rank} />
                    <div>
                      <p className="text-white font-bold text-lg">
                        Rank #{currentPlayerResult.rank}
                      </p>
                      <p className="text-gray-200 text-sm">
                        out of {sortedResults.length} players
                      </p>
                    </div>
                  </div>
                  <div className="h-12 w-px bg-white/30"></div>
                  <div className="text-center">
                    <p className="text-white font-bold text-lg">
                      {currentPlayerResult.averageScore} ⭐
                    </p>
                    <p className="text-gray-200 text-sm">Average Score</p>
                  </div>
                  <div className="h-12 w-px bg-white/30"></div>
                  <div className="text-center">
                    <p className="text-white font-bold text-lg">
                      {currentPlayerResult.totalVotes}
                    </p>
                    <p className="text-gray-200 text-sm">Total Votes</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
              <Trophy className="text-yellow-400" />
              Leaderboard
            </h3>

            <div className="space-y-4">
              {sortedResults.map((player, index) => (
                <div
                  key={player.playerId}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 cursor-pointer hover:scale-105 ${player.rank === 1
                    ? 'bg-gradient-to-r from-yellow-600/30 to-orange-600/30 border-2 border-yellow-400'
                    : player.rank === 2
                      ? 'bg-gradient-to-r from-gray-600/30 to-gray-500/30 border-2 border-gray-400'
                      : player.rank === 3
                        ? 'bg-gradient-to-r from-amber-600/30 to-amber-500/30 border-2 border-amber-400'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  onClick={() => setSelectedDrawing(player)}
                >
                  <div className="flex items-center justify-center w-12">
                    <RankIcon rank={player.rank} />
                  </div>

                  <div className="flex items-center gap-3 flex-1">
                    <img src={player.character} alt="" className='rounded-full w-12 h-12' />
                    <div>
                      <h4 className="text-white font-bold text-lg">
                        {player.playerName}
                        {player.playerId === currentPlayer.id && (
                          <span className="text-yellow-400 text-sm ml-2">(You)</span>
                        )}
                      </h4>
                      <div className={`text-sm flex items-center gap-1 ${player.hasSubmitted ? 'text-green-400' : 'text-red-400'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${player.hasSubmitted ? 'bg-green-400' : 'bg-red-400'
                          }`} />
                        {player.hasSubmitted ? 'Submitted Drawing' : 'No Submission'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Star className="text-yellow-400" size={18} />
                      <span className="text-white font-bold text-xl">
                        {player.averageScore}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      {player.totalScore} pts • {player.totalVotes} votes
                    </p>
                    {player.scores && player.scores.length > 0 && (
                      <p className="text-gray-400 text-xs">
                        [{player.scores.join(', ')}]
                      </p>
                    )}
                  </div>

                  {player.image && (
                    <div className="w-16 h-16 bg-white rounded-lg overflow-hidden border-2 border-gray-600">
                      <img
                        src={player.image}
                        alt={`${player.playerName}'s drawing`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-2xl font-bold text-white mb-2">
                {gameResults.results.filter(p => p.hasSubmitted).length}
              </div>
              <div className="text-gray-300">Drawings Submitted</div>
            </div>
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-2xl font-bold text-white mb-2">
                {gameResults.results.reduce((sum, p) => sum + p.totalVotes, 0)}
              </div>
              <div className="text-gray-300">Total Votes Cast</div>
            </div>
            <button
              onClick={handleBackToJudge}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Judge
            </button>
            <button
              onClick={handleBackToHome}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 font-bold"
            >
              <Home size={20} />
              Back to Home
            </button>
          </div>
        </div>
      </div>

      {selectedDrawing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white">
                {selectedDrawing.playerName}'s Drawing
              </h3>
              <button
                onClick={() => setSelectedDrawing(null)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {selectedDrawing.image ? (
              <div className="mb-4">
                <img
                  src={selectedDrawing.image}
                  alt={`${selectedDrawing.playerName}'s drawing`}
                  className="w-full h-80 object-contain bg-white rounded-lg border-2 border-gray-600"
                />
              </div>
            ) : (
              <div className="w-full h-80 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600 mb-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Trophy className="w-8 h-8 text-gray-400" />
                  </div>
                  <span className="text-gray-400 text-sm">No drawing submitted</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Rank:</span>
                <div className="flex items-center gap-2">
                  <RankIcon rank={selectedDrawing.rank} />
                  <span className="text-white font-bold">#{selectedDrawing.rank}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Average Score:</span>
                <span className="text-yellow-400 font-bold text-lg">
                  {selectedDrawing.averageScore} ⭐
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Total Points:</span>
                <span className="text-white font-bold">{selectedDrawing.totalScore}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Total Votes:</span>
                <span className="text-white font-bold">{selectedDrawing.totalVotes}</span>
              </div>
              {selectedDrawing.scores && selectedDrawing.scores.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Individual Scores:</span>
                  <span className="text-gray-400 font-mono text-sm">
                    [{selectedDrawing.scores.join(', ')}]
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                  <img src={msg.character} alt="" className='rounded-full w-6 h-6' />
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

export default LeaderboardPage;