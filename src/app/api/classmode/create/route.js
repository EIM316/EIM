import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { class_id, teacher_id, game_type, game_code } = body;

    // 🧩 Validate required inputs
    if (!class_id || !teacher_id || !game_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields." }),
        { status: 400 }
      );
    }

    // ✅ Use frontend-provided code if valid, else generate a new one
    const finalCode =
      game_code?.trim()?.length === 5
        ? game_code.toUpperCase()
        : Math.random().toString(36).substring(2, 7).toUpperCase();

    // ✅ Ensure no duplicate game_code in DB
    const existing = await prisma.classModeGame.findFirst({
      where: { game_code: finalCode },
    });

    // 🔁 If duplicate found, regenerate a unique one
    const uniqueCode = existing
      ? Math.random().toString(36).substring(2, 7).toUpperCase()
      : finalCode;

    // ✅ Create the new class mode game
    const newGame = await prisma.classModeGame.create({
      data: {
        class_id: Number(class_id),
        teacher_id,
        game_type,
        game_code: uniqueCode,
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
