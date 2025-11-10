import { PrismaClient } from "@/generated/prisma";
import { v2 as cloudinary } from "cloudinary";

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function PUT(req) {
  try {
    const body = await req.json();
    const { module_id, slides, points, moduleName } = body;

    if (!module_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing module_id" }),
        { status: 400 }
      );
    }

    const record = await prisma.moduleSlides.findFirst({
      where: { module_id: Number(module_id) },
      orderBy: { created_at: "desc" },
    });

    if (!record) {
      return new Response(
        JSON.stringify({ success: false, error: "No record found to update" }),
        { status: 404 }
      );
    }

    // Reupload new images if any are blob URLs
    const uploadedSlides = [];
    for (const slide of slides) {
      if (slide.background.startsWith("blob:") || slide.background.startsWith("data:")) {
        const uploaded = await cloudinary.uploader.upload(slide.background, {
          folder: `EIM/ADMIN/MODULES/${moduleName}`,
          resource_type: "image",
        });
        uploadedSlides.push({
          id: slide.id,
          url: uploaded.secure_url,
          timer: slide.timer,
        });
      } else {
        uploadedSlides.push(slide);
      }
    }

    const updated = await prisma.moduleSlides.update({
      where: { id: record.id },
      data: {
        slides_data: {
          moduleName,
          slides: uploadedSlides,
          points,
        },
      },
    });

    return new Response(
      JSON.stringify({ success: true, message: "Slides updated successfully!", updated }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error updating slides:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error." }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
