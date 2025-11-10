import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("class_id");

    if (!classId) {
      return new Response(
        JSON.stringify({ error: "Missing class_id parameter." }),
        { status: 400 }
      );
    }

    // ✅ Fetch students, including name and avatar from Student table
    const students = await prisma.studentClass.findMany({
      where: { class_id: Number(classId) },
      select: {
        id: true,
        joined_at: true,
        student: {
          select: {
            id_number: true,
            first_name: true,
            last_name: true,
            avatar: true, // ✅ include avatar
          },
        },
      },
      orderBy: { joined_at: "asc" },
    });

    // ✅ Transform data for frontend
    const formattedStudents = students.map((s) => ({
      id: s.id,
      id_number: s.student.id_number,
      first_name: s.student.first_name,
      last_name: s.student.last_name,
      avatar: s.student.avatar,
      joined_at: s.joined_at,
    }));

    return new Response(
      JSON.stringify({ success: true, students: formattedStudents }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error fetching students with names and avatars:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500 }
    );
  }
}
