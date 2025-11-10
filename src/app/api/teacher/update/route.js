import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { id_number, first_name, last_name, email, password, avatar } = body;

    if (!id_number) {
      return NextResponse.json({ success: false, error: "Missing teacher ID" }, { status: 400 });
    }

    // find existing teacher
    const existing = await prisma.teacher.findUnique({ where: { id_number } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Teacher not found" }, { status: 404 });
    }

    const updateData = {
      first_name: first_name?.trim() || existing.first_name,
      last_name: last_name?.trim() || existing.last_name,
      email: email?.trim() || existing.email,
      avatar: avatar || existing.avatar,
    };

    if (password && password.trim().length > 0) {
      const hashed = await bcrypt.hash(password, 10);
      updateData.password = hashed;
    }

    const updated = await prisma.teacher.update({
      where: { id_number },
      data: updateData,
    });

    // hide password before returning
    const { password: _, ...safeTeacher } = updated;

    return NextResponse.json({ success: true, teacher: safeTeacher });
  } catch (err) {
    console.error("❌ POST /api/teacher/update error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
