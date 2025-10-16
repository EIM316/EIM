import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

// ✅ GET — Fetch student progress (all levels)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const student_id = searchParams.get("student_id");

    if (!student_id) {
      return new Response(
        JSON.stringify({ error: "Missing student_id parameter." }),
        { status: 400 }
      );
    }

    const progress = await prisma.gamemode1Progress.findMany({
      where: { student_id },
      orderBy: { level_id: "asc" },
      select: {
        id: true,
        level_id: true,
        stars: true,
        completed_at: true,
      },
    });

    return new Response(JSON.stringify(progress), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET /api/gamemode1/progress error:", error);
    return new Response(
      JSON.stringify({ error: "Error fetching student progress." }),
      { status: 500 }
    );
  }
}

// ✅ POST — Save or update student progress
export async function POST(req) {
  try {
    const body = await req.json();
    const { student_id, level_id, stars } = body;

    if (!student_id || !level_id || stars === undefined) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: student_id, level_id, stars",
        }),
        { status: 400 }
      );
    }

    // Limit stars to 0–3
    const safeStars = Math.max(0, Math.min(stars, 3));

    // ✅ Upsert (Insert or Update)
    const progress = await prisma.gamemode1Progress.upsert({
      where: {
        student_id_level_id: {
          student_id,
          level_id,
        },
      },
      update: {
        stars: safeStars,
        completed_at: new Date(),
      },
      create: {
        student_id,
        level_id,
        stars: safeStars,
      },
    });

    return new Response(JSON.stringify(progress), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("POST /api/gamemode1/progress error:", error);
    return new Response(
      JSON.stringify({ error: "Error saving student progress." }),
      { status: 500 }
    );
  }
}
