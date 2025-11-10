import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const game_code = searchParams.get("game_code");

    if (!game_code) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing game_code parameter." }),
        { status: 400 }
      );
    }

    // ✅ Delete the matching game from Neon (classModeGame table)
    const deleted = await prisma.classModeGame.deleteMany({
      where: { game_code },
    });

    if (deleted.count === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Game not found." }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Game ${game_code} deleted successfully.`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error deleting class mode game:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error." }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
