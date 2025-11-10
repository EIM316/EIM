import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400 });
    }

    await prisma.gamemode4.delete({ where: { id } });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("DELETE /api/gamemode4/delete error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete" }), { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
