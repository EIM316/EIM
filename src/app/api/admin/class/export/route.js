import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("class_id");

    if (!classId) {
      return new Response("Missing class_id parameter.", { status: 400 });
    }

    console.log(`✅ Exporting class student records for class ID: ${classId}`);

    const students = await prisma.studentClass.findMany({
      where: { class_id: parseInt(classId) },
      include: {
        student: {
          select: {
            id_number: true,
            first_name: true,
            last_name: true,
            email: true,
            avatar: true,
          },
        },
        class: { select: { class_name: true, class_code: true } },
      },
      orderBy: { joined_at: "asc" },
    });

    if (!students.length) {
      return new Response("No students found for this class.", { status: 404 });
    }

    const header = "ID Number,Full Name,Email,Class Name,Class Code,Joined Date\n";

    const rows = students
      .map((s) => {
        const st = s.student;
        const joinedDate = new Date(s.joined_at).toLocaleDateString("en-US");
        return `"${st.id_number}","${st.first_name} ${st.last_name}","${st.email}","${s.class.class_name}","${s.class.class_code}","${joinedDate}"`;
      })
      .join("\n");

    const csv = header + rows;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="class_${classId}_students.csv"`,
      },
    });
  } catch (error) {
    console.error("❌ Error exporting class students:", error);
    return new Response("Internal Server Error", { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
