import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma"; // ✅ correct for your custom output path
const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { student_id, set_id, admin_id } = await req.json();

    // Basic validation
    if (!student_id || !set_id) {
      return NextResponse.json(
        { error: "Missing required fields: student_id and set_id are required." },
        { status: 400 }
      );
    }

    // ✅ Correct model name (camelCase from your schema)
    const existing = await prisma.gamemode3Progress.findFirst({
      where: { student_id, set_id },
    });

    if (existing) {
      return NextResponse.json(
        {
          message: "Set already completed — no new points awarded.",
          points_awarded: 0,
          existing,
        },
        { status: 200 }
      );
    }

    // Create new progress entry (+300 points)
    const progress = await prisma.gamemode3Progress.create({
      data: {
        student_id,
        set_id,
        admin_id: admin_id || null,
        points_awarded: 300,
      },
    });

    return NextResponse.json(
      {
        message: "Set completed successfully! +300 points awarded.",
        progress,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ POST /api/gamemode3/progress error:", error);
    return NextResponse.json(
      { error: "Failed to save schematic progress" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const student_id = searchParams.get("student_id");

    if (!student_id) {
      return NextResponse.json(
        { error: "Missing required parameter: student_id" },
        { status: 400 }
      );
    }

    const progress = await prisma.gamemode3Progress.findMany({
      where: { student_id },
      include: {
        set: {
          select: { id: true, set_name: true, image_url: true },
        },
      },
      orderBy: { completed_at: "desc" },
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error("❌ GET /api/gamemode3/progress error:", error);
    return NextResponse.json(
      { error: "Failed to fetch schematic progress" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
