import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { id_number, class_code } = await req.json();

    if (!id_number || !class_code) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing data" }),
        { status: 400 }
      );
    }

    // ✅ Check class existence
    const classData = await prisma.class.findUnique({
      where: { class_code },
      select: { id: true, class_name: true, class_code: true, student_count: true },
    });

    if (!classData) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid class code." }),
        { status: 404 }
      );
    }

    // ✅ Check if student already joined this class
    const existingJoin = await prisma.studentClass.findUnique({
      where: {
        student_id_class_id: {
          student_id: id_number,
          class_id: classData.id,
        },
      },
    });

    if (existingJoin) {
      // Already joined — return without incrementing
      return new Response(
        JSON.stringify({
          success: true,
          message: "Already joined this class.",
          class: classData,
        }),
        { status: 200 }
      );
    }

    // ✅ Record join
    await prisma.studentClass.create({
      data: {
        student_id: id_number,
        class_id: classData.id,
      },
    });

    // ✅ Increment student count once
    await prisma.class.update({
      where: { id: classData.id },
      data: { student_count: { increment: 1 } },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully joined class!",
        class: classData,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Join class error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      { status: 500 }
    );
  }
}
