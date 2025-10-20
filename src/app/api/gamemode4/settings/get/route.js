import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const admin_id = searchParams.get("admin_id");

    if (!admin_id) {
      return new Response(
        JSON.stringify({ error: "Missing admin_id" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ Fetch the current settings
    const settings = await prisma.gamemode4Settings.findFirst({
      where: { admin_id },
      orderBy: { id: "desc" }, // latest record
    });

    if (!settings) {
      return new Response(
        JSON.stringify({ message: "No settings found for this admin." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET /api/gamemode4/settings/get error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch GameMode 4 settings." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    await prisma.$disconnect();
  }
}
