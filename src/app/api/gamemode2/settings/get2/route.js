import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function GET() {
  try {
    // ✅ Fetch latest GameMode2 settings (most recent one)
    const latestSettings = await prisma.gamemode2Settings.findFirst({
      orderBy: { updated_at: "desc" },
    });

    if (!latestSettings) {
      return new Response(
        JSON.stringify({ message: "No Game Mode 2 settings found." }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(latestSettings), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET /api/gamemode2/settings/get error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch Game Mode 2 settings" }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
