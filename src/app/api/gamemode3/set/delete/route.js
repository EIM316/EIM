import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json({ error: "Missing set ID" }, { status: 400 });
    }

    await prisma.gamemode3Set.delete({ where: { id } });

    return NextResponse.json({ message: "Set deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting set:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
