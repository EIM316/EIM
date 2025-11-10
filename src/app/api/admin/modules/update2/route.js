import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { id, name, description } = await req.json();

    if (!id || !name) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing module ID or name." }),
        { status: 400 }
      );
    }

    const updated = await prisma.module.update({
      where: { id },
      data: { name, description },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Module updated successfully.",
        module: updated,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error updating module:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error." }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
