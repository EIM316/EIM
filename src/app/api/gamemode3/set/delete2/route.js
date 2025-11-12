import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id"));

    if (!id) {
      return NextResponse.json({ error: "Missing or invalid set ID" }, { status: 400 });
    }



    // ✅ Delete the set itself
    await prisma.gamemode3Set.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Set and related data deleted successfully.",
    });
  } catch (error) {
    console.error("❌ DELETE /api/gamemode3/set/delete error:", error);
    return NextResponse.json({ error: "Failed to delete set" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
