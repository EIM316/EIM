import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function PUT(req) {
  try {
    const { class_id, new_name } = await req.json();

    if (!class_id || !new_name) {
      return new Response(JSON.stringify({ success: false, error: "Missing parameters." }), {
        status: 400,
      });
    }

    const updated = await prisma.class.update({
      where: { id: Number(class_id) },
      data: { class_name: new_name },
    });

    return new Response(JSON.stringify({ success: true, class: updated }), { status: 200 });
  } catch (error) {
    console.error("❌ Error updating class name:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error." }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
