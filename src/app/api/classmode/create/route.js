import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { class_id, teacher_id, game_type } = body;

    // 🧩 Validate inputs
    if (!class_id || !teacher_id || !game_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields." }),
        { status: 400 }
      );
    }

    // ✅ Generate a random 5-character alphanumeric game code
    const game_code = Math.random().toString(36).substring(2, 7).toUpperCase();

    // ✅ Create the new class mode game
    const newGame = await prisma.classModeGame.create({
      data: {
        class_id: Number(class_id),
        teacher_id,
        game_type,
        game_code,
      },
      select: {
        id: true,
        class_id: true,
        teacher_id: true,
        game_code: true,
        game_type: true,
        status: true,
        created_at: true,
      },
    });

    return new Response(
      JSON.stringify({ success: true, game: newGame }),
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creating class mode game:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500 }
    );
  }
}
