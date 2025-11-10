import { PrismaClient } from "@/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { id_number, password } = body;

    if (!id_number || !password) {
      return new Response(
        JSON.stringify({ error: "ID Number and password are required." }),
        { status: 400 }
      );
    }

    // 🔍 Try to find the user in all three tables
    const student = await prisma.student.findUnique({ where: { id_number } });
    const teacher = await prisma.teacher.findUnique({ where: { id_number } });
    const admin = await prisma.admin.findUnique({ where: { admin_id: id_number } });

    if (!student && !teacher && !admin) {
      return new Response(
        JSON.stringify({ error: "Account not found for this ID." }),
        { status: 404 }
      );
    }

    // 🔐 Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🧠 Identify which table to update
    if (student) {
      await prisma.student.update({
        where: { id_number },
        data: { password: hashedPassword },
      });
    } else if (teacher) {
      await prisma.teacher.update({
        where: { id_number },
        data: { password: hashedPassword },
      });
    } else if (admin) {
      await prisma.admin.update({
        where: { admin_id: id_number },
        data: { password: hashedPassword },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password updated successfully.",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset Password Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500 }
    );
  }
}
