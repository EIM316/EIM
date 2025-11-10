import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const classModes = await prisma.classModeGame.findMany({
      where: {
        OR: [
          {
            game_code: { contains: search, mode: "insensitive" },
          },
          {
            game_type: { contains: search, mode: "insensitive" },
          },
          {
            class: {
              class_name: { contains: search, mode: "insensitive" },
            },
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
        class: {
          select: { class_name: true, class_code: true },
        },
        teacher: {
          select: { first_name: true, last_name: true, id_number: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // ✅ Flatten the data for easier frontend mapping
    const formatted = classModes.map((c) => ({
      id: c.id,
      game_code: c.game_code,
      game_type: c.game_type,
      status: c.status,
      created_at: c.created_at,
      class_name: c.class?.class_name || "Unnamed Class",
      class_code: c.class?.class_code || "—",
      teacher_name: c.teacher
        ? `${c.teacher.first_name} ${c.teacher.last_name}`
        : "Unknown Teacher",
    }));

    return new Response(JSON.stringify({ success: true, classModes: formatted }), {
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error fetching class modes:", error);
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
