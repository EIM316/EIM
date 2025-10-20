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
      base_question_id, 
      question_image,
      option_a_image,
      option_b_image,
      option_c_image,
      option_d_image,
    } = body;

    // Validate required fields
    if (!question || !option_a || !option_b || !option_c || !option_d || !answer) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ✅ Create question
    const newQuestion = await prisma.gamemode4.create({
      data: {
        question,
        option_a,
        option_b,
        option_c,
        option_d,
        answer,
        question_image: question_image || null,
        option_a_image: option_a_image || null,
        option_b_image: option_b_image || null,
        option_c_image: option_c_image || null,
        option_d_image: option_d_image || null,
        base_question_id: base_question_id || null,
      },
    });

    return new Response(JSON.stringify(newQuestion), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("POST /api/gamemode4/add error:", error);
    return new Response(JSON.stringify({ error: "Error adding question" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    await prisma.$disconnect();
  }
}
