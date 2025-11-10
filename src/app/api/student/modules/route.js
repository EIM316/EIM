import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // ✅ Fetch all modules from DB, oldest first (first added = first shown)
    const modules = await prisma.module.findMany({
      orderBy: { created_at: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        created_at: true,
      },
    });

    // ✅ Return simplified version for student display
    return new Response(
      JSON.stringify({
        success: true,
        modules: modules.map((m) => ({
          module_id: m.id,
          name: m.name,
          description: m.description || "No description available.",
          coverImage: "/resources/modes/module.png",
          created_at: m.created_at,
        })),
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error fetching modules:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error while fetching modules.",
      }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
