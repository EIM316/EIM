import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400 });
    }

    const updated = await prisma.gamemode2.update({
      where: { id },
      data: updateData,
    });

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (error) {
    console.error("PUT /api/gamemode2/update error:", error);
    return new Response(JSON.stringify({ error: "Failed to update" }), { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
