import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL; // Use the standardized URL

export async function GET(request: NextRequest) {
  if (!BACKEND_URL) {
    console.error("FATAL: NEXT_PUBLIC_BACKEND_URL environment variable not set.");
    return NextResponse.json({ error: "Backend service URL not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const pathToCheck = searchParams.get("path"); // Get the path from frontend request

  if (!pathToCheck) {
    return NextResponse.json({ error: "Missing 'path' query parameter" }, { status: 400 });
  }

  // Construct the URL for the Python backend endpoint, ensuring the path is URL-encoded
  // The path should already be suitable for a URL query param, FastAPI handles decoding
  const targetUrl = new URL(`${BACKEND_URL}/check/obsidian`);
  targetUrl.searchParams.set("path", pathToCheck);

  console.log(`[API /api/check/obsidian] Proxying request to: ${targetUrl.toString()}`);

  try {
    const response = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000), // 8 second timeout
    });

    // Forward the response status and body directly from the backend
    const data = await response.json();
    // Ensure we return the correct status code received from the backend
    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    console.error(`[API /api/check/obsidian] Error proxying to backend:`, error);
    const errorMessage = error.name === 'TimeoutError' ? "Backend service timed out" : "Failed to connect to backend service";
    // Return 502 for upstream errors
    return NextResponse.json({ error: errorMessage }, { status: 502 });
  }
} 