import { PrismaClient } from "@/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { id_number, first_name, last_name, email, password, confirmPassword, avatar } = body;

    // ✅ Validation
    if (!id_number || !first_name || !last_name || !email || !password || !confirmPassword) {
      return new Response(JSON.stringify({ error: "All fields are required." }), { status: 400 });
    }

    if (password !== confirmPassword) {
      return new Response(JSON.stringify({ error: "Passwords do not match." }), { status: 400 });
    }

    // ✅ Check if email or id already exists
    const existing = await prisma.student.findFirst({
      where: { OR: [{ email }, { id_number }] },
    });
    if (existing) {
      return new Response(JSON.stringify({ error: "Email or ID already registered." }), { status: 400 });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Save to DB
    const newStudent = await prisma.student.create({
      data: {
        id_number,
        first_name,
        last_name,
        email,
        password: hashedPassword,
        avatar,
      },
    });

    return new Response(JSON.stringify({ success: true, student: newStudent }), { status: 201 });
  } catch (error) {
    console.error("Registration Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error." }), { status: 500 });
  }
}
