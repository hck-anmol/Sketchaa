require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

const PORT = 5000;

// In-memory storage for rooms
const rooms = {};

app.get('/', (req, res) => {
    res.send('Server is running...');
});

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Create room
    socket.on('create-room', ({ roomCode, hostPlayer, selectedWord }) => {
        try {
            if (rooms[roomCode]) {
                return socket.emit('room-error', 'Room code already exists');
            }

            // Update socket ID for the host player
            hostPlayer.socketId = socket.id;

            // Create new room
            rooms[roomCode] = {
                roomCode,
                players: [hostPlayer],
                selectedWord: selectedWord || '',
                createdAt: Date.now(),
                chatMessages: [],
                gameState: {
                    isStarted: false,
                    startTime: null,
                    duration: 60,
                    remainingTime: 60
                }
            };

            socket.join(roomCode);
            console.log(`Room created: ${roomCode} by ${hostPlayer.playerName}`);

            socket.emit('room-created', {
                roomCode,
                players: rooms[roomCode].players,
                selectedWord: rooms[roomCode].selectedWord,
                gameState: rooms[roomCode].gameState
            });

            // Broadcast to all clients in the room
            io.to(roomCode).emit('players-updated', rooms[roomCode].players);
            io.to(roomCode).emit('word-updated', rooms[roomCode].selectedWord);
            io.to(roomCode).emit('game-state-updated', rooms[roomCode].gameState);

        } catch (err) {
            console.error('Error creating room:', err);
            socket.emit('room-error', 'Error creating room');
        }
    });

    // Join room
    socket.on('join-room', ({ roomCode, player }) => {
        try {
            if (!rooms[roomCode]) {
                return socket.emit('room-error', 'Room does not exist');
            }

            // Check if game has already started
            if (rooms[roomCode].gameState.isStarted) {
                return socket.emit('room-error', 'Game has already started! Cannot join now.');
            }

            // Update socket ID for the joining player
            player.socketId = socket.id;

            // Check if player already exists in room (by playerId)
            const existingPlayerIndex = rooms[roomCode].players.findIndex(p => p.playerId === player.playerId);

            if (existingPlayerIndex !== -1) {
                // Update existing player's socket ID
                rooms[roomCode].players[existingPlayerIndex] = player;
                console.log(`Player ${player.playerName} reconnected to room ${roomCode}`);
            } else {
                // Add new player to room
                rooms[roomCode].players.push(player);
                console.log(`Player ${player.playerName} joined room ${roomCode}`);
            }

            socket.join(roomCode);

            // Emit success to the joining player
            socket.emit('room-joined', {
                roomCode,
                players: rooms[roomCode].players,
                selectedWord: rooms[roomCode].selectedWord,
                chatMessages: rooms[roomCode].chatMessages,
                gameState: rooms[roomCode].gameState
            });

            // Broadcast updated player list to ALL clients in the room
            io.to(roomCode).emit('players-updated', rooms[roomCode].players);
            io.to(roomCode).emit('word-updated', rooms[roomCode].selectedWord);
            io.to(roomCode).emit('game-state-updated', rooms[roomCode].gameState);

            console.log(`Current players in room ${roomCode}:`, rooms[roomCode].players.map(p => p.playerName));

        } catch (err) {
            console.error('Error joining room:', err);
            socket.emit('room-error', 'Error joining room');
        }
    });

    // Rejoin room (for refresh handling)
    socket.on('rejoin-room', ({ roomCode, playerId }) => {
        try {
            if (!rooms[roomCode]) {
                return socket.emit('room-error', 'Room does not exist');
            }

            const playerIndex = rooms[roomCode].players.findIndex(p => p.playerId === playerId);
            if (playerIndex !== -1) {
                // Update socket ID for the rejoining player
                rooms[roomCode].players[playerIndex].socketId = socket.id;
                socket.join(roomCode);

                // Calculate current remaining time if game is started
                if (rooms[roomCode].gameState.isStarted && rooms[roomCode].gameState.startTime) {
                    const elapsed = Math.floor((Date.now() - rooms[roomCode].gameState.startTime) / 1000);
                    rooms[roomCode].gameState.remainingTime = Math.max(0, rooms[roomCode].gameState.duration - elapsed);
                }

                // Send current room state to rejoining player
                socket.emit('room-rejoined', {
                    roomCode,
                    players: rooms[roomCode].players,
                    selectedWord: rooms[roomCode].selectedWord,
                    chatMessages: rooms[roomCode].chatMessages,
                    gameState: rooms[roomCode].gameState
                });

                console.log(`Player ${rooms[roomCode].players[playerIndex].playerName} rejoined room ${roomCode}`);
            } else {
                socket.emit('room-error', 'Player not found in room');
            }

        } catch (err) {
            console.error('Error rejoining room:', err);
            socket.emit('room-error', 'Error rejoining room');
        }
    });

    // Start game (host only)
    socket.on('start-game', ({ roomCode, playerId }) => {
        try {
            if (!rooms[roomCode]) {
                return socket.emit('room-error', 'Room does not exist');
            }

            const player = rooms[roomCode].players.find(p => p.playerId === playerId);
            if (!player || !player.isHost) {
                return socket.emit('room-error', 'Only the host can start the game');
            }

            if (rooms[roomCode].gameState.isStarted) {
                return socket.emit('room-error', 'Game has already started');
            }

            // Start the game
            rooms[roomCode].gameState.isStarted = true;
            rooms[roomCode].gameState.startTime = Date.now();
            rooms[roomCode].gameState.remainingTime = rooms[roomCode].gameState.duration;

            // Broadcast game start to all players in the room
            io.to(roomCode).emit('game-started', {
                startTime: rooms[roomCode].gameState.startTime,
                duration: rooms[roomCode].gameState.duration
            });

            io.to(roomCode).emit('game-state-updated', rooms[roomCode].gameState);

            console.log(`Game started in room ${roomCode}`);

            // Set up game timer
            const gameTimer = setInterval(() => {
                if (!rooms[roomCode]) {
                    clearInterval(gameTimer);
                    return;
                }

                const elapsed = Math.floor((Date.now() - rooms[roomCode].gameState.startTime) / 1000);
                rooms[roomCode].gameState.remainingTime = Math.max(0, rooms[roomCode].gameState.duration - elapsed);

                // Broadcast time update
                io.to(roomCode).emit('time-update', rooms[roomCode].gameState.remainingTime);

                // End game when time reaches 0
                if (rooms[roomCode].gameState.remainingTime <= 0) {
                    clearInterval(gameTimer);
                    rooms[roomCode].gameState.isStarted = false;
                    io.to(roomCode).emit('game-ended');
                    io.to(roomCode).emit('game-state-updated', rooms[roomCode].gameState);
                    console.log(`Game ended in room ${roomCode}`);
                }
            }, 1000);

        } catch (err) {
            console.error('Error starting game:', err);
            socket.emit('room-error', 'Error starting game');
        }
    });

    // Change word (host only)
    socket.on('change-word', ({ roomCode, newWord, playerId }) => {
        try {
            if (!rooms[roomCode]) {
                return socket.emit('room-error', 'Room does not exist');
            }

            const player = rooms[roomCode].players.find(p => p.playerId === playerId);
            if (!player || !player.isHost) {
                return socket.emit('room-error', 'Only the host can change the word');
            }

            rooms[roomCode].selectedWord = newWord;

            // Broadcast word change to all players in the room
            io.to(roomCode).emit('word-updated', newWord);

            console.log(`Word changed in room ${roomCode} to: ${newWord}`);

        } catch (err) {
            console.error('Error changing word:', err);
            socket.emit('room-error', 'Error changing word');
        }
    });

    // Send chat message
    socket.on('send-message', ({ roomCode, message, playerId }) => {
        try {
            if (!rooms[roomCode]) {
                return socket.emit('room-error', 'Room does not exist');
            }

            const player = rooms[roomCode].players.find(p => p.playerId === playerId);
            if (!player) {
                return socket.emit('room-error', 'Player not found in room');
            }

            // Limit message length
            const trimmedMessage = message.trim().substring(0, 500);

            const chatMessage = {
                id: Date.now(),
                playerId: playerId,
                playerName: player.playerName,
                character: player.character,
                message: trimmedMessage,
                timestamp: Date.now()
            };

            rooms[roomCode].chatMessages.push(chatMessage);

            // Keep only last 100 messages
            if (rooms[roomCode].chatMessages.length > 100) {
                rooms[roomCode].chatMessages = rooms[roomCode].chatMessages.slice(-100);
            }

            // Broadcast message to all players in the room
            io.to(roomCode).emit('new-message', chatMessage);

            console.log(`Message sent in room ${roomCode} by ${player.playerName}: ${trimmedMessage}`);

        } catch (err) {
            console.error('Error sending message:', err);
            socket.emit('room-error', 'Error sending message');
        }
    });

    // Get room info
    socket.on('get-room-info', (roomCode) => {
        if (rooms[roomCode]) {
            socket.emit('room-info', rooms[roomCode]);
        } else {
            socket.emit('room-error', 'Room not found');
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);

        // Remove player from all rooms
        for (const roomCode in rooms) {
            const room = rooms[roomCode];
            const playerIndex = room.players.findIndex(p => p.socketId === socket.id);

            if (playerIndex !== -1) {
                const removedPlayer = room.players.splice(playerIndex, 1)[0];
                console.log(`Player ${removedPlayer.playerName} left room ${roomCode}`);

                // If the host left, assign a new host
                if (removedPlayer.isHost && room.players.length > 0) {
                    room.players[0].isHost = true;
                    console.log(`New host assigned: ${room.players[0].playerName}`);
                }

                // Broadcast updated player list to remaining players
                io.to(roomCode).emit('players-updated', room.players);

                // Delete room if empty
                if (room.players.length === 0) {
                    delete rooms[roomCode];
                    console.log(`Room ${roomCode} deleted (empty)`);
                }
                break;
            }
        }
    });

    // Debug endpoint
    socket.on('debug-rooms', () => {
        console.log('Current rooms:', Object.keys(rooms));
        for (const roomCode in rooms) {
            console.log(`Room ${roomCode}:`, rooms[roomCode].players.map(p => p.playerName));
        }
        socket.emit('debug-rooms-response', rooms);
    });


    // On your server
    const roomDrawings = {};

    // Listen for drawing submissions
    socket.on('submit-drawing', async ({ roomCode, playerId, playerName, character, image }) => {
        if (!roomDrawings[roomCode]) roomDrawings[roomCode] = [];
        // Prevent duplicate submissions
        if (!roomDrawings[roomCode].some(d => d.playerId === playerId)) {
            roomDrawings[roomCode].push({ playerId, playerName, character, image });
        }

        // Check if all players have submitted
        const totalPlayers = rooms[roomCode]?.players?.length || 0;
        if (roomDrawings[roomCode].length === totalPlayers) {
            // Score and emit results
            const results = await scoreDrawings(roomDrawings[roomCode], rooms[roomCode].selectedWord);
            io.to(roomCode).emit('game-results', results);
            // Clean up for next round
            console.log('Emitting game-results for room', roomCode, results);
            delete roomDrawings[roomCode];
        }
    });

    // ...existing code...
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    async function scoreDrawings(drawings, word) {
        // drawings: [{playerId, playerName, image}]
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const results = [];
        for (const d of drawings) {
            const prompt = `Score this drawing for the word "${word}". Return a score from 0 to 100.`;
            const result = await model.generateContent([
                prompt,
                { inlineData: { data: d.image.split(',')[1], mimeType: "image/png" } }
            ]);
            const score = parseInt(result.response.text().match(/\d+/)[0]);
            results.push({ ...d, score });
        }
        // Sort by score descending
        results.sort((a, b) => b.score - a.score);
        return results;
    }

});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});