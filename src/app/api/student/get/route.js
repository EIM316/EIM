import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id_number = searchParams.get("id_number");

    if (!id_number)
      return new Response(
        JSON.stringify({ success: false, error: "Missing student ID number." }),
        { status: 400 }
      );

    const student = await prisma.student.findUnique({
      where: { id_number },
      select: {
        id_number: true,
        first_name: true,
        last_name: true,
        email: true,
        avatar: true,
        created_at: true,
      },
    });

    if (!student)
      return new Response(
        JSON.stringify({ success: false, error: "Student not found." }),
        { status: 404 }
      );

    return new Response(JSON.stringify({ success: true, student }), {
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error fetching student:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
