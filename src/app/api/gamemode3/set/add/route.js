import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { admin_id, set_name, image_url, rect_data, correct_answers } = await req.json();

    if (!admin_id || !set_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newSet = await prisma.gamemode3Set.create({
      data: {
        admin_id,
        set_name,
        image_url: image_url || null,
        rect_data: rect_data || {},
        correct_answers: correct_answers || {},
      },
    });

    return NextResponse.json(newSet);
  } catch (error) {
    console.error("❌ Error creating set:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
