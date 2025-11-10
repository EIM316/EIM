import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const field = searchParams.get("field"); // e.g., "question_image", "option_a_image"

  if (!id || !field) {
    return new Response("Missing id or field", { status: 400 });
  }

  try {
    const question = await prisma.gamemode1.findUnique({
      where: { id: Number(id) },
    });

    if (!question || !question[field]) {
      return new Response("Image not found", { status: 404 });
    }

    return new Response(question[field], {
      status: 200,
      headers: {
        "Content-Type": "image/png",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response("Error fetching image", { status: 500 });
  }
}
