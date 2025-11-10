import { PrismaClient } from "@/generated/prisma";
import { stringify } from "csv-stringify/sync";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const game_code = searchParams.get("code");

    if (!game_code)
      return new Response(
        JSON.stringify({ error: "Game code is required." }),
        { status: 400 }
      );

    // 🎮 1. Fetch all records related to this game
    const records = await prisma.classGameRecord.findMany({
      where: { game_code },
      include: {
        student: {
          select: {
            id_number: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    if (!records.length) {
      return new Response(
        JSON.stringify({ error: "No records found for this game code." }),
        { status: 404 }
      );
    }

    // 🧮 2. Format records for CSV
    const formatted = records.map((r) => ({
      id_number: `="${r.student?.id_number || ""}"`, // Prevents Excel scientific notation
      name: `${r.student?.first_name || ""} ${r.student?.last_name || ""}`.trim(),
      email: r.student?.email || "",
      points: r.points ?? 0,
      game_code: r.game_code,
      created_at: new Date(r.created_at).toLocaleString(),
    }));

    // 🧾 3. Convert to CSV (formatted for Excel)
    const csv = stringify(formatted, {
      header: true,
      columns: [
        { key: "id_number", header: "Student ID" },
        { key: "name", header: "Full Name" },
        { key: "email", header: "Email" },
        { key: "points", header: "Points" },
        { key: "game_code", header: "Game Code" },
        { key: "created_at", header: "Date Recorded" },
      ],
    });

    // 📦 4. Return downloadable CSV
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="game_${game_code}_records.csv"`,
      },
    });
  } catch (err) {
    console.error("❌ Error generating game CSV:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error while exporting game records." }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
