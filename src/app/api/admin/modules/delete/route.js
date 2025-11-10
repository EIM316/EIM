import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { id } = await req.json();

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing module ID." }),
        { status: 400 }
      );
    }

    await prisma.module.delete({ where: { id } });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Module deleted successfully.",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error deleting module:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error." }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
