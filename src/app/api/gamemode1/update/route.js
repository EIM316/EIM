import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    const updated = await prisma.gamemode1.update({
      where: { id },
      data: updateData,
    });

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Failed to update" }), {
      status: 500,
    });
  }
}
