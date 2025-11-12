import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function PUT(req) {
  try {
    const body = await req.json();

    // 🧹 Remove client-only or invalid fields
    const { mode, id, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing question ID" }, { status: 400 });
    }

    const updated = await prisma.gamemode2.update({
      where: { id: Number(id) },
      data: rest, // ✅ only valid fields
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ Error updating GameMode2 question:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
