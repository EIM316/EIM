import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function GET() {
  try {
    const students = await prisma.student.count();
    const teachers = await prisma.teacher.count();

    return new Response(
      JSON.stringify({
        success: true,
        students,
        teachers,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500 }
    );
  }
}
