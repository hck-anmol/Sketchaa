const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    playerId: { type: String, required: true },
    playerName: { type: String, required: true },
    isHost: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    character: { type: String, required: true },
});

const roomSchema = new mongoose.Schema({
    roomCode: { type: String, required: true, unique: true },
    players: [playerSchema],
    // word: { type: String, required: true },
    isGameStarted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
