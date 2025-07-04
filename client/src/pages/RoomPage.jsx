import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Background from '../components/Background';
import Sketchaa from '../components/Sketchaa';
import Logo from '../components/Logo';
import { drawingwords } from '../assets/assets';
import socket from '../socket';

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
      // Listen for successful room creation
      socket.on('room-created', ({ roomCode, players, selectedWord, gameState }) => {
        console.log('Room created successfully:', roomCode, players);
        localStorage.setItem('playersInRoom', JSON.stringify(players));
        localStorage.setItem('selectedWord', selectedWord);
        localStorage.setItem('currentRoomCode', roomCode);
        localStorage.setItem('currentPlayerId', playerInfo.id);
        localStorage.setItem('gameState', JSON.stringify(gameState));
        setIsCreating(false);
        toast.success(`Room created: ${roomCode}`);
        navigate(`/room/${roomCode}`);
      });

      // Listen for successful room join
      socket.on('room-joined', ({ roomCode, players, selectedWord, chatMessages, gameState }) => {
        console.log('Room joined successfully:', roomCode, players);
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

      // Listen for errors
      socket.on('room-error', (message) => {
        console.error('Room error:', message);
        toast.error(message);
        setIsCreating(false);
        setIsJoining(false);
      });

      // Debug listener
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

    // Select random word
    const randomIndex = Math.floor(Math.random() * drawingwords.length);
    const word = drawingwords[randomIndex];

    console.log('Creating room with code:', code);

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
    <div className="flex justify-center h-[100vh] items-center">
      <div className="fixed inset-0 -z-10">
        <Background />
      </div>
      <div className="bg-black/40 w-[90%] h-auto py-20 flex flex-col justify-center items-center gap-20">
        <div className="flex cursor-pointer" onClick={() => navigate('/')}>
          <Sketchaa />
          <Logo />
        </div>

        <div className="flex gap-3 px-15">
          <div className="bg-[#e0e0e0] w-[33%] p-3 rounded-2xl flex flex-col gap-6">
            <h1 className="font-extrabold">Welcome to Sketchaa !!!</h1>
            <h6 className="text-[14px]">Create a new room or join an existing one to start drawing!</h6>
            <button
              className={`w-full py-1 rounded text-white cursor-pointer ${isCreating || !socket.connected
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
                }`}
              onClick={handleCreateRoom}
              disabled={isCreating || !socket.connected}
            >
              {isCreating ? 'Creating...' : 'Create a Room'}
            </button>
            {roomCode && (
              <div className="text-center p-3 bg-green-100 rounded">
                <span className='block text-black font-semibold text-lg'>
                  Room Code: <span className='text-blue-800'>{roomCode}</span>
                </span>
              </div>
            )}
          </div>

          <div className="bg-[#e0e0e0] w-[33%] p-3 rounded-2xl flex flex-col gap-6 items-start">
            <h1 className="font-extrabold">Join a Room...</h1>
            <input
              type="text"
              placeholder="Enter Room-Code"
              className="w-full px-2 py-2 bg-white rounded"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <button
              className={`w-full py-1 rounded text-white cursor-pointer ${isJoining || !socket.connected
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
                }`}
              onClick={handleJoinRoom}
              disabled={isJoining || !socket.connected}
            >
              {isJoining ? 'Joining...' : 'Join Room'}
            </button>
          </div>

          <div className="bg-[#e0e0e0] w-[33%] p-3 rounded-2xl flex flex-col gap-3">
            <h1 className="font-extrabold">Game Info</h1>
            <p className="text-[13px]">
              Be quick!! You only have 60 sec to draw and then the AI-based judge will score your drawing and rank all your friends too. <br />
              Enjoy :)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;