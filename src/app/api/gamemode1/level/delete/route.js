import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id"));

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid level ID" }),
        { status: 400 }
      );
    }

    // ✅ Delete all questions linked to this level
    await prisma.gamemode1.deleteMany({
      where: { level_id: id },
    });

    // ✅ Delete the level itself (use correct model name)
    await prisma.gamemode1Level.delete({
      where: { id },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Level and all related questions deleted successfully.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("DELETE /api/gamemode1/level/delete error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete level and questions" }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
