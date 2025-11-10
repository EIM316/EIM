import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, first_name, last_name, email } = body;

    if (!id || !first_name || !last_name || !email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields.",
        }),
        { status: 400 }
      );
    }

    // ✅ Check for duplicate email
    const existingEmail = await prisma.student.findFirst({
      where: {
        email,
        NOT: { id },
      },
    });

    if (existingEmail) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email already in use by another student.",
        }),
        { status: 400 }
      );
    }

    // ✅ Update student
    const updated = await prisma.student.update({
      where: { id },
      data: { first_name, last_name, email },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Student updated successfully.",
        student: updated,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error updating student:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error." }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
