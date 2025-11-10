import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      class_id,
      teacher_id,
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      answer,
      question_image,
      option_images,
    } = body;

    if (!class_id || !teacher_id || !question || !answer) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const newQuestion = await prisma.ClassQuestion.create({
      data: {
        class_id: Number(class_id),
        created_by: String(teacher_id),
        question,
        question_image: question_image || null,
        option_a,
        option_b,
        option_c,
        option_d,
        option_a_image: option_images?.A || null,
        option_b_image: option_images?.B || null,
        option_c_image: option_images?.C || null,
        option_d_image: option_images?.D || null,
        answer,
      },
    });

    return new Response(
      JSON.stringify({ success: true, question: newQuestion }),
      { status: 201 }
    );
  } catch (err) {
    console.error("❌ Error adding question:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      { status: 500 }
    );
  }
}
