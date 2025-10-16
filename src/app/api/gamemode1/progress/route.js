import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

// ✅ GET — Fetch student progress (all levels)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const student_id = searchParams.get("student_id");
    const level_id = searchParams.get("level_id");

    // Optional: Allow fetching a specific level’s progress
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

// ✅ POST — Save or update student progress (with star preservation + unlock logic)
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

    // Clamp stars between 0–3
    const safeStars = Math.max(0, Math.min(Number(stars), 3));

    // Check existing progress first
    const existing = await prisma.gamemode1Progress.findUnique({
      where: {
        student_id_level_id: {
          student_id,
          level_id,
        },
      },
    });

    let finalStars = safeStars;

    // ✅ Preserve highest stars (never downgrade)
    if (existing && existing.stars > safeStars) {
      finalStars = existing.stars;
    }

    // ✅ Prevent updating anything else if already 3 stars (fully complete)
    if (existing && existing.stars === 3) {
      return new Response(
        JSON.stringify({ message: "Already perfected (3 stars)", stars: 3 }),
        { status: 200 }
      );
    }

    // ✅ Upsert (insert or update)
    const progress = await prisma.gamemode1Progress.upsert({
      where: {
        student_id_level_id: {
          student_id,
          level_id,
        },
      },
      update: {
        stars: finalStars,
        completed_at: new Date(),
      },
      create: {
        student_id,
        level_id,
        stars: finalStars,
      },
    });

    // ✅ Optional: Unlock next level only if stars == 3
    if (finalStars === 3) {
      const nextLevel = await prisma.gamemode1Level.findUnique({
        where: { id: level_id + 1 },
      });
      if (nextLevel) {
        // You could also trigger something here like sending unlock info
        console.log(
          `🎯 Student ${student_id} unlocked Level ${level_id + 1}`
        );
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
