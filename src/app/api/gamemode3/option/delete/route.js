import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id"));

    if (!id || isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const existing = await prisma.gamemode3OptionBank.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Option not found" }, { status: 404 });
    }

    await prisma.gamemode3OptionBank.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Option deleted successfully" });
  } catch (error) {
    console.error("❌ DELETE /api/gamemode3/option/delete error:", error);
    return NextResponse.json({ error: "Failed to delete option" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
