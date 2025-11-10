import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log("✅ Exporting all professors...");

    const teachers = await prisma.teacher.findMany({
      orderBy: { created_at: "desc" },
      select: {
        id_number: true,
        first_name: true,
        last_name: true,
        email: true,
        created_at: true,
      },
    });

    if (!teachers.length) {
      return new Response("No professors found.", { status: 404 });
    }

    const header = "ID Number,First Name,Last Name,Email,Created At\n";

    const rows = teachers
      .map(
        (t) =>
          `"${t.id_number}","${t.first_name}","${t.last_name}","${t.email}","${new Date(
            t.created_at
          ).toLocaleDateString("en-US")}"`
      )
      .join("\n");

    const csv = header + rows;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="professors_records.csv"',
      },
    });
  } catch (error) {
    console.error("❌ Error exporting professors:", error);
    return new Response("Internal Server Error", { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
