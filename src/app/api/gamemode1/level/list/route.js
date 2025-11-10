import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const levels = await prisma.gamemode1Level.findMany({
      orderBy: { level_number: "asc" },
      include: {
        admin: {
          select: { admin_id: true, first_name: true, last_name: true },
        },
      },
    });

    return new Response(JSON.stringify(levels), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET /api/gamemode1/level/list error:", error);
    return new Response(
      JSON.stringify({ error: "Error fetching levels" }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
