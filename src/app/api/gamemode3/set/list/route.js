import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const admin_id = searchParams.get("admin_id");

    if (!admin_id)
      return NextResponse.json({ error: "Missing admin_id" }, { status: 400 });

    const sets = await prisma.gamemode3Set.findMany({
      where: { admin_id },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(sets);
  } catch (error) {
    console.error("❌ Error fetching sets:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
