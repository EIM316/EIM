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

    // ✅ Check if the user exists in student or teacher tables
    const student = await prisma.student.findFirst({
      where: { id_number, email },
    });

    const teacher = await prisma.teacher.findFirst({
      where: { id_number, email },
    });

    if (!student && !teacher) {
      return new Response(
        JSON.stringify({
          error: "No account found with this ID and email.",
        }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Forgot password verification error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500 }
    );
  }
}
