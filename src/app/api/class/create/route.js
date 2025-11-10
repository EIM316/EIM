import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { teacher_id, class_name, class_code } = await req.json();

    if (!teacher_id || !class_name || !class_code) {
      return new Response(
        JSON.stringify({ error: "Missing required fields." }),
        { status: 400 }
      );
    }

    // ✅ Create class record
    const newClass = await prisma.class.create({
      data: {
        teacher_id,
        class_name,
        class_code,
        student_count: 0,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Class created successfully.",
        class: newClass,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Create Class Error:", error);
    if (error.code === "P2002") {
      return new Response(
        JSON.stringify({ error: "Class code already exists." }),
        { status: 409 }
      );
    }

    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
