import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    // ✅ Extract level_id from query string, e.g. /api/gamemode1/list?level_id=1
    const { searchParams } = new URL(req.url);
    const levelId = searchParams.get("level_id");

    // ✅ If no level_id provided, return an error
    if (!levelId) {
      return new Response(
        JSON.stringify({ error: "Missing level_id parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ Fetch questions filtered by level_id
    const questions = await prisma.gamemode1.findMany({
      where: { level_id: Number(levelId) }, // filter by level_id
      orderBy: { id: "asc" },
      select: {
        id: true,
        level_id: true,
        question: true,
        option_a: true,
        option_b: true,
        option_c: true,
        option_d: true,
        answer: true,
        question_image: true,
        option_a_image: true,
        option_b_image: true,
        option_c_image: true,
        option_d_image: true,
      },
    });

    return new Response(JSON.stringify(questions), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET /api/gamemode1/list error:", error);
    return new Response(
      JSON.stringify({ error: "Error fetching questions" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
