// src/app/api/gamemode2/list-all/route.js
import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const level_id = searchParams.get("level_id");

    // Build query filter
    const where = level_id ? { level_id: Number(level_id) } : {};

    // Fetch questions
    const questions = await prisma.gamemode2.findMany({
      where,
      orderBy: { id: "asc" },
      select: {
        id: true,
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
        created_at: true,
      },
    });

    console.log("🧩 [API] gamemode2/list-all fetched:", questions.length, "records");

    return new Response(JSON.stringify(questions), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ GET /api/gamemode2/list-all error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch Game Mode 2 questions" }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
