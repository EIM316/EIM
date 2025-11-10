import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    const { module_id, admin_id, slides, points, moduleName } = body;

    // 🧩 Validate request
    if (!module_id || !admin_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing module_id or admin_id" }),
        { status: 400 }
      );
    }

    if (!slides || slides.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No slides provided." }),
        { status: 400 }
      );
    }

    // 🧠 Check if existing record for this module_id
    const existing = await prisma.moduleSlides.findFirst({
      where: { module_id: Number(module_id) },
    });

    let saved;

    if (existing) {
      // 🔁 Update existing record
      saved = await prisma.moduleSlides.update({
        where: { id: existing.id },
        data: {
          admin_id,
          slides_data: {
            moduleName,
            slides, // Already Cloudinary URLs
            points,
          },
          created_at: new Date(), // Optional: refresh timestamp
        },
      });
      console.log(`🔁 Updated existing slides for module ${module_id}`);
    } else {
      // 🆕 Create new record
      saved = await prisma.moduleSlides.create({
        data: {
          module_id: Number(module_id),
          admin_id,
          slides_data: {
            moduleName,
            slides,
            points,
          },
        },
      });
      console.log(`✅ Created new slides for module ${module_id}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: existing
          ? "Slides updated successfully!"
          : "Slides saved successfully!",
        saved,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error saving slides:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error.",
        details: error.message,
      }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
