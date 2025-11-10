import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function DELETE(req) {
  try {
    const { class_id } = await req.json();

    if (!class_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing class_id." }),
        { status: 400 }
      );
    }

    // ✅ Check if the class exists
    const existing = await prisma.class.findUnique({
      where: { id: Number(class_id) },
    });

    if (!existing) {
      return new Response(
        JSON.stringify({ success: false, error: "Class not found." }),
        { status: 404 }
      );
    }

    // ✅ Delete class (and optionally cascade related data)
    await prisma.class.delete({
      where: { id: Number(class_id) },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Class "${existing.class_name}" deleted successfully.`,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error deleting class:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error while deleting class.",
      }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
