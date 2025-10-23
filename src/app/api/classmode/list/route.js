import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("class_id");

    if (!classId) {
      return new Response(
        JSON.stringify({ error: "Missing class_id parameter." }),
        { status: 400 }
      );
    }

    // ✅ Fetch all games linked to this class
    const games = await prisma.classModeGame.findMany({
      where: { class_id: Number(classId) },
      select: {
        id: true,
        class_id: true,
        teacher_id: true,
        game_code: true,
        game_type: true,
        status: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
    });

    return new Response(JSON.stringify({ success: true, games }), {
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error fetching class mode games:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500 }
    );
  }
}
