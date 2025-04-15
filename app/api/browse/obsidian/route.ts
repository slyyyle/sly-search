import { type NextRequest, NextResponse } from "next/server";
import type { VaultBrowseResponse } from "@/types/obsidian";

// FIXME: Get the actual backend URL dynamically (e.g., from env vars or a settings service)
const BACKEND_BASE_URL = process.env.BACKEND_INSTANCE_URL || "http://localhost:8888";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subpath = searchParams.get("subpath") || "";

  const backendUrl = new URL(`${BACKEND_BASE_URL}/browse/obsidian`);
  backendUrl.searchParams.set("subpath", subpath);

  console.log(`[API Route] Forwarding Obsidian browse request to: ${backendUrl.toString()}`);

  try {
    const response = await fetch(backendUrl.toString(), {
      method: "GET",
      headers: {
        // Forward any necessary headers if needed in the future
      },
      // Consider adding a timeout
      // cache: 'no-store', // Ensure fresh data if necessary
    });

    if (!response.ok) {
      // Attempt to read backend error message if available
      let errorMessage = `Backend request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData && typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        }
      } catch (jsonError) {
        // Ignore if response is not JSON or empty
      }
      console.error(`[API Route] Error fetching from backend: ${errorMessage}`);
      return NextResponse.json({ path: subpath, items: [], error: errorMessage }, { status: response.status });
    }

    const data: VaultBrowseResponse = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("[API Route] Network or other error forwarding request:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error forwarding request.";
    return NextResponse.json({ path: subpath, items: [], error: errorMessage }, { status: 500 });
  }
} 