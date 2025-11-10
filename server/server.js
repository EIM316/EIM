const { createServer } = require("http");
const { Server } = require("socket.io");

// ✅ Render assigns PORT dynamically
const PORT = process.env.PORT || 3001;

// ✅ Simple HTTP response to prevent Render timeout
const httpServer = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Socket.IO server is running ✅\n");
});

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
  },
});

// 🧠 Room storage
const rooms = {};

io.on("connection", (socket) => {
  console.log("✅ Connected:", socket.id);

  socket.on("join_room", (roomCode, playerName, playerAvatar) => {
    if (!rooms[roomCode]) rooms[roomCode] = [];

    const alreadyIn = rooms[roomCode].some((p) => p.id === socket.id);
    if (!alreadyIn) {
      rooms[roomCode].push({
        id: socket.id,
        name: playerName,
        avatar: playerAvatar || "/resources/avatars/student1.png",
        height: 0,
      });
    }

    socket.join(roomCode);
    io.to(roomCode).emit("update_player_list", rooms[roomCode]);
    console.log(`🟢 ${playerName} joined ${roomCode}`);
  });

  socket.on("update_progress", ({ roomCode, playerName, newHeight }) => {
    if (!rooms[roomCode]) return;
    rooms[roomCode] = rooms[roomCode].map((p) =>
      p.name === playerName ? { ...p, height: newHeight } : p
    );
    io.to(roomCode).emit("player_progress_update", rooms[roomCode]);
  });

  socket.on("start_game", (roomCode) => {
    io.to(roomCode).emit("game_started");
  });

  socket.on("finish_game", (roomCode) => {
    io.to(roomCode).emit("game_finished", rooms[roomCode] || []);
  });

  socket.on("disconnect", () => {
    for (const [roomCode, players] of Object.entries(rooms)) {
      const index = players.findIndex((p) => p.id === socket.id);
      if (index !== -1) {
        const leftPlayer = players[index];
        players.splice(index, 1);
        console.log(`❌ ${leftPlayer.name} left ${roomCode}`);
        io.to(roomCode).emit("update_player_list", players);
        if (players.length === 0) delete rooms[roomCode];
        break;
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`🎮 Socket.IO server running on port ${PORT}`);
  console.log(`🌐 Allowed origin: ${process.env.FRONTEND_URL || "*"}`);
});
