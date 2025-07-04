app.get('/api/rooms', async (req, res) => {
    try {
        const rooms = await Room.find();
        res.json(rooms);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


app.post('/api/rooms', async (req, res) => {
    try {
        const { roomCode, hostPlayer } = req.body;

        const existingRoom = await Room.findOne({ roomCode });
        if (existingRoom) {
            return res.status(400).json({ error: 'Room code already exists' });
        }

        const newRoom = new Room({
            roomCode,
            players: [hostPlayer],
        });

        await newRoom.save();
        res.json(newRoom);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/rooms/:roomCode/add-player', async (req, res) => {
    try {
        const { player } = req.body;
        const { roomCode } = req.params;

        const room = await Room.findOne({ roomCode });

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        room.players.push(player);
        await room.save();

        res.json(room);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
