"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

export default function TestSupabase() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const GAME_CODE = "TEST123"; // <-- change this dynamically if needed

  useEffect(() => {
    let playerChannel: any = null;

    const fetchPlayers = async () => {
      try {
        const { data, error } = await supabase
          .from("players")
          .select("*")
          .eq("game_code", GAME_CODE)
          .eq("is_active", true); // only active players
          
        if (error) console.error("Error fetching players:", error);
        else setPlayers(data || []);
        setLoading(false);
      } catch (err) {
        console.error("Unexpected error:", err);
        setLoading(false);
      }
    };

    fetchPlayers();

    // Realtime updates
    playerChannel = supabase
      .channel(`players-${GAME_CODE}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `game_code=eq.${GAME_CODE}`,
        },
        () => fetchPlayers()
      )
      .subscribe();

    return () => {
      if (playerChannel) supabase.removeChannel(playerChannel);
    };
  }, []);

  // Function to add a new player with is_active set to true
  const addPlayer = async (playerName: string, playerId: string) => {
    try {
      const { data, error } = await supabase
        .from("players")
        .insert({
          id_member: playerId,
          game_code: GAME_CODE,
          name: playerName,
          avatar: "/resources/avatars/student1.png",
          is_active: true, // ← This ensures the player is active
          joined_at: new Date().toISOString()
        });
        
      if (error) {
        console.error("Error adding player:", error);
      } else {
        console.log("Player added successfully");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  if (loading) return <p>Loading players...</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Connected Players ({players.length})</h2>
      
      {/* Button to test adding a player */}
      <button 
        onClick={() => addPlayer("Gelo", "a5e6d97c-4c97-4ad1-8f4d-efcec2071c")}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Add Test Player
      </button>
      
      {players.length === 0 ? (
        <p>No players connected.</p>
      ) : (
        <ul className="space-y-3">
          {players.map((player: any, idx: number) => (
            <li key={idx} className="flex items-center space-x-3 bg-gray-100 p-2 rounded">
              <Image
                src={player.avatar || "/resources/avatars/student1.png"}
                alt={player.name}
                width={40}
                height={40}
                className="rounded-full"
              />
              <span className="font-semibold">{player.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}