import { PrismaClient } from "@/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      admin_id,
      first_name,
      last_name,
      email,
      password,
      confirmPassword,
      avatar,
    } = body;

    // ✅ Validation
    if (
      !admin_id ||
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

    // ✅ Check if admin already exists
    const existingAdmin = await prisma.admin.findFirst({
      where: { OR: [{ email }, { admin_id }] },
    });

    if (existingAdmin) {
      return new Response(
        JSON.stringify({ error: "Email or Admin ID already registered." }),
        { status: 400 }
      );
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Save to DB
    const newAdmin = await prisma.admin.create({
      data: {
        admin_id,
        first_name,
        last_name,
        email,
        password: hashedPassword,
        avatar,
      },
    });

    return new Response(
      JSON.stringify({ success: true, admin: newAdmin }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin Registration Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500 }
    );
  }
}
