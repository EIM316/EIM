import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const records = await prisma.allowedEmail.findMany({
      orderBy: { created_at: "desc" },
    });

    return new Response(
      JSON.stringify({ success: true, records }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ GET /admin/emails error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500 }
    );
  }
}
