import { PrismaClient } from "@/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { id_number, password } = body;

    // Validate input
    if (!id_number || !password) {
      return new Response(JSON.stringify({ error: "ID Number and password are required." }), {
        status: 400,
      });
    }

    // Check if user exists
    const user = await prisma.student.findUnique({ where: { id_number } });
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found." }), { status: 404 });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await prisma.student.update({
      where: { id_number },
      data: { password: hashedPassword },
    });

    return new Response(JSON.stringify({ message: "Password updated successfully." }), {
      status: 200,
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
