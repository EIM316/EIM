const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// 🔹 Structure: roomCode → array of player objects
const rooms = {};

io.on("connection", (socket) => {
  console.log("✅ Connected:", socket.id);

  // 🟢 Player joins a room
  socket.on("join_room", (roomCode, playerName, playerAvatar) => {
    if (!rooms[roomCode]) rooms[roomCode] = [];

    // Avoid duplicates
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
    console.log(`🟢 ${playerName} joined room ${roomCode}`);

    // Send updated list to everyone in room
    io.to(roomCode).emit("update_player_list", rooms[roomCode]);
  });

  // 🟢 Game started by professor (or first player)
  socket.on("start_game", (roomCode) => {
    console.log(`🎮 Game started in room ${roomCode}`);
    io.to(roomCode).emit("game_started");
  });

  // 🟢 When a player updates progress
  socket.on("update_progress", ({ roomCode, playerName, newHeight }) => {
    if (!rooms[roomCode]) return;

    // Update height for that player
    rooms[roomCode] = rooms[roomCode].map((p) =>
      p.name === playerName ? { ...p, height: newHeight } : p
    );

    // Send updated list only to players in that room
    io.to(roomCode).emit("player_progress_update", rooms[roomCode]);
  });

  // 🏁 When a room finishes the game
  socket.on("finish_game", (roomCode) => {
    console.log(`🏁 Game finished in ${roomCode}`);
    const finalPlayers = rooms[roomCode] || [];
    io.to(roomCode).emit("game_finished", finalPlayers);
  });

  // 🔴 Handle disconnects
  socket.on("disconnect", () => {
    for (const [roomCode, players] of Object.entries(rooms)) {
      const index = players.findIndex((p) => p.id === socket.id);
      if (index !== -1) {
        const leftPlayer = players[index];
        players.splice(index, 1);
        console.log(`❌ ${leftPlayer.name} left room ${roomCode}`);

        io.to(roomCode).emit("update_player_list", players);

        // If room is empty, delete it
        if (players.length === 0) delete rooms[roomCode];
        break;
      }
    }
  });
});

httpServer.listen(3001, () => {
  console.log("🎮 Socket.IO server running on port 3001");
});
