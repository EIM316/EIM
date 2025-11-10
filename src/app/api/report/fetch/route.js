import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { created_at: "desc" },
    });

    // ✅ Format each report to include a "thread" array for frontend
    const formattedReports = reports.map((r) => ({
      ...r,
      thread: [
        {
          message: r.message || "",
          date: r.created_at.toISOString(),
          fromAdmin: false,
        },
      ],
      isRead: r.is_read ?? false, // map DB boolean
    }));

    return NextResponse.json({
      success: true,
      reports: formattedReports,
    });
  } catch (err) {
    console.error("❌ Fetch error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reports." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
