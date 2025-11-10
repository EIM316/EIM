import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        id_number: true,
        first_name: true,
        last_name: true,
        email: true,
        password: true,
        avatar: true,
        created_at: true,
      },
    });

    return new Response(
      JSON.stringify({ success: true, students }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error fetching students:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error.",
      }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
