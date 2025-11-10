import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log("✅ Exporting all ClassModeGame records...");

    const classModes = await prisma.classModeGame.findMany({
      include: {
        teacher: { select: { first_name: true, last_name: true } },
        class: { select: { class_name: true } },
      },
      orderBy: { created_at: "desc" },
    });

    if (!classModes.length) {
      return new Response("No class mode records found.", { status: 404 });
    }

    // ✅ CSV Header
    const header =
      "ClassMode ID,Class Name,Teacher,Game Code,Game Type,Status,Created At\n";

    // ✅ Rows
    const rows = classModes
      .map((c) => {
        const teacherName = c.teacher
          ? `${c.teacher.first_name} ${c.teacher.last_name}`
          : "N/A";
        const className = c.class?.class_name || "N/A";
        const date = new Date(c.created_at).toLocaleString("en-US");
        return `"${c.id}","${className}","${teacherName}","${c.game_code}","${c.game_type}","${c.status}","${date}"`;
      })
      .join("\n");

    const csvContent = header + rows;

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition":
          'attachment; filename="all_classmode_records.csv"',
      },
    });
  } catch (error) {
    console.error("❌ Error exporting ClassModeGame records:", error);
    return new Response("Internal server error.", { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
