import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { admin_id, option_name, image_url } = await req.json();

    if (!admin_id || !option_name || !image_url) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newOption = await prisma.gamemode3OptionBank.create({
      data: { admin_id, option_name, image_url },
    });

    return NextResponse.json(newOption);
  } catch (error) {
    console.error("❌ Error adding option:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
