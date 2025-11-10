import { PrismaClient } from "@/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      id_number,
      first_name,
      last_name,
      email,
      password,
      confirmPassword,
      avatar,
    } = body;

    // ✅ Validation
    if (
      !id_number ||
      !first_name ||
      !last_name ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return new Response(
        JSON.stringify({ error: "All fields are required." }),
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return new Response(
        JSON.stringify({ error: "Passwords do not match." }),
        { status: 400 }
      );
    }

    // ✅ Check if teacher already exists
    const existingTeacher = await prisma.teacher.findFirst({
      where: { OR: [{ email }, { id_number }] },
    });

    if (existingTeacher) {
      return new Response(
        JSON.stringify({ error: "Email or ID already registered." }),
        { status: 400 }
      );
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Save to DB
    const newTeacher = await prisma.teacher.create({
      data: {
        id_number,
        first_name,
        last_name,
        email,
        password: hashedPassword,
        avatar,
      },
    });

    return new Response(
      JSON.stringify({ success: true, teacher: newTeacher }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Teacher Registration Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500 }
    );
  }
}
