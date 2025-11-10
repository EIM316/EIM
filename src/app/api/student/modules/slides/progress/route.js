import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

// 🔍 Get specific student progress for a module
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const student_id = searchParams.get("student_id");
    const module_id = searchParams.get("module_id");

    if (!student_id || !module_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing student_id or module_id parameter.",
        }),
        { status: 400 }
      );
    }

    const progress = await prisma.studentModuleProgress.findUnique({
      where: {
        student_id_module_id: {
          student_id,
          module_id: Number(module_id),
        },
      },
    });

    if (!progress) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No progress found for this student and module.",
        }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify({ success: true, progress }), {
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error fetching progress:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error." }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// 🧠 Create or update student progress (auto-apply max points)
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      student_id,
      module_id,
      current_slide,
      points_earned,
      completed,
      badge_earned,
    } = body;

    if (!student_id || !module_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing student_id or module_id in body.",
        }),
        { status: 400 }
      );
    }

    // 🧩 Fetch the latest moduleSlides entry
    const moduleSlide = await prisma.moduleSlides.findFirst({
      where: { module_id: Number(module_id) },
      orderBy: { created_at: "desc" },
    });

    let maxPoints = 0;

    if (moduleSlide && moduleSlide.slides_data) {
      const parsed =
        typeof moduleSlide.slides_data === "string"
          ? JSON.parse(moduleSlide.slides_data)
          : moduleSlide.slides_data;

      // ✅ Check if a max_points field exists
      if (parsed.max_points) {
        maxPoints = parsed.max_points;
      } else if (parsed.slides && Array.isArray(parsed.slides)) {
        // ✅ Sum up all slide points if not defined
        maxPoints = parsed.slides.reduce(
          (sum, slide) => sum + (slide.points || 0),
          0
        );
      }
    }

    // 🧮 Compute final points
    const computedPoints =
      completed && (!points_earned || points_earned === 0)
        ? maxPoints
        : points_earned ?? 0;

    // 🔍 Check existing progress record
    const existing = await prisma.studentModuleProgress.findUnique({
      where: {
        student_id_module_id: {
          student_id,
          module_id: Number(module_id),
        },
      },
    });

    if (existing) {
      const updateData = {};
      if (current_slide !== undefined) updateData.current_slide = current_slide;

      // 🧠 Update only if not finalized
      if (!existing.completed) {
        updateData.points_earned = computedPoints;
        if (completed !== undefined) updateData.completed = completed;
        updateData.badge_earned = badge_earned ?? computedPoints > 0;
        if (completed === true) updateData.completed_at = new Date();
      }

      const progress = await prisma.studentModuleProgress.update({
        where: {
          student_id_module_id: {
            student_id,
            module_id: Number(module_id),
          },
        },
        data: updateData,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Progress updated successfully.",
          progress,
        }),
        { status: 200 }
      );
    } else {
      // 🆕 Create new progress record
      const progress = await prisma.studentModuleProgress.create({
        data: {
          student_id,
          module_id: Number(module_id),
          current_slide: current_slide ?? 0,
          points_earned: computedPoints,
          completed: completed ?? false,
          badge_earned: badge_earned ?? computedPoints > 0,
          completed_at: completed ? new Date() : null,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Progress created successfully.",
          progress,
        }),
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("❌ Error saving progress:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error." }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
