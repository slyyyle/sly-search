import { NextResponse } from "next/server"

// Simple health check endpoint
export async function GET() {
  try {
    // Check if we can access the backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

    if (!backendUrl) {
      return NextResponse.json({ status: "warning", message: "Backend URL not configured" }, { status: 200 })
    }

    // Try to connect to the backend
    try {
      const response = await fetch(`${backendUrl}/health`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        // Add a short timeout to avoid long waits
        signal: AbortSignal.timeout(2000),
      })

      if (response.ok) {
        return NextResponse.json({ status: "ok", message: "Connected to backend" }, { status: 200 })
      } else {
        return NextResponse.json(
          { status: "error", message: `Backend returned status ${response.status}` },
          { status: 200 },
        )
      }
    } catch (error) {
      console.error("Error connecting to backend:", error)
      return NextResponse.json({ status: "error", message: "Failed to connect to backend" }, { status: 200 })
    }
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json({ status: "error", message: "Health check failed" }, { status: 500 })
  }
}
