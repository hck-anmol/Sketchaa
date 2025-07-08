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

const PORT = process.env.PORT || 5000;

const rooms = {};
const roomDrawings = {};
const roomScores = {};

app.get('/', (req, res) => {
    res.send('Server is running...');
});

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
            roomScores[roomCode] = {};

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

            if (!roomScores[roomCode]) {
                roomScores[roomCode] = {};
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
            roomScores[roomCode] = {};

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

    socket.on('submit-score', ({ roomCode, scorerId, targetPlayerId, score }) => {
        try {
            if (!rooms[roomCode]) {
                return socket.emit('score-error', 'Room does not exist');
            }

            if (!roomScores[roomCode]) {
                roomScores[roomCode] = {};
            }

            if (scorerId === targetPlayerId) {
                return socket.emit('score-error', 'Cannot score your own drawing');
            }

            if (score < 1 || score > 10) {
                return socket.emit('score-error', 'Score must be between 1 and 10');
            }

            if (!roomScores[roomCode][targetPlayerId]) {
                roomScores[roomCode][targetPlayerId] = [];
            }

            if (!rooms[roomCode].scoringTracker) {
                rooms[roomCode].scoringTracker = {};
            }

            const scoringKey = `${scorerId}-${targetPlayerId}`;
            if (rooms[roomCode].scoringTracker[scoringKey]) {
                return socket.emit('score-error', 'You have already scored this drawing');
            }

            roomScores[roomCode][targetPlayerId].push(score);

            rooms[roomCode].scoringTracker[scoringKey] = true;

            const scores = roomScores[roomCode][targetPlayerId];
            const totalScore = scores.reduce((sum, s) => sum + s, 0);
            const totalVotes = scores.length;
            const averageScore = totalVotes > 0 ? parseFloat((totalScore / totalVotes).toFixed(2)) : 0;

            socket.emit('score-submitted', {
                success: true,
                targetPlayerId: targetPlayerId,
                newTotalScore: totalScore,
                newTotalVotes: totalVotes,
                newAverageScore: averageScore
            });

            checkVotingComplete(roomCode);
        } catch (err) {
            console.error('Error submitting score:', err);
            socket.emit('score-error', 'Error submitting score');
        }
    });

    socket.on('get-scoring-history', ({ roomCode, playerId }) => {
        try {
            if (!rooms[roomCode]) {
                return socket.emit('room-error', 'Room does not exist');
            }

            const scoredDrawings = [];
            const scoringTracker = rooms[roomCode].scoringTracker || {};

            for (const key in scoringTracker) {
                if (scoringTracker[key]) {
                    const [scorerId, targetPlayerId] = key.split('-');
                    if (scorerId === playerId) {
                        scoredDrawings.push(targetPlayerId);
                    }
                }
            }

            socket.emit('scoring-history', { scoredDrawings });
        } catch (err) {
            console.error('Error getting scoring history:', err);
            socket.emit('room-error', 'Error getting scoring history');
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
            const scores = roomScores[roomCode] || {};

            const results = players.map(player => {
                const drawing = drawings[player.playerId];
                const playerScores = scores[player.playerId] || [];
                const totalScore = playerScores.reduce((sum, s) => sum + s, 0);
                const totalVotes = playerScores.length;
                const averageScore = totalVotes > 0 ? parseFloat((totalScore / totalVotes).toFixed(2)) : 0;

                return {
                    playerId: player.playerId,
                    playerName: player.playerName,
                    character: player.character,
                    image: drawing ? drawing.image : null,
                    hasSubmitted: !!drawing,
                    totalScore,
                    totalVotes,
                    averageScore,
                    scores: playerScores
                };
            });

            io.to(roomCode).emit('room-drawings', {
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

    socket.on('get-room-info', (roomCode) => {
        if (rooms[roomCode]) {
            socket.emit('room-info', rooms[roomCode]);
        } else {
            socket.emit('room-error', 'Room not found');
        }
    });

    socket.on('request-game-results', ({ roomCode }) => {
        processGameResults(roomCode);
    });

    socket.on('judge-timer-ended', ({ roomCode }) => {
        if (rooms[roomCode] && roomScores[roomCode]) {
            const scoreAverages = {};
            for (const playerId in roomScores[roomCode]) {
                const scores = roomScores[roomCode][playerId];
                const average = scores.length > 0 ?
                    parseFloat((scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(2)) : 0;
                scoreAverages[playerId] = average;

                const player = rooms[roomCode].players.find(p => p.playerId === playerId);
            }

            const sortedPlayers = Object.entries(scoreAverages)
                .sort(([, a], [, b]) => b - a)
                .map(([playerId, average], index) => {
                    const player = rooms[roomCode].players.find(p => p.playerId === playerId);
                    return {
                        rank: index + 1,
                        playerId,
                        playerName: player?.playerName || 'Unknown',
                        average
                    };
                });

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
                    delete roomScores[roomCode];
                    console.log(`Room ${roomCode} deleted as all players left.`);
                }

                break;
            }
        }
    });
});

function checkVotingComplete(roomCode) {
    try {
        if (!rooms[roomCode] || !roomScores[roomCode]) return;

        const playersInRoom = rooms[roomCode].players;
        const drawingsData = roomDrawings[roomCode] || {};
        const scoringTracker = rooms[roomCode].scoringTracker || {};

        const playersWithSubmittedDrawings = playersInRoom.filter(p => drawingsData[p.playerId]);

        let allPlayersFinishedVoting = true;

        for (const player of playersInRoom) {
            let drawingsScoredByThisPlayer = 0;

            for (const targetPlayer of playersWithSubmittedDrawings) {
                if (player.playerId === targetPlayer.playerId) {
                    continue;
                }

                const scoringKey = `${player.playerId}-${targetPlayer.playerId}`;
                if (scoringTracker[scoringKey]) {
                    drawingsScoredByThisPlayer++;
                }
            }

            const requiredScores = playersWithSubmittedDrawings.filter(
                p => p.playerId !== player.playerId
            ).length;

            if (drawingsScoredByThisPlayer < requiredScores) {
                allPlayersFinishedVoting = false;
                break;
            }
        }

        if (allPlayersFinishedVoting) {
            io.to(roomCode).emit('voting-complete', {
                message: 'All players have finished voting!',
                canViewResults: true
            });
        }
    } catch (err) {
        console.error('Error checking voting completion:', err);
    }
}

function processGameResults(roomCode) {
    try {
        if (!rooms[roomCode]) {
            console.log(`Room ${roomCode} not found for processing results`);
            return;
        }

        const drawings = roomDrawings[roomCode] || {};
        const players = rooms[roomCode].players;
        const selectedWord = rooms[roomCode].selectedWord;
        const scores = roomScores[roomCode] || {};

        const results = [];

        players.forEach(player => {
            const drawing = drawings[player.playerId];
            const playerScores = scores[player.playerId] || [];
            const totalScore = playerScores.reduce((sum, s) => sum + s, 0);
            const totalVotes = playerScores.length;
            const averageScore = totalVotes > 0 ? parseFloat((totalScore / totalVotes).toFixed(2)) : 0;

            results.push({
                playerId: player.playerId,
                playerName: player.playerName,
                character: player.character,
                image: drawing ? drawing.image : null,
                hasSubmitted: !!drawing,
                totalScore,
                totalVotes,
                averageScore,
                scores: playerScores
            });
        });

        results.sort((a, b) => {
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

        results.forEach((result, index) => {
            result.rank = index + 1;
        });

        io.to(roomCode).emit('game-results', {
            roomCode,
            selectedWord,
            results,
            totalPlayers: players.length,
            submittedDrawings: Object.keys(drawings).length
        });
    } catch (err) {
        console.error('Error processing game results:', err);
    }
}

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});