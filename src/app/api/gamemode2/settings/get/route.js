import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const admin_id = searchParams.get("admin_id");

    if (!admin_id) {
      return new Response(JSON.stringify({ error: "Missing admin_id" }), {
        status: 400,
      });
    }

    const settings = await prisma.gamemode2Settings.findFirst({
      where: { admin_id },
      orderBy: { updated_at: "desc" },
    });

    if (!settings) {
      return new Response(
        JSON.stringify({ message: "No settings found for this admin." }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET /api/gamemode2/settings/get error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch game settings" }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
