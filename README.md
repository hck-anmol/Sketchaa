
# 🎨 Sketchaa - Multiplayer Drawing & AI Judge Game

**Sketchaa** is a fun, fast-paced multiplayer drawing game where creativity meets AI! Draw the given word and let a local AI model judge your artwork — no player voting needed.

---

## ✨ **Features**

- 🖌️ Real-time multiplayer drawing canvas
- ⏱️ 60-second timed drawing rounds
- 🤖 AI-powered judging using **Ollama** (`qwen2.5vl:7b`) — runs fully locally
- 🎯 Live "AI Judging…" reveal — watch each card flip as the AI evaluates
- 💬 Short AI feedback for every drawing
- 🏆 Automatic leaderboard ranked by AI score
- 💬 In-game chat system
- 🔒 Players can't join once the game has started
- ⏲️ Room auto-expires after all players leave

---

## 🚀 **Getting Started**

### Prerequisites

You need **Ollama** installed and the `qwen2.5vl:7b` model pulled before running the server.

#### 1. Install Ollama

Download and install from [https://ollama.com/download](https://ollama.com/download)

#### 2. Pull the vision model

```bash
ollama pull qwen2.5vl:7b
```

> ⚠️ This model is ~5 GB. Make sure you have enough disk space and at least 8 GB RAM (16 GB recommended for smooth performance).

#### 3. Make sure Ollama is running

Ollama starts automatically on most systems. You can verify it's running at:
```
http://localhost:11434
```

---

### Clone the repository

```bash
git clone https://github.com/hck-anmol/Sketchaa.git
cd Sketchaa
```

### Install dependencies (Server & Client separately)

```bash
# For server
cd server
npm install

# For client
cd ../client
npm install
```

### Run the project

```bash
# Start the server (in the /server directory)
node server.js

# Start the client (in the /client directory)
npm run dev
```

The client will run at `http://localhost:5173` and the server at `http://localhost:5000`.

---

## ⚙️ **Configuration (Optional)**

You can customize Ollama settings using a `.env` file in the `/server` directory:

```env
PORT=5000
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5vl:7b
```

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Port for the game server |
| `OLLAMA_URL` | `http://localhost:11434` | URL where Ollama is running |
| `OLLAMA_MODEL` | `qwen2.5vl:7b` | Vision model to use for judging |

---

## 🎮 **How It Works**

1. **Create or join a room** with a room code
2. **Host selects a word** (or randomizes it) and starts the game
3. **Everyone draws** the word on the canvas within 60 seconds
4. **Time's up!** All drawings are submitted automatically
5. **AI Judge kicks in** — `qwen2.5vl:7b` evaluates each drawing one by one, live
6. Watch each drawing card **flip to reveal** the AI score (1–10) and a short feedback sentence
7. **Leaderboard** shows final rankings with AI scores and feedback

---

## 🛠️ **Tech Stack**

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Backend | Express + Socket.io |
| AI Judge | Ollama (`qwen2.5vl:7b`) — local, no API key needed |

---

## 🔧 **Troubleshooting**

### AI judge shows "AI offline – fallback score"
- Make sure Ollama is running: open a terminal and run `ollama serve`
- Verify the model is downloaded: `ollama list` should show `qwen2.5vl:7b`
- Check that port `11434` is not blocked by a firewall

### Server crashes on drawing submission
- The server accepts large base64 image payloads. The `express.json` limit is set to `50mb` which should be sufficient for canvas drawings.

### Model is too slow
- `qwen2.5vl:7b` requires a capable machine. If it's too slow, you can try a smaller model like `qwen2.5vl:3b` and update `OLLAMA_MODEL` in your `.env`.

---

## 🖥️ **Screenshots**

*(Add your game screenshots here for better presentation)*

---

## 💡 **Future Improvements**

- Public rooms & quick play
- More customizable drawing tools
- Mobile optimization
- Support for other Ollama vision models

---

## 📢 **About the Developer**

Developed by [hck-anmol](https://github.com/hck-anmol) with love for creativity and real-time web apps.
