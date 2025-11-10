import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json({ error: "Missing option ID" }, { status: 400 });
    }

    await prisma.gamemode3OptionBank.delete({ where: { id } });

    return NextResponse.json({ message: "Option deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting option:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
