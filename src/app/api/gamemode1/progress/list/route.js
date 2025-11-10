import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const student_id = req.headers.get("x-student-id"); // send student ID from frontend
    const progress = await prisma.refresherProgress.findMany({
      where: { student_id },
      select: { level_id: true, stars: true },
    });
    return new Response(JSON.stringify(progress), { status: 200 });
  } catch (err) {
    console.error("Progress list error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to fetch progress" }),
      { status: 500 }
    );
  }
}
