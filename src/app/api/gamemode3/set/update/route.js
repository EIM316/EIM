import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function PUT(req) {
  try {
    const { id, set_name, image_url, rect_data, correct_answers } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing set ID" }, { status: 400 });
    }

    const updatedSet = await prisma.gamemode3Set.update({
      where: { id },
      data: {
        set_name,
        image_url,
        rect_data,
        correct_answers,
      },
    });

    return NextResponse.json(updatedSet);
  } catch (error) {
    console.error("❌ Error updating set:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
