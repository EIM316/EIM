import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();

const ALLOWED_UPDATE_FIELDS = new Set([
  // DB columns for gamemode4 that may be updated
  "base_question_id",
  "question",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "answer",
  "question_image",
  "option_a_image",
  "option_b_image",
  "option_c_image",
  "option_d_image",
  // Do NOT include created_at (shouldn't be changed) or any virtual/client-only fields like "mode"
]);

export async function PUT(req) {
  try {
    const body = await req.json();
    const id = Number(body?.id || body?.Id || body?.question?.id);

    if (!id || Number.isNaN(id)) {
      return new Response(JSON.stringify({ error: "Missing or invalid 'id'." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build data object containing only allowed fields
    const data = {};
    for (const [key, val] of Object.entries(body)) {
      if (key === "id") continue;
      if (ALLOWED_UPDATE_FIELDS.has(key)) {
        // Only copy allowed keys; convert empty strings to null for images optionally
        data[key] = val === "" ? null : val;
      }
    }

    if (Object.keys(data).length === 0) {
      return new Response(JSON.stringify({ error: "No valid fields to update." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Optional: validate 'answer' value if present
    if (data.answer && !/^[A-D]$/.test(String(data.answer))) {
      return new Response(JSON.stringify({ error: "Invalid answer. Must be 'A','B','C' or 'D'." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updated = await prisma.gamemode4.update({
      where: { id },
      data,
    });

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("PUT /api/gamemode4/update error:", error);
    return new Response(JSON.stringify({ error: "Failed to update" }), { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
