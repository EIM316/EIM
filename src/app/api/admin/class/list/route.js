import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    // ✅ Fetch all classes with their teacher info
    const classes = await prisma.class.findMany({
      where: {
        OR: [
          {
            class_name: { contains: search, mode: "insensitive" },
          },
          {
            class_code: { contains: search, mode: "insensitive" },
          },
          {
            teacher: {
              first_name: { contains: search, mode: "insensitive" },
            },
          },
          {
            teacher: {
              last_name: { contains: search, mode: "insensitive" },
            },
          },
        ],
      },
      include: {
        teacher: {
          select: {
            id_number: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // ✅ Flatten for frontend
    const formatted = classes.map((c) => ({
      id: c.id,
      class_name: c.class_name,
      class_code: c.class_code,
      student_count: c.student_count || 0,
      created_at: c.created_at,
      teacher_name: c.teacher
        ? `${c.teacher.first_name} ${c.teacher.last_name}`
        : "Unknown Teacher",
    }));

    return new Response(
      JSON.stringify({ success: true, classes: formatted }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error fetching classes:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error." }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
