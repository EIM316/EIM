import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      answer,
      level_id,
      question_image,
      option_a_image,
      option_b_image,
      option_c_image,
      option_d_image,
    } = body;

    if (!question || !option_a || !option_b || !option_c || !option_d || !answer) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // ✅ Save question, linking via level_id (not relation)
    const newQuestion = await prisma.gamemode1.create({
      data: {
        question,
        option_a,
        option_b,
        option_c,
        option_d,
        answer,
        question_image,
        option_a_image,
        option_b_image,
        option_c_image,
        option_d_image,
        level_id, // ✅ correct field
      },
    });

    return new Response(JSON.stringify(newQuestion), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("POST /api/gamemode1/add error:", error);
    return new Response(JSON.stringify({ error: "Error adding question" }), { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
