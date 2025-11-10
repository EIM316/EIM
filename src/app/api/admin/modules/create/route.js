import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, description, created_by } = body;

    // 🧩 Validate required field
    if (!name || name.trim() === "") {
      return new Response(
        JSON.stringify({ success: false, error: "Module name is required." }),
        { status: 400 }
      );
    }

    // ✅ Create new module
    const newModule = await prisma.module.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        created_by: created_by || null,
      },
    });

    return new Response(
      JSON.stringify({ success: true, module: newModule }),
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creating module:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error.",
      }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
