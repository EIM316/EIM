import { PrismaClient } from "@/generated/prisma";

const prismaGlobal = globalThis.prismaGlobal || {};
const prisma = prismaGlobal.prisma || new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = { prisma };

export async function POST(req) {
  try {
    const body = await req.json();
    const { professor_id, game_code, student_id_number, points } = body;

    if (!professor_id || !game_code || !student_id_number) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields." }),
        { status: 400 }
      );
    }

    const now = new Date();
    const THIRTY_SECONDS = 30 * 1000;

    // ✅ Use transaction for concurrency safety
    const record = await prisma.$transaction(async (tx) => {
      // 1️⃣ Find the most recent record for this player & game
      const latest = await tx.classGameRecord.findFirst({
        where: {
          professor_id,
          game_code,
          student_id_number,
        },
        orderBy: { created_at: "desc" },
      });

      // 2️⃣ If record exists and within 30 seconds → update it
      if (latest && now.getTime() - latest.created_at.getTime() < THIRTY_SECONDS) {
        const updated = await tx.classGameRecord.update({
          where: { id: latest.id },
          data: {
            points: points ?? latest.points,
            created_at: now,
          },
        });
        console.log(
          `🔁 Updated record ID ${latest.id} (within 30s window) for ${student_id_number} in game ${game_code}`
        );
        return updated;
      }

      // 3️⃣ Otherwise create a new record (either new round or new game)
      const created = await tx.classGameRecord.create({
        data: {
          professor_id,
          game_code,
          student_id_number,
          points: points ?? 0,
          created_at: now,
        },
      });
      console.log(
        `🆕 Created new record ID ${created.id} for ${student_id_number} in game ${game_code}`
      );

      // 4️⃣ Optional cleanup: delete duplicates that may have slipped in under same game and same second
      const deleted = await tx.classGameRecord.deleteMany({
        where: {
          professor_id,
          game_code,
          student_id_number,
          id: { not: created.id },
          created_at: {
            gte: new Date(now.getTime() - 1000), // 1s window cleanup
          },
        },
      });

      if (deleted.count > 0)
        console.log(
          `🧹 Cleaned up ${deleted.count} accidental duplicate(s) for ${student_id_number} in game ${game_code}`
        );

      return created;
    });

    return new Response(JSON.stringify({ success: true, record }), {
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error saving game record:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error.",
      }),
      { status: 500 }
    );
  }
}
