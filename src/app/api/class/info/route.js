import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("class_id");

    if (!classId) {
      return new Response(
        JSON.stringify({ error: "Missing class_id." }),
        { status: 400 }
      );
    }

    // ✅ Use correct field names from schema
    const classData = await prisma.class.findUnique({
      where: { id: Number(classId) },
      select: {
        id: true,
        class_name: true,
        class_code: true,
        student_count: true,
        teacher_id: true,
      },
    });

    if (!classData) {
      return new Response(
        JSON.stringify({ error: "Class not found." }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, class: classData }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error fetching class info:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500 }
    );
  }
}
