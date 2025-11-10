import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log("✅ Exporting all student records...");

    const students = await prisma.student.findMany({
      orderBy: { created_at: "desc" },
      select: {
        id_number: true,
        first_name: true,
        last_name: true,
        email: true,
        created_at: true,
      },
    });

    if (!students.length) {
      return new Response("No students found.", { status: 404 });
    }

    const header = "ID Number,First Name,Last Name,Email,Created At\n";
    const rows = students
      .map(
        (s) =>
          `"${s.id_number}","${s.first_name}","${s.last_name}","${s.email}","${new Date(
            s.created_at
          ).toLocaleDateString("en-US")}"`
      )
      .join("\n");

    const csv = header + rows;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="student_records.csv"',
      },
    });
  } catch (error) {
    console.error("❌ Error exporting students:", error);
    return new Response("Internal Server Error", { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
