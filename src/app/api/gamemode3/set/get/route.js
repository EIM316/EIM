import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id"), 10);

    if (!id) {
      return NextResponse.json({ error: "Missing set id" }, { status: 400 });
    }

    const set = await prisma.gamemode3Set.findUnique({
      where: { id },
    });

    if (!set) {
      return NextResponse.json({ error: "Set not found" }, { status: 404 });
    }

    return NextResponse.json(set);
  } catch (error) {
    console.error("❌ Error fetching set:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
