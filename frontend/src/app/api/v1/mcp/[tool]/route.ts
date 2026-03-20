import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL || "http://localhost:8001";

const VALID_TOOLS = [
  "generate_melody",
  "generate_rhythm",
  "generate_composition",
] as const;

type ValidTool = (typeof VALID_TOOLS)[number];

function isValidTool(tool: string): tool is ValidTool {
  return VALID_TOOLS.includes(tool as ValidTool);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tool: string } }
) {
  const { tool } = params;

  if (!isValidTool(tool)) {
    return NextResponse.json(
      {
        error: `Invalid tool: ${tool}. Valid: ${VALID_TOOLS.join(", ")}`,
      },
      { status: 400 }
    );
  }

  let body: {
    prompt?: string;
    model?: string;
    duration_seconds?: number;
    bpm?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { prompt, model, duration_seconds, bpm } = body;

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'prompt' field" },
      { status: 400 }
    );
  }

  try {
    const backendResponse = await fetch(
      `${BACKEND_URL}/v1/${tool}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model,
          duration_seconds,
          bpm,
        }),
      }
    );

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (fetchError) {
    const message =
      fetchError instanceof Error
        ? fetchError.message
        : "Unknown error";
    return NextResponse.json(
      { error: `Backend connection failed: ${message}` },
      { status: 502 }
    );
  }
}
