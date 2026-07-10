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
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 5000;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5vl:7b';

const rooms = {};
const roomDrawings = {};

app.get('/', (req, res) => {
    res.send('Server is running...');
});

async function judgeDrawingWithOllama(imageDataUrl, word) {
    try {
        const base64Image = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');

        const prompt =
            `You are judging a drawing game. The player was asked to draw: "${word}". ` +
            `Look at the image and give it a score from 1 to 10 based on how well it represents the word, creativity, and effort. ` +
            `Reply ONLY with valid JSON in this exact format, nothing else: {"score": <number 1-10>, "feedback": "<one short sentence>"}`;

        const response = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                        images: [base64Image]
                    }
                ],
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama responded with status ${response.status}`);
        }

        const data = await response.json();
        const rawContent = data.message?.content || '';

        const jsonMatch = rawContent.match(/\{[\s\S]*?\}/);
        if (!jsonMatch) throw new Error('No JSON found in Ollama response');

        const parsed = JSON.parse(jsonMatch[0]);
        const score = Math.max(1, Math.min(10, parseInt(parsed.score) || 5));
        const feedback = String(parsed.feedback || 'Interesting drawing!').substring(0, 200);

        return { score, feedback };
    } catch (err) {
        console.error('Ollama judging error:', err.message);
        const fallbackScore = Math.floor(Math.random() * 5) + 4;
        return {
            score: fallbackScore,
            feedback: 'Could not reach AI judge – assigned a default score.',
            aiError: true
        };
    }
}

async function judgeDrawingsWithOllama(roomCode) {
    try {
        if (!rooms[roomCode]) return;

        const drawings = roomDrawings[roomCode] || {};
        const players = rooms[roomCode].players;
        const selectedWord = rooms[roomCode].selectedWord;

        const submittedEntries = players
            .map(p => ({ player: p, drawing: drawings[p.playerId] }))
            .filter(e => e.drawing && e.drawing.image);

        console.log(`[${roomCode}] Judging ${submittedEntries.length} drawing(s) with Ollama (${OLLAMA_MODEL})...`);

        io.to(roomCode).emit('ai-judging-started', {
            totalDrawings: players.length,
            submittedDrawings: submittedEntries.length
        });

        const results = [];

        for (const { player, drawing } of submittedEntries) {
            console.log(`[${roomCode}] Judging drawing by ${player.playerName}...`);

            const { score, feedback, aiError } = await judgeDrawingWithOllama(drawing.image, selectedWord);

            const result = {
                playerId: player.playerId,
                playerName: player.playerName,
                character: player.character,
                image: drawing.image,
                hasSubmitted: true,
                aiScore: score,
                aiFeedback: feedback,
                aiError: aiError || false
            };

            results.push(result);

            io.to(roomCode).emit('ai-judging-progress', { result });

            console.log(`[${roomCode}] ${player.playerName}: score=${score}, feedback="${feedback}"`);
        }

        const submittedIds = new Set(submittedEntries.map(e => e.player.playerId));
        for (const player of players) {
            if (!submittedIds.has(player.playerId)) {
                results.push({
                    playerId: player.playerId,
                    playerName: player.playerName,
                    character: player.character,
                    image: null,
                    hasSubmitted: false,
                    aiScore: 0,
                    aiFeedback: 'No drawing submitted.',
                    aiError: false
                });
            }
        }

        results.sort((a, b) => b.aiScore - a.aiScore);
        results.forEach((r, i) => { r.rank = i + 1; });

        io.to(roomCode).emit('game-results', {
            roomCode,
            selectedWord,
            results,
            totalPlayers: players.length,
            submittedDrawings: submittedEntries.length
        });

        console.log(`[${roomCode}] AI judging complete. Results emitted.`);
    } catch (err) {
        console.error(`[${roomCode}] Error during AI judging:`, err);
        io.to(roomCode).emit('room-error', 'AI judging failed. Please try again.');
    }
}

io.on('connection', (socket) => {

    socket.on('create-room', ({ roomCode, hostPlayer, selectedWord }) => {
        try {
            if (rooms[roomCode]) {
                return socket.emit('room-error', 'Room code already exists');
            }

            hostPlayer.socketId = socket.id;

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

            roomDrawings[roomCode] = {};

            socket.join(roomCode);
            socket.emit('room-created', {
                roomCode,
                players: rooms[roomCode].players,
                selectedWord: rooms[roomCode].selectedWord,
                gameState: rooms[roomCode].gameState
            });

            io.to(roomCode).emit('players-updated', rooms[roomCode].players);
            io.to(roomCode).emit('word-updated', rooms[roomCode].selectedWord);
            io.to(roomCode).emit('game-state-updated', rooms[roomCode].gameState);
        } catch (err) {
            console.error('Error creating room:', err);
            socket.emit('room-error', 'Error creating room');
        }
    });

    socket.on('join-room', ({ roomCode, player }) => {
        try {
            if (!rooms[roomCode]) {
                return socket.emit('room-error', 'Room does not exist');
            }

            if (rooms[roomCode].gameState.isStarted) {
                return socket.emit('room-error', 'Game has already started! Cannot join now.');
            }

            player.socketId = socket.id;

            const existingPlayerIndex = rooms[roomCode].players.findIndex(p => p.playerId === player.playerId);
            if (existingPlayerIndex !== -1) {
                rooms[roomCode].players[existingPlayerIndex] = player;
            } else {
                rooms[roomCode].players.push(player);
            }

            if (!roomDrawings[roomCode]) {
                roomDrawings[roomCode] = {};
            }

            socket.join(roomCode);

            socket.emit('room-joined', {
                roomCode,
                players: rooms[roomCode].players,
                selectedWord: rooms[roomCode].selectedWord,
                chatMessages: rooms[roomCode].chatMessages,
                gameState: rooms[roomCode].gameState
            });

            io.to(roomCode).emit('players-updated', rooms[roomCode].players);
            io.to(roomCode).emit('word-updated', rooms[roomCode].selectedWord);
            io.to(roomCode).emit('game-state-updated', rooms[roomCode].gameState);
        } catch (err) {
            console.error('Error joining room:', err);
            socket.emit('room-error', 'Error joining room');
        }
    });

    socket.on('rejoin-room', ({ roomCode, playerId }) => {
        try {
            if (!rooms[roomCode]) {
                return socket.emit('room-error', 'Room does not exist');
            }

            const playerIndex = rooms[roomCode].players.findIndex(p => p.playerId === playerId);
            if (playerIndex !== -1) {
                rooms[roomCode].players[playerIndex].socketId = socket.id;
                socket.join(roomCode);

                if (rooms[roomCode].gameState.isStarted && rooms[roomCode].gameState.startTime) {
                    const elapsed = Math.floor((Date.now() - rooms[roomCode].gameState.startTime) / 1000);
                    rooms[roomCode].gameState.remainingTime = Math.max(0, rooms[roomCode].gameState.duration - elapsed);
                }

                socket.emit('room-rejoined', {
                    roomCode,
                    players: rooms[roomCode].players,
                    selectedWord: rooms[roomCode].selectedWord,
                    chatMessages: rooms[roomCode].chatMessages,
                    gameState: rooms[roomCode].gameState
                });
            } else {
                socket.emit('room-error', 'Player not found in room');
            }
        } catch (err) {
            console.error('Error rejoining room:', err);
            socket.emit('room-error', 'Error rejoining room');
        }
    });

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

            roomDrawings[roomCode] = {};

            rooms[roomCode].gameState.isStarted = true;
            rooms[roomCode].gameState.startTime = Date.now();
            rooms[roomCode].gameState.duration = 60;
            rooms[roomCode].gameState.remainingTime = rooms[roomCode].gameState.duration;

            io.to(roomCode).emit('game-started', {
                startTime: rooms[roomCode].gameState.startTime,
                duration: rooms[roomCode].gameState.duration
            });

            io.to(roomCode).emit('game-state-updated', rooms[roomCode].gameState);

            const gameTimer = setInterval(() => {
                if (!rooms[roomCode]) {
                    clearInterval(gameTimer);
                    return;
                }

                const elapsed = Math.floor((Date.now() - rooms[roomCode].gameState.startTime) / 1000);
                rooms[roomCode].gameState.remainingTime = Math.max(0, rooms[roomCode].gameState.duration - elapsed);

                io.to(roomCode).emit('time-update', rooms[roomCode].gameState.remainingTime);

                if (rooms[roomCode].gameState.remainingTime <= 0) {
                    clearInterval(gameTimer);
                    rooms[roomCode].gameState.isStarted = false;

                    io.to(roomCode).emit('request-final-drawing');
                    io.to(roomCode).emit('drawing-phase-ended');
                    io.to(roomCode).emit('game-state-updated', rooms[roomCode].gameState);

                    // 2s buffer for clients to flush final drawings before judging
                    setTimeout(() => {
                        judgeDrawingsWithOllama(roomCode);
                    }, 2000);
                }
            }, 1000);
        } catch (err) {
            console.error('Error starting game:', err);
            socket.emit('room-error', 'Error starting game');
        }
    });

    socket.on('submit-drawing', ({ roomCode, playerId, playerName, character, image }) => {
        try {
            if (!rooms[roomCode]) {
                return socket.emit('room-error', 'Room does not exist');
            }

            if (!roomDrawings[roomCode]) {
                roomDrawings[roomCode] = {};
            }

            roomDrawings[roomCode][playerId] = {
                playerId,
                playerName,
                character,
                image,
                submittedAt: Date.now()
            };

            socket.emit('drawing-submitted', { success: true });
        } catch (err) {
            console.error('Error submitting drawing:', err);
            socket.emit('room-error', 'Error submitting drawing');
        }
    });

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
            io.to(roomCode).emit('word-updated', newWord);
        } catch (err) {
            console.error('Error changing word:', err);
            socket.emit('room-error', 'Error changing word');
        }
    });

    socket.on('send-message', ({ roomCode, message, playerId }) => {
        try {
            if (!rooms[roomCode]) {
                return socket.emit('room-error', 'Room does not exist');
            }

            const player = rooms[roomCode].players.find(p => p.playerId === playerId);
            if (!player) {
                return socket.emit('room-error', 'Player not found in room');
            }

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

            if (rooms[roomCode].chatMessages.length > 100) {
                rooms[roomCode].chatMessages = rooms[roomCode].chatMessages.slice(-100);
            }

            io.to(roomCode).emit('new-message', chatMessage);
        } catch (err) {
            console.error('Error sending message:', err);
            socket.emit('room-error', 'Error sending message');
        }
    });

    socket.on('get-room-drawings', ({ roomCode }) => {
        try {
            if (!rooms[roomCode]) {
                return socket.emit('room-error', 'Room does not exist');
            }

            const drawings = roomDrawings[roomCode] || {};
            const players = rooms[roomCode].players;
            const selectedWord = rooms[roomCode].selectedWord;

            const results = players.map(player => {
                const drawing = drawings[player.playerId];
                return {
                    playerId: player.playerId,
                    playerName: player.playerName,
                    character: player.character,
                    image: drawing ? drawing.image : null,
                    hasSubmitted: !!drawing
                };
            });

            socket.emit('room-drawings', {
                roomCode,
                results,
                selectedWord,
                totalPlayers: players.length,
                submittedDrawings: Object.keys(drawings).length
            });
        } catch (err) {
            console.error('Error getting room drawings:', err);
            socket.emit('room-error', 'Error getting room drawings');
        }
    });

    socket.on('get-room-info', (roomCode) => {
        if (rooms[roomCode]) {
            socket.emit('room-info', rooms[roomCode]);
        } else {
            socket.emit('room-error', 'Room not found');
        }
    });

    socket.on('request-game-results', ({ roomCode }) => {
        if (rooms[roomCode] && !rooms[roomCode].gameState.isStarted) {
            judgeDrawingsWithOllama(roomCode);
        }
    });

    socket.on('disconnect', () => {
        for (const roomCode in rooms) {
            const room = rooms[roomCode];
            const playerIndex = room.players.findIndex(p => p.socketId === socket.id);

            if (playerIndex !== -1) {
                const removedPlayer = room.players.splice(playerIndex, 1)[0];

                if (removedPlayer.isHost && room.players.length > 0) {
                    room.players[0].isHost = true;
                    io.to(roomCode).emit('host-updated', room.players[0].playerId);
                }

                io.to(roomCode).emit('players-updated', room.players);

                if (room.players.length === 0) {
                    delete rooms[roomCode];
                    delete roomDrawings[roomCode];
                    console.log(`Room ${roomCode} deleted as all players left.`);
                }

                break;
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Ollama URL: ${OLLAMA_URL}`);
    console.log(`Ollama Model: ${OLLAMA_MODEL}`);
});