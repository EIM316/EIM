import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

// ✅ GET — Fetch student progress (all levels or specific)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const student_id = searchParams.get("student_id");
    const level_id = searchParams.get("level_id");

    if (student_id && level_id) {
      const progress = await prisma.gamemode1Progress.findUnique({
        where: {
          student_id_level_id: {
            student_id,
            level_id: Number(level_id),
          },
        },
      });
      return new Response(JSON.stringify(progress || {}), { status: 200 });
    }

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
        points: true,
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

// ✅ POST — Save or update student progress (with star + point preservation)
export async function POST(req) {
  try {
    const body = await req.json();
    const { student_id, level_id, stars, points } = body;

    if (!student_id || !level_id || stars === undefined || points === undefined) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: student_id, level_id, stars, points",
        }),
        { status: 400 }
      );
    }

    const safeStars = Math.max(0, Math.min(Number(stars), 3));
    const safePoints = Math.max(0, Number(points));

    const existing = await prisma.gamemode1Progress.findUnique({
      where: {
        student_id_level_id: {
          student_id,
          level_id,
        },
      },
    });

    let finalStars = safeStars;
    let finalPoints = safePoints;

    if (existing && existing.stars > safeStars) {
      finalStars = existing.stars;
    }

    if (existing && existing.points > safePoints) {
      finalPoints = existing.points;
    }

    if (existing && existing.stars === 3) {
      return new Response(
        JSON.stringify({
          message: "Already perfected (3 stars)",
          stars: existing.stars,
          points: existing.points,
        }),
        { status: 200 }
      );
    }

    const progress = await prisma.gamemode1Progress.upsert({
      where: {
        student_id_level_id: {
          student_id,
          level_id,
        },
      },
      update: {
        stars: finalStars,
        points: finalPoints,
        completed_at: new Date(),
      },
      create: {
        student_id,
        level_id,
        stars: finalStars,
        points: finalPoints,
      },
    });

    if (finalStars === 3) {
      const nextLevel = await prisma.gamemode1Level.findUnique({
        where: { id: level_id + 1 },
      });
      if (nextLevel) {
        console.log(`🎯 Student ${student_id} unlocked Level ${level_id + 1}`);
      }
    }

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
