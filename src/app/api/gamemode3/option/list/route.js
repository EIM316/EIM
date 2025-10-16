import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const admin_id = searchParams.get("admin_id");

    if (!admin_id)
      return NextResponse.json({ error: "Missing admin_id" }, { status: 400 });

    const options = await prisma.gamemode3OptionBank.findMany({
      where: { admin_id },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(options);
  } catch (error) {
    console.error("❌ Error fetching options:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
