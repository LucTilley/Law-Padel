import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(request: Request) {
  if (!process.env.FAL_KEY) {
    return NextResponse.json(
      { error: "FAL_KEY environment variable is not set." },
      { status: 500 }
    );
  }

  const { prompt } = await request.json();

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json(
      { error: "Prompt is required and must be a string." },
      { status: 400 }
    );
  }

  try {
    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt: prompt.trim(),
        image_size: "landscape_4_3",
        num_images: 8,
        num_inference_steps: 28,
        guidance_scale: 3.5,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && update.logs) {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    const images = result.data?.images ?? [];
    const urls = images.map((img: { url: string }) => img.url);

    return NextResponse.json({ images: urls }, { status: 200 });
  } catch (error) {
    console.error("Error from FAL API:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
