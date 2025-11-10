import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { id_number, email } = body;

    if (!id_number || !email) {
      return new Response(
        JSON.stringify({ error: "All fields are required." }),
        { status: 400 }
      );
    }

    // ✅ Check if the account exists in any table
    const student = await prisma.student.findFirst({
      where: { id_number, email },
    });

    const teacher = await prisma.teacher.findFirst({
      where: { id_number, email },
    });

    const admin = await prisma.admin.findFirst({
      where: { admin_id: id_number, email },
    });

    // ✅ No match found
    if (!student && !teacher && !admin) {
      return new Response(
        JSON.stringify({
          error: "No account found with this ID and email.",
        }),
        { status: 404 }
      );
    }

    // ✅ Identify which role matched (optional but useful)
    let role = student ? "student" : teacher ? "teacher" : "admin";

    return new Response(
      JSON.stringify({
        success: true,
        role,
        message: `Account verified as ${role}.`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password verification error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500 }
    );
  }
}
