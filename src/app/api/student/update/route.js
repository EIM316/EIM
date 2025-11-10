import { PrismaClient } from "@/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { id_number, first_name, last_name, email, password, avatar } = body;

    if (!id_number)
      return new Response(
        JSON.stringify({ success: false, error: "Missing student ID." }),
        { status: 400 }
      );

    const student = await prisma.student.findUnique({
      where: { id_number },
    });

    if (!student)
      return new Response(
        JSON.stringify({ success: false, error: "Student not found." }),
        { status: 404 }
      );

    const updatedData = { first_name, last_name, email, avatar };

    // Hash password if provided
    if (password && password.trim() !== "") {
      const hashed = await bcrypt.hash(password, 10);
      updatedData.password = hashed;
    }

    const updatedStudent = await prisma.student.update({
      where: { id_number },
      data: updatedData,
      select: {
        id_number: true,
        first_name: true,
        last_name: true,
        email: true,
        avatar: true,
      },
    });

    return new Response(
      JSON.stringify({ success: true, student: updatedStudent }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error updating student:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
