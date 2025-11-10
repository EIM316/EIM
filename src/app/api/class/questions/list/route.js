import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const class_id = searchParams.get("class_id");
    const teacher_id = searchParams.get("teacher_id");

    let resolvedClassId = class_id;

    // ✅ Auto-detect class from teacher_id if class_id not given
    if (!resolvedClassId && teacher_id) {
      const foundClass = await prisma.class.findFirst({
        where: { professor_id: teacher_id },
        select: { id: true },
      });

      if (foundClass) {
        resolvedClassId = foundClass.id.toString();
        console.log(`✅ Found class ${resolvedClassId} for teacher ${teacher_id}`);
      }
    }

    if (!resolvedClassId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing class_id or teacher_id could not resolve class",
        }),
        { status: 400 }
      );
    }

    // ✅ Fetch all questions for this class
    const questions = await prisma.ClassQuestion.findMany({
      where: { class_id: Number(resolvedClassId) },
      orderBy: { id: "asc" },
    });

    if (!questions || questions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, questions: [] }),
        { status: 200 }
      );
    }

    // ✅ Format for frontend (use actual field names from your schema)
    const formatted = questions.map((q) => ({
      id: q.id,
      question: q.question,
      question_image: q.question_image || null,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      option_a_image: q.option_a_image || null,
      option_b_image: q.option_b_image || null,
      option_c_image: q.option_c_image || null,
      option_d_image: q.option_d_image || null,
      answer: q.answer || "A",
    }));

    return new Response(
      JSON.stringify({ success: true, questions: formatted }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error fetching questions:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Server error" }),
      { status: 500 }
    );
  }
}
