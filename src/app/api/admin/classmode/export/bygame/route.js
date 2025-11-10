import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const gameCode = searchParams.get("code");

    if (!gameCode) {
      return new Response("Missing game code parameter.", { status: 400 });
    }

    console.log(`✅ Exporting class mode records for game: ${gameCode}`);

    const records = await prisma.classGameRecord.findMany({
      where: { game_code: gameCode },
      include: {
        student: {
          select: {
            id_number: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        game: {
          select: {
            game_code: true,
            game_type: true,
            class: { select: { class_name: true } },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    if (!records.length) {
      return new Response("No records found for this class mode.", {
        status: 404,
      });
    }

    // ✅ Build CSV (no teacher column)
    const header =
      "Student ID,Student Name,Email,Class,Game Type,Game Code,Points,Date\n";

    const rows = records
      .map((r) => {
        const studentName = `${r.student.first_name} ${r.student.last_name}`;
        const className = r.game.class?.class_name || "N/A";
        const date = new Date(r.created_at).toLocaleString("en-US");

        return `"${r.student.id_number}","${studentName}","${r.student.email}","${className}","${r.game.game_type}","${r.game_code}","${r.points}","${date}"`;
      })
      .join("\n");

    const csv = header + rows;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="classmode_${gameCode}_records.csv"`,
      },
    });
  } catch (error) {
    console.error("❌ Error exporting class mode records:", error);
    return new Response("Internal Server Error", { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
