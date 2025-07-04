import React, { useRef, useEffect, useState } from 'react';
import Background from '../components/Background';
import Sketchaa from '../components/Sketchaa';
import Logo from '../components/Logo';
import DrawingCanvas from '../components/DrawingCanvas';
import { PencilIcon, LucideEraser, Trash, Send, Play, Users, Clock, MessageSquare, Crown, X } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { drawingwords } from '../assets/assets';
import socket from '../socket';
import toast from 'react-hot-toast';

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
    const [gameState, setGameState] = useState({
        isStarted: false,
        startTime: null,
        duration: 60,
        remainingTime: 60
    });
    const [isStartingGame, setIsStartingGame] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showPlayers, setShowPlayers] = useState(false);
    const [brushSize, setBrushSize] = useState(5);
    const [brushColor, setBrushColor] = useState('#000000');

    const canvasContainerRef = useRef(null);
    const canvasRef = useRef(null);
    const chatEndRef = useRef(null);
    const chatInputRef = useRef(null);
    const navigate = useNavigate();


    const getCharacterImage = (character) => {

        const characterImages = {
            'char1': 'character3.png',
            'char2': 'character5.png',
            'char3': 'character6.png',
            'char4': 'character7.png',
            'char5': 'character8.png',
            'char6': 'character9.png',
            'char7': 'character10.png',
        };
        return characterImages[character] || null;
    };


    useEffect(() => {
        const updateSize = () => {
            if (canvasContainerRef.current) {
                const rect = canvasContainerRef.current.getBoundingClientRect();
                setContainerWidth(rect.width);
                setContainerHeight(rect.height);
            }
        };

        const playerInfo = JSON.parse(localStorage.getItem('playerInfoMulti'));
        if (!playerInfo) {
            toast.error("Player info not found. Please start from home page.");
            navigate('/');
            return;
        }

        setCurrentPlayer(playerInfo);

        const storedRoomCode = localStorage.getItem("currentRoomCode");
        const storedPlayerId = localStorage.getItem("currentPlayerId");
        const storedPlayers = JSON.parse(localStorage.getItem('playersInRoom') || '[]');
        const storedWord = localStorage.getItem("selectedWord");
        const storedChatMessages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
        const storedGameState = JSON.parse(localStorage.getItem('gameState') || '{"isStarted":false,"startTime":null,"duration":60,"remainingTime":60}');

        if (storedPlayers.length > 0) {
            setPlayers(storedPlayers);
            const player = storedPlayers.find(p => p.playerId === playerInfo.id);
            if (player) {
                setIsHost(player.isHost);
            }
        }

        if (storedWord) {
            setSelectedWord(storedWord);
        }

        if (storedChatMessages.length > 0) {
            setChatMessages(storedChatMessages);
        }

        if (storedGameState) {
            setGameState(storedGameState);
            setTime(storedGameState.remainingTime);
        }


        updateSize();

        window.addEventListener('resize', updateSize);

        const resizeObserver = new ResizeObserver(updateSize);
        if (canvasContainerRef.current) {
            resizeObserver.observe(canvasContainerRef.current);
        }

        const handleConnect = () => {
            console.log('Socket connected:', socket.id);
            setIsConnected(true);
            setConnectionStatus('Connected');

            if (storedRoomCode === roomCode && storedPlayerId) {
                socket.emit('rejoin-room', { roomCode, playerId: storedPlayerId });
            }
        };

        const handleDisconnect = () => {
            console.log('Socket disconnected');
            setIsConnected(false);
            setConnectionStatus('Reconnecting...');
        };

        const handlePlayersUpdated = (playersData) => {
            console.log('Players updated:', playersData);
            if (playersData && Array.isArray(playersData)) {
                setPlayers(playersData);
                localStorage.setItem('playersInRoom', JSON.stringify(playersData));
                setConnectionStatus(`Connected - ${playersData.length} players`);

                const currentPlayerId = localStorage.getItem("currentPlayerId");
                const updatedCurrentPlayer = playersData.find(p => p.playerId === currentPlayerId);
                if (updatedCurrentPlayer) {
                    setIsHost(updatedCurrentPlayer.isHost);
                }
            }
        };

        const handleWordUpdated = (newWord) => {
            console.log('Word updated:', newWord);
            setSelectedWord(newWord);
            localStorage.setItem("selectedWord", newWord);
            setIsWordChanging(false);
            toast.success(`Word changed to: ${newWord}`);
        };

        const handleNewMessage = (message) => {
            console.log('New message received:', message);
            setChatMessages(prev => {
                const updated = [...prev, message];
                localStorage.setItem('chatMessages', JSON.stringify(updated));
                return updated;
            });
        };

        const handleGameStateUpdated = (newGameState) => {
            console.log('Game state updated:', newGameState);
            setGameState(newGameState);
            localStorage.setItem('gameState', JSON.stringify(newGameState));
            if (newGameState.isStarted) {
                setTime(newGameState.remainingTime);
            }
        };

        const handleGameStarted = ({ startTime, duration }) => {
            console.log('Game started:', { startTime, duration });
            setGameState(prev => ({
                ...prev,
                isStarted: true,
                startTime,
                duration,
                remainingTime: duration
            }));
            setTime(duration);
            setIsStartingGame(false);
            toast.success('Game started! Start drawing!');
        };

        const handleTimeUpdate = (remainingTime) => {
            setTime(remainingTime);
            setGameState(prev => ({
                ...prev,
                remainingTime
            }));
        };

        const handleGameEnded = () => {
            console.log('Game ended');
            setGameState(prev => ({
                ...prev,
                isStarted: false,
                startTime: null,
                remainingTime: 60
            }));
            setTime(60);

            // Check if currentPlayer exists before submitting drawing
            if (currentPlayer && canvasRef.current) {
                handleSubmitDrawing();
            }

            toast.success('Game ended! Time to see the results!');
        };

        const handleRoomRejoined = ({ roomCode, players, selectedWord, chatMessages, gameState }) => {
            console.log('Room rejoined successfully:', roomCode);
            setPlayers(players);
            setSelectedWord(selectedWord);
            setChatMessages(chatMessages || []);
            setGameState(gameState);
            setTime(gameState.remainingTime);
            localStorage.setItem('playersInRoom', JSON.stringify(players));
            localStorage.setItem('selectedWord', selectedWord);
            localStorage.setItem('chatMessages', JSON.stringify(chatMessages || []));
            localStorage.setItem('gameState', JSON.stringify(gameState));
            setConnectionStatus(`Connected - ${players.length} players`);

            // Update host status
            const currentPlayerId = localStorage.getItem("currentPlayerId");
            const rejoiningPlayer = players.find(p => p.playerId === currentPlayerId);
            if (rejoiningPlayer) {
                setIsHost(rejoiningPlayer.isHost);
            }

            toast.success('Rejoined room successfully!');
        };

        const handleRoomError = (message) => {
            console.error('Room error:', message);
            toast.error(message);
            setIsStartingGame(false);
            setIsWordChanging(false);
        };

        // Set up socket listeners
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('players-updated', handlePlayersUpdated);
        socket.on('word-updated', handleWordUpdated);
        socket.on('new-message', handleNewMessage);
        socket.on('game-state-updated', handleGameStateUpdated);
        socket.on('game-started', handleGameStarted);
        socket.on('time-update', handleTimeUpdate);
        socket.on('game-ended', handleGameEnded);
        socket.on('room-rejoined', handleRoomRejoined);
        socket.on('room-error', handleRoomError);

        // Initial connection check
        if (socket.connected) {
            handleConnect();
        }

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('players-updated', handlePlayersUpdated);
            socket.off('word-updated', handleWordUpdated);
            socket.off('new-message', handleNewMessage);
            socket.off('game-state-updated', handleGameStateUpdated);
            socket.off('game-started', handleGameStarted);
            socket.off('time-update', handleTimeUpdate);
            socket.off('game-ended', handleGameEnded);
            socket.off('room-rejoined', handleRoomRejoined);
            socket.off('room-error', handleRoomError);
            window.removeEventListener('resize', updateSize);
            resizeObserver.disconnect();
        };
    }, [roomCode, navigate]);

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages]);

    // Handle game start
    const handleStartGame = () => {
        if (!isHost) {
            toast.error("Only the host can start the game");
            return;
        }

        if (gameState.isStarted) {
            toast.error("Game has already started");
            return;
        }

        setIsStartingGame(true);
        socket.emit('start-game', {
            roomCode,
            playerId: currentPlayer.id
        });
    };

    // Handle word change
    const handleWordChange = () => {
        if (!isHost) {
            toast.error("Only the host can change the word");
            return;
        }

        setIsWordChanging(true);
        const randomIndex = Math.floor(Math.random() * drawingwords.length);
        const newWord = drawingwords[randomIndex];

        socket.emit('change-word', {
            roomCode,
            newWord,
            playerId: currentPlayer.id
        });
    };

    // Handle chat message send
    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        socket.emit('send-message', {
            roomCode,
            message: newMessage.trim(),
            playerId: currentPlayer.id
        });

        setNewMessage('');
    };

    // Handle enter key in chat
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Format time display
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Handle canvas clear
    const handleClearCanvas = () => {
        if (canvasRef.current) {
            canvasRef.current.clearCanvas();
        }
    };

    // Leave room
    const handleLeaveRoom = () => {
        localStorage.removeItem('currentRoomCode');
        localStorage.removeItem('currentPlayerId');
        localStorage.removeItem('playersInRoom');
        localStorage.removeItem('selectedWord');
        localStorage.removeItem('chatMessages');
        localStorage.removeItem('gameState');
        navigate('/room');
    };

    const handleSubmitDrawing = () => {
        if (canvasRef.current && currentPlayer) {
            const image = canvasRef.current.getCanvasDataUrl();
            const characterImage = getCharacterImage(currentPlayer.character);
            socket.emit('submit-drawing', {
                roomCode,
                playerId: currentPlayer.id,
                playerName: currentPlayer.name,
                character: characterImage,
                image,
            });
        }
    };

    useEffect(() => {
        socket.on('game-results', (results) => {
            console.log('Received game results:', results); // Add this line
            sessionStorage.setItem('leaderboardData', JSON.stringify(results));
            navigate(`/room/${roomCode}/leaderboard`);
        });
    }, []);

    const PlayerAvatar = ({ player, size = 'w-8 h-8' }) => {
        const characterImage = getCharacterImage(player.character);

        if (characterImage) {
            return (
                <img
                    src={characterImage}
                    alt={player.playerName}
                    className={`${size} rounded-full object-cover`}
                />
            );
        }

        return (
            <div className={`${size} rounded-full bg-blue-500 flex items-center justify-center text-white font-bold`}>
                {player.playerName.charAt(0).toUpperCase()}
            </div>
        );
    };

    if (!currentPlayer) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 -z-10">
                <Background />
            </div>

            {/* Main Content */}
            <div className="relative z-10 h-screen flex flex-col">
                {/* Header */}
                <div className="bg-black/60 backdrop-blur-sm p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
                            <Sketchaa />
                            <Logo />
                        </div>
                        <div className="text-white">
                            <span className="text-lg font-bold">Room: {roomCode}</span>
                            <div className="text-sm text-gray-300">{connectionStatus}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Timer */}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${gameState.isStarted ? 'bg-red-600' : 'bg-blue-600'
                            }`}>
                            <Clock size={20} className="text-white" />
                            <span className="text-white font-bold text-xl">
                                {formatTime(time)}
                            </span>
                        </div>

                        {/* Players Button */}
                        <button
                            onClick={() => setShowPlayers(!showPlayers)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <Users size={20} />
                            <span>{players.length}</span>
                        </button>

                        {/* Chat Button */}
                        <button
                            onClick={() => setShowChat(!showChat)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <MessageSquare size={20} />
                            <span>Chat</span>
                        </button>

                        {/* Leave Button */}
                        <button
                            onClick={handleLeaveRoom}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Leave
                        </button>
                    </div>
                </div>

                {/* Game Content */}
                <div className="flex-1 flex">
                    {/* Left Panel - Word and Controls */}
                    <div className="w-80 bg-black/40 backdrop-blur-sm p-4 flex flex-col gap-4">
                        {/* Word Section */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h3 className="text-white font-bold mb-2">Word to Draw:</h3>
                            <div className="text-2xl font-bold text-yellow-400 mb-4">
                                {selectedWord || 'No word selected'}
                            </div>
                            {isHost && (
                                <button
                                    onClick={handleWordChange}
                                    disabled={isWordChanging}
                                    className={`w-full py-2 rounded-lg transition-colors ${isWordChanging
                                        ? 'bg-gray-600 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                        } text-white`}
                                >
                                    {isWordChanging ? 'Changing...' : 'Change Word'}
                                </button>
                            )}
                        </div>

                        {/* Game Controls */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h3 className="text-white font-bold mb-4">Game Controls:</h3>

                            {isHost && !gameState.isStarted && (
                                <button
                                    onClick={handleStartGame}
                                    disabled={isStartingGame}
                                    className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${isStartingGame
                                        ? 'bg-gray-600 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700'
                                        } text-white font-bold`}
                                >
                                    <Play size={20} />
                                    {isStartingGame ? 'Starting...' : 'Start Game'}
                                </button>
                            )}

                            {gameState.isStarted && (
                                <div className="text-center">
                                    <div className="text-green-400 font-bold mb-2">Game in Progress!</div>
                                    <div className="text-white text-sm">Draw the word above</div>
                                </div>
                            )}

                            {!gameState.isStarted && !isHost && (
                                <div className="text-center text-gray-400">
                                    Waiting for host to start the game...
                                </div>
                            )}
                        </div>

                        {/* Drawing Tools */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h3 className="text-white font-bold mb-4">Drawing Tools:</h3>

                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setIsErasing(false)}
                                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${!isErasing ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'
                                        } text-white`}
                                >
                                    <PencilIcon size={16} />
                                    Draw
                                </button>
                                <button
                                    onClick={() => setIsErasing(true)}
                                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${isErasing ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-700'
                                        } text-white`}
                                >
                                    <LucideEraser size={16} />
                                    Erase
                                </button>
                            </div>

                            <div className="mb-4">
                                <label className="text-white text-sm mb-2 block">Brush Size: {brushSize}px</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="20"
                                    value={brushSize}
                                    onChange={(e) => setBrushSize(Number(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="text-white text-sm mb-2 block">Color:</label>
                                <input
                                    type="color"
                                    value={brushColor}
                                    onChange={(e) => setBrushColor(e.target.value)}
                                    className="w-full h-10 rounded-lg"
                                />
                            </div>

                            <button
                                onClick={handleClearCanvas}
                                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                <Trash size={16} />
                                Clear Canvas
                            </button>
                        </div>
                    </div>

                    {/* Center - Drawing Canvas */}
                    <div className="flex-1 p-4">
                        <div
                            ref={canvasContainerRef}
                            className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden"
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
            </div>

            {/* Players Panel */}
            {showPlayers && (
                <div className="fixed top-0 right-0 h-full w-80 bg-black/80 backdrop-blur-sm p-4 z-50 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-bold text-lg">Players ({players.length})</h3>
                        <button
                            onClick={() => setShowPlayers(false)}
                            className="text-white hover:text-gray-300"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        {players.map((player) => (
                            <div
                                key={player.playerId}
                                className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3"
                            >
                                <PlayerAvatar player={player} />
                                <div className="flex-1">
                                    <div className="text-white font-medium flex items-center gap-2">
                                        {player.playerName}
                                        {player.isHost && (
                                            <Crown size={16} className="text-yellow-400" />
                                        )}
                                    </div>
                                    <div className="text-gray-400 text-sm">Score: {player.score || 0}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Chat Panel */}
            {showChat && (
                <div className="fixed bottom-0 right-0 h-96 w-80 bg-black/80 backdrop-blur-sm flex flex-col z-50">
                    <div className="flex items-center justify-between p-4 border-b border-gray-600">
                        <h3 className="text-white font-bold">Chat</h3>
                        <button
                            onClick={() => setShowChat(false)}
                            className="text-white hover:text-gray-300"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {chatMessages.map((msg) => (
                            <div key={msg.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <PlayerAvatar player={msg} size="w-6 h-6" />
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
                                className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
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

export default Room;