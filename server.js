// server.js
require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Create Supabase client (server-side, using service key)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // ⚠️ Use SERVICE ROLE key on backend only
  { auth: { persistSession: false } }
);

app.use(express.json());

// 🧠 Root route (for Render/Uptime check)
app.get("/", (req, res) => {
  res.send("✅ Supabase Realtime server is active and healthy!");
});

// 🟢 Join a room — inserts player into the players table
app.post("/join", async (req, res) => {
  const { game_code, name, avatar } = req.body;

  if (!game_code || !name)
    return res.status(400).json({ error: "Missing game_code or name" });

  const { data, error } = await supabase.from("players").insert([
    {
      game_code,
      name,
      avatar: avatar || "/resources/avatars/student1.png",
    },
  ]);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, player: data[0] });
});

// 🔴 Leave the room — deletes player from the players table
app.post("/leave", async (req, res) => {
  const { game_code, name } = req.body;
  if (!game_code || !name)
    return res.status(400).json({ error: "Missing game_code or name" });

  const { error } = await supabase
    .from("players")
    .delete()
    .eq("game_code", game_code)
    .eq("name", name);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// 🧩 Start a game — insert into `game_events` to broadcast
app.post("/start", async (req, res) => {
  const { game_code } = req.body;
  if (!game_code)
    return res.status(400).json({ error: "Missing game_code" });

  const { error } = await supabase
    .from("game_events")
    .insert([{ game_code, event_type: "game_started" }]);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, message: "Game start broadcasted" });
});

// ✅ Run server
app.listen(PORT, () => {
  console.log(`🌐 Supabase Realtime server running on port ${PORT}`);
});
