// src/app/api/settings/route.ts (or similar path)

import { type NextRequest, NextResponse } from "next/server";

// Get the backend URL from environment variables
// Ensure this is set in your .env.local or deployment environment
const BACKEND_URL = process.env.FASTAPI_BACKEND_URL;

// Helper function to handle fetch errors
async function handleFetchError(response: Response, defaultMessage: string) {
  let errorMessage = defaultMessage;
  try {
    const errorBody = await response.json();
    errorMessage = errorBody.detail || errorMessage; // Use FastAPI's detail field if available
  } catch (e) {
    // Ignore if response body is not JSON
  }
  console.error(`Proxy Error (${response.status}): ${errorMessage}`);
  return NextResponse.json({ error: errorMessage }, { status: response.status });
}


// GET endpoint - Proxy to FastAPI GET /settings
export async function GET(request: NextRequest) {
  if (!BACKEND_URL) {
    console.error("FATAL: FASTAPI_BACKEND_URL environment variable not set.");
    return NextResponse.json({ error: "Backend service URL not configured" }, { status: 500 });
  }

  const targetUrl = `${BACKEND_URL}/settings`;
  console.log(`[GET /api/settings] Proxying request to: ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      // Add cache control if needed, e.g., 'no-cache'
      cache: 'no-store',
      signal: AbortSignal.timeout(8000), // 8 second timeout
    });

    if (!response.ok) {
      return await handleFetchError(response, "Failed to fetch settings from backend service");
    }

    const data = await response.json();
    console.log(`[GET /api/settings] Successfully fetched data from backend.`);
    // Forward the successful response from the backend
    return NextResponse.json(data);

  } catch (error: any) {
    console.error(`[GET /api/settings] Error proxying to backend:`, error);
    const errorMessage = error.name === 'TimeoutError' ? "Backend service timed out" : "Failed to connect to backend service";
    return NextResponse.json({ error: errorMessage }, { status: 502 }); // 502 Bad Gateway
  }
}

// POST endpoint - Proxy to FastAPI POST /settings
export async function POST(request: NextRequest) {
  if (!BACKEND_URL) {
    console.error("FATAL: FASTAPI_BACKEND_URL environment variable not set.");
    return NextResponse.json({ error: "Backend service URL not configured" }, { status: 500 });
  }

  const targetUrl = `${BACKEND_URL}/settings`;
  let settingsData;

  try {
    // Get the settings data from the incoming request
    settingsData = await request.json();
  } catch (error) {
    console.error("[POST /api/settings] Invalid JSON received:", error);
    return NextResponse.json({ error: "Invalid JSON data in request body" }, { status: 400 });
  }

  console.log(`[POST /api/settings] Proxying request to: ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(settingsData), // Send the received settings data
      signal: AbortSignal.timeout(8000), // 8 second timeout
    });

    if (!response.ok) {
       return await handleFetchError(response, "Failed to save settings via backend service");
    }

    const data = await response.json();
    console.log(`[POST /api/settings] Successfully saved data via backend.`);
    // Forward the successful response from the backend
    return NextResponse.json(data);

  } catch (error: any) {
     console.error(`[POST /api/settings] Error proxying to backend:`, error);
     const errorMessage = error.name === 'TimeoutError' ? "Backend service timed out" : "Failed to connect to backend service";
     return NextResponse.json({ error: errorMessage }, { status: 502 }); // 502 Bad Gateway
  }
}

// Note: The 'resetSettings' function in useSettings called DELETE /api/settings.
// This proxy doesn't implement DELETE. To reset, the frontend could:
// 1. Fetch defaults using GET /api/settings (which proxies to GET python/settings, which returns defaults if file absent)
// 2. Then POST those defaults back using POST /api/settings (which proxies to POST python/settings)
// Or, you could implement a specific DELETE or reset endpoint on the Python backend and proxy that too.
