import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const moduleId = searchParams.get("module_id");

    if (!moduleId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing module_id" }),
        { status: 400 }
      );
    }

    // 🧠 Fetch module details
    const moduleInfo = await prisma.module.findUnique({
      where: { id: Number(moduleId) },
      select: {
        id: true,
        name: true,
        description: true,
        created_by: true,
        created_at: true,
      },
    });

    if (!moduleInfo) {
      return new Response(
        JSON.stringify({ success: false, error: "Module not found" }),
        { status: 404 }
      );
    }

    // 🧩 Fetch latest slides for this module
    const slidesRecord = await prisma.moduleSlides.findFirst({
      where: { module_id: Number(moduleId) },
      orderBy: { created_at: "desc" },
    });

    return new Response(
      JSON.stringify({
        success: true,
        module: moduleInfo,
        slides: slidesRecord || null,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error fetching module data:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error." }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
