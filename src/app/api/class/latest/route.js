import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const student_id = searchParams.get("student_id");

    if (!student_id) {
      return new Response(
        JSON.stringify({ error: "Missing student_id parameter" }),
        { status: 400 }
      );
    }

    // ✅ Fetch the latest joined class for this student
    const latestJoin = await prisma.studentClass.findFirst({
      where: { student_id },
      orderBy: { joined_at: "desc" },
      include: {
        class: {
          select: {
            id: true,
            class_name: true,
            class_code: true,
            teacher_id: true,
            created_at: true,
          },
        },
      },
    });

    if (!latestJoin) {
      return new Response(JSON.stringify({ success: false }), { status: 200 });
    }

    return new Response(
      JSON.stringify({
        success: true,
        class: latestJoin.class,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/class/latest error:", error);
    return new Response(
      JSON.stringify({ error: "Server error fetching latest class" }),
      { status: 500 }
    );
  }
}
