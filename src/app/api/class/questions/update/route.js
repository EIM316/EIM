import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function PUT(req) {
  try {
    const body = await req.json();
    const {
      id,
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      answer,
      question_image,
      option_images,
    } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing question ID" }),
        { status: 400 }
      );
    }

    const updated = await prisma.ClassQuestion.update({
      where: { id: Number(id) },
      data: {
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
      JSON.stringify({ success: true, question: updated }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error updating question:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      { status: 500 }
    );
  }
}
