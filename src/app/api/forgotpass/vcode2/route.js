import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { id_number, code } = body;

    if (!id_number || !code) {
      return new Response(
        JSON.stringify({
          error: "ID Number and verification code are required.",
        }),
        { status: 400 }
      );
    }

    // 🔍 Find matching user (student, teacher, or admin)
    const student = await prisma.student.findUnique({ where: { id_number } });
    const teacher = await prisma.teacher.findUnique({ where: { id_number } });
    const admin = await prisma.admin.findUnique({ where: { admin_id: id_number } });

    if (!student && !teacher && !admin) {
      return new Response(
        JSON.stringify({
          error: "No account found for this ID.",
        }),
        { status: 404 }
      );
    }

    // 🧩 Identify the user's role
    const role = student ? "student" : teacher ? "teacher" : "admin";

    // 🔎 Fetch the latest code record for this ID
    const lastCode = await prisma.forgotPasswordCode.findFirst({
      where: { id_number },
      orderBy: { created_at: "desc" },
    });

    if (!lastCode) {
      return new Response(
        JSON.stringify({ error: "No verification code found for this account." }),
        { status: 404 }
      );
    }

    // ⏰ Check if expired
    const now = new Date();
    if (now > lastCode.expires_at) {
      await prisma.forgotPasswordCode.delete({
        where: { id: lastCode.id },
      });
      return new Response(
        JSON.stringify({ error: "Verification code has expired." }),
        { status: 400 }
      );
    }

    // 🔢 Validate code
    if (String(lastCode.verification_code) !== String(code)) {
      return new Response(
        JSON.stringify({ error: "Invalid verification code." }),
        { status: 400 }
      );
    }

    // ✅ Verification successful → remove the code (so it can’t be reused)
    await prisma.forgotPasswordCode.delete({
      where: { id: lastCode.id },
    });

    return new Response(
      JSON.stringify({
        success: true,
        role,
        message: "Verification successful. You may now reset your password.",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot Password Verification Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500 }
    );
  }
}
