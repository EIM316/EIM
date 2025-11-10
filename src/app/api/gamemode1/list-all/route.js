import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function GET() {
  try {
    const questions = await prisma.gamemode1.findMany({
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
    console.error("GET /api/gamemode1/list-all error:", error);
    return new Response(
      JSON.stringify({ error: "Error fetching all questions" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    await prisma.$disconnect();
  }
}
