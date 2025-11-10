import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing game code parameter." }),
        { status: 400 }
      );
    }

    // ✅ Find game by code
    const game = await prisma.classModeGame.findUnique({
      where: { game_code: code.toUpperCase() },
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

    if (!game) {
      return new Response(
        JSON.stringify({ success: false, error: "Game not found or inactive." }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify({ success: true, game }), {
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error validating game code:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error while validating game code.",
      }),
      { status: 500 }
    );
  }
}
