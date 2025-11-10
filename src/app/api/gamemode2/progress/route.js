import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { student_id, points, score, total_questions, elapsed_time, accuracy } = body;

    if (!student_id) {
      return new Response(JSON.stringify({ error: "Missing student_id" }), { status: 400 });
    }

    // ✅ Check if a record already exists for this student in the last 1 minute
    const existing = await prisma.gamemode2Progress.findFirst({
      where: {
        student_id,
        created_at: {
          gte: new Date(Date.now() - 60 * 1000), // within 1 minute
        },
      },
    });

    if (existing) {
      return new Response(
        JSON.stringify({ message: "Duplicate submission ignored" }),
        { status: 200 }
      );
    }

    const result = await prisma.gamemode2Progress.create({
      data: {
        student_id,
        points,
        score,
        total_questions,
        elapsed_time,
        accuracy: Number(accuracy),
      },
    });

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (err) {
    console.error("POST /gamemode2/progress error:", err);
    return new Response(JSON.stringify({ error: "Error saving progress" }), { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
