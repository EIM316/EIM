import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { level_number, admin_id } = body;

    if (!level_number || !admin_id) {
      return new Response(
        JSON.stringify({ error: "Missing level_number or admin_id" }),
        { status: 400 }
      );
    }

    // Check if level number already exists
    const existing = await prisma.gamemode1Level.findUnique({
      where: { level_number },
    });

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Level number already exists" }),
        { status: 409 }
      );
    }

    // Create the new level
    const newLevel = await prisma.gamemode1Level.create({
      data: {
        level_number: parseInt(level_number),
        admin_id,
      },
      include: {
        admin: {
          select: { admin_id: true, first_name: true, last_name: true },
        },
      },
    });

    return new Response(JSON.stringify(newLevel), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("POST /api/gamemode1/level/add error:", error);
    return new Response(
      JSON.stringify({ error: "Error adding level" }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
