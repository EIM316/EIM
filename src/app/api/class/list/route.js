import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const teacher_id = searchParams.get("teacher_id");

    if (!teacher_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing teacher ID" }),
        { status: 400 }
      );
    }

    // ✅ use prisma.class since your model name is "Class"
    const classes = await prisma.class.findMany({
      where: { teacher_id },
      select: {
        id: true,
        class_name: true,
        class_code: true,
        student_count: true, // ✅ correct field name
      },
    });

    // ✅ format response for frontend
    const formatted = classes.map((cls) => ({
      id: cls.id,
      name: cls.class_name,
      code: cls.class_code,
      students: cls.student_count || 0,
    }));

    return new Response(
      JSON.stringify({ success: true, classes: formatted }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Class list error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      { status: 500 }
    );
  }
}
