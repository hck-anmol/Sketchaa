const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    playerId: { type: String, required: true },
    playerName: { type: String, required: true },
    score: { type: Number, default: 0 },
    character: { type: String, required: true },
});

const roomDrawingSchema = new mongoose.Schema({
    roomCode: { type: String, required: true, unique: true },
    players: [playerSchema],
});

const Drawing = mongoose.model('Drawing', roomDrawingSchema);

module.exports = Drawing;
