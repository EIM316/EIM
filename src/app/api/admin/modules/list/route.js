import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const modules = await prisma.module.findMany({
      orderBy: { created_at: "desc" },
    });

    return new Response(
      JSON.stringify({ success: true, modules }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error fetching modules:", error);
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
