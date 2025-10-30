import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing question ID" }),
        { status: 400 }
      );
    }

    await prisma.ClassQuestion.delete({
      where: { id: Number(id) },
    });

    return new Response(
      JSON.stringify({ success: true, message: "Question deleted" }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error deleting question:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      { status: 500 }
    );
  }
}
