import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function PUT(req) {
  try {
    const { id, option_name, image_url } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing option ID" }, { status: 400 });
    }

    const updated = await prisma.gamemode3OptionBank.update({
      where: { id },
      data: { option_name, image_url },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ Error updating option:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
