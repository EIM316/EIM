import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id_number = searchParams.get("id_number");

    if (!id_number) {
      return NextResponse.json({ success: false, error: "Missing id_number" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id_number },
      select: {
        id_number: true,
        first_name: true,
        last_name: true,
        email: true,
        avatar: true,
      },
    });

    if (!teacher) {
      return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, teacher });
  } catch (err) {
    console.error("❌ GET /api/teacher/get error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
