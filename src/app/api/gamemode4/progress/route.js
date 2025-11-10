import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

/**
 * ✅ POST — Save or skip duplicate GameMode4 progress
 */
export async function POST(req) {
  try {
    const body = await req.json();
    let {
      student_id,
      total_questions = 0,
      correct_answers = 0,
      wrong_answers = 0,
      elapsed_time = 0,
    } = body;

    // 🧩 Validation
    if (!student_id) {
      return NextResponse.json(
        { error: "Missing required field: student_id" },
        { status: 400 }
      );
    }

    // ✅ Check for existing record (avoid duplicate progress for same student within same minute)
    const existing = await prisma.gamemode4Progress.findFirst({
      where: {
        student_id,
        created_at: {
          gte: new Date(Date.now() - 60 * 1000), // last 1 minute
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          message: "⚠️ Duplicate detected — recent progress already saved.",
          existing,
        },
        { status: 200 }
      );
    }

    // ✅ Sanitize negative values
    total_questions = Math.max(0, total_questions);
    correct_answers = Math.max(0, correct_answers);
    wrong_answers = Math.max(0, wrong_answers);

    // 🧮 Compute points (floor at 0)
    let points = correct_answers * 10 - wrong_answers * 10;
    if (points < 0) points = 0;

    const accuracy =
      total_questions > 0 ? (correct_answers / total_questions) * 100 : 0;

    // ✅ Save progress
    const progress = await prisma.gamemode4Progress.create({
      data: {
        student_id,
        total_questions,
        correct_answers,
        wrong_answers,
        points,
        accuracy,
        elapsed_time,
      },
    });

    return NextResponse.json(
      {
        message: "✅ GameMode4 progress saved successfully!",
        progress,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ POST /api/gamemode4/progress error:", error);
    return NextResponse.json(
      { error: "Failed to save GameMode4 progress." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * ✅ GET — Retrieve progress history for a student
 */
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

    const progressList = await prisma.gamemode4Progress.findMany({
      where: { student_id },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(progressList);
  } catch (error) {
    console.error("❌ GET /api/gamemode4/progress error:", error);
    return NextResponse.json(
      { error: "Failed to fetch GameMode4 progress." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 🗑️ DELETE — Remove a progress record
 */
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 }
      );
    }

    await prisma.gamemode4Progress.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json(
      { message: "🗑️ Progress record deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ DELETE /api/gamemode4/progress error:", error);
    return NextResponse.json(
      { error: "Failed to delete GameMode4 progress." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
