// src/app/api/cloudinary/fetch/route.js
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  try {
    const folder = "EIM/STUDENT"; // your Cloudinary folder

    // Use Cloudinary Search API to list images in a folder
    const result = await cloudinary.search
      .expression(`folder:${folder}`)
      .sort_by("public_id", "asc")
      .max_results(100)
      .execute();

    const images = (result.resources || []).map((r) => ({
      public_id: r.public_id,
      url: r.secure_url,
      width: r.width,
      height: r.height,
      format: r.format,
    }));

    return new Response(JSON.stringify({ images }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",

        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err) {
    console.error("Cloudinary fetch error:", err);
    return new Response(JSON.stringify({ error: "Failed to fetch Cloudinary images" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
