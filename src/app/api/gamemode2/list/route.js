import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const level_id = Number(searchParams.get("level_id"));

    const where = level_id ? { level_id } : {};

    const questions = await prisma.gamemode2.findMany({
      where,
      orderBy: { id: "asc" },
    });

    return new Response(JSON.stringify(questions), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET /api/gamemode2/list error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch questions" }), { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
