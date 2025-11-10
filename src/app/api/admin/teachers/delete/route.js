import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { id } = await req.json();

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing teacher ID." }),
        { status: 400 }
      );
    }

    await prisma.teacher.delete({ where: { id } });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Teacher deleted successfully.",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error deleting teacher:", error);
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
