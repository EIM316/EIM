import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, first_name, last_name, email } = body;

    if (!id || !first_name || !last_name || !email) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields." }),
        { status: 400 }
      );
    }

    // ✅ Check if email already exists (and not owned by this teacher)
    const existing = await prisma.teacher.findFirst({
      where: {
        email,
        NOT: { id },
      },
    });

    if (existing) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email already in use by another teacher.",
        }),
        { status: 400 }
      );
    }

    // ✅ Update
    const updated = await prisma.teacher.update({
      where: { id },
      data: { first_name, last_name, email },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Teacher updated successfully.",
        teacher: updated,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error updating teacher:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error." }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
