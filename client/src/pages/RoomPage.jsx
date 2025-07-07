import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Background from '../components/Background';
import Sketchaa from '../components/Sketchaa';
import Logo from '../components/Logo';
import { drawingwords } from '../assets/assets';
import socket from '../socket';
import { characterData, aboutImg } from '../assets/assets';


const RoomPage = () => {
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();

  const playerInfo = JSON.parse(localStorage.getItem('playerInfoMulti'));

  useEffect(() => {
    if (!playerInfo) {
      toast.error("Player doesn't exist. Please go back and create a player profile.");
      navigate('/');
      return;
    }

    const setupSocketListeners = () => {
      socket.on('room-created', ({ roomCode, players, selectedWord, gameState }) => {
        localStorage.setItem('playersInRoom', JSON.stringify(players));
        localStorage.setItem('selectedWord', selectedWord);
        localStorage.setItem('currentRoomCode', roomCode);
        localStorage.setItem('currentPlayerId', playerInfo.id);
        localStorage.setItem('gameState', JSON.stringify(gameState));
        setIsCreating(false);
        toast.success(`Room created: ${roomCode}`);
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
        toast.success(`Joined room: ${roomCode}`);
        navigate(`/room/${roomCode}`);
      });

      socket.on('room-error', (message) => {
        console.error('Room error:', message);
        toast.error(message);
        setIsCreating(false);
        setIsJoining(false);
      });

      socket.on('debug-rooms-response', (rooms) => {
        console.log('All rooms:', rooms);
      });
    };

    if (socket.connected) {
      setupSocketListeners();
    } else {
      socket.on('connect', setupSocketListeners);
    }

    return () => {
      socket.off('room-created');
      socket.off('room-joined');
      socket.off('room-error');
      socket.off('debug-rooms-response');
      socket.off('connect');
    };
  }, [navigate, playerInfo]);

  const handleCreateRoom = () => {
    if (!playerInfo) {
      toast.error("Player doesn't exist. Please go back and create a player profile.");
      return;
    }

    if (!socket.connected) {
      toast.error("Not connected to server. Please try again.");
      return;
    }

    setIsCreating(true);
    const code = generateRoomCode();
    setRoomCode(code);

    const randomIndex = Math.floor(Math.random() * drawingwords.length);
    const word = drawingwords[randomIndex];

    socket.emit('create-room', {
      roomCode: code,
      hostPlayer: {
        playerId: playerInfo.id,
        playerName: playerInfo.name,
        isHost: true,
        score: 0,
        character: playerInfo.character,
        socketId: socket.id
      },
      selectedWord: word
    });
  };

  const handleJoinRoom = () => {
    if (!playerInfo) {
      toast.error("Player doesn't exist. Please go back and create a player profile.");
      return;
    }

    if (!inputCode.trim()) {
      toast.error("Please enter a room code");
      return;
    }

    if (!socket.connected) {
      toast.error("Not connected to server. Please try again.");
      return;
    }

    setIsJoining(true);

    socket.emit('join-room', {
      roomCode: inputCode,
      player: {
        playerId: playerInfo.id,
        playerName: playerInfo.name,
        isHost: false,
        score: 0,
        character: playerInfo.character,
        socketId: socket.id
      },
    });
  };

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 6 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  };

  const debugRooms = () => {
    socket.emit('debug-rooms');
  };

  return (
    <div className="flex justify-center h-[100vh] items-center px-4 sm:px-6 lg:px-8">
      <div className="fixed inset-0 -z-10">
        <Background />
      </div>
      <div className="bg-black/40 w-full max-w-6xl h-auto py-8 sm:py-12 md:py-16 lg:py-20 flex flex-col justify-center items-center gap-8 sm:gap-12 md:gap-16 lg:gap-20">
        <div className="flex cursor-pointer" onClick={() => navigate('/')}>
          <Sketchaa />
          <Logo />
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:gap-6 px-4 sm:px-6 md:px-8 lg:px-15 w-full">
          <div className="bg-[#e0e0e0] w-full md:w-[33%] p-3 sm:p-4 md:p-6 rounded-2xl flex flex-col gap-4 sm:gap-6">
            <h1 className="font-extrabold text-sm sm:text-base md:text-lg">Welcome to Sketchaa !!!</h1>
            <h6 className="text-xs sm:text-sm md:text-[14px]">Create a new room or join an existing one to start drawing!</h6>
            <button
              className={`w-full py-2 sm:py-3 md:py-1 rounded text-white cursor-pointer text-sm sm:text-base ${isCreating || !socket.connected
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
                }`}
              onClick={handleCreateRoom}
              disabled={isCreating || !socket.connected}
            >
              {isCreating ? 'Creating...' : 'Create a Room'}
            </button>
            {roomCode && (
              <div className="text-center p-2 sm:p-3 bg-green-100 rounded">
                <span className='block text-black font-semibold text-sm sm:text-base md:text-lg'>
                  Room Code: <span className='text-blue-800'>{roomCode}</span>
                </span>
              </div>
            )}
          </div>

          <div className="bg-[#e0e0e0] w-full md:w-[33%] p-3 sm:p-4 md:p-6 rounded-2xl flex flex-col gap-4 sm:gap-6 items-start">
            <h1 className="font-extrabold text-sm sm:text-base md:text-lg">Join a Room...</h1>
            <input
              type="text"
              placeholder="Enter Room-Code"
              className="w-full px-2 sm:px-3 py-2 sm:py-3 bg-white rounded text-sm sm:text-base"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <button
              className={`w-full py-2 sm:py-3 md:py-1 rounded text-white cursor-pointer text-sm sm:text-base ${isJoining || !socket.connected
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
                }`}
              onClick={handleJoinRoom}
              disabled={isJoining || !socket.connected}
            >
              {isJoining ? 'Joining...' : 'Join Room'}
            </button>
          </div>

          <div className="bg-[#e0e0e0] w-full md:w-[33%] p-3 sm:p-4 md:p-6 rounded-2xl flex flex-col gap-3 sm:gap-4">
            <h1 className="font-extrabold text-sm sm:text-base md:text-lg">Game Info</h1>
            <p className="text-xs sm:text-sm md:text-[13px]">
              Be quick!! You only have 60 sec to draw, then everyone will rate each other's drawings anonymously. Scores will be revealed and the leaderboard will decide the winner.
              Enjoy :)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;