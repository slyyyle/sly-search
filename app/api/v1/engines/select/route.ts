import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // Read JSON payload from client
  const payload = await request.json()
  // Build backend URL
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL!

  // Forward the request to the real backend, including client headers
  const upstream = await fetch(`${backendUrl}/api/v1/engines/select`, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(payload)
  })

  // Clone and override response headers for SSE
  const responseHeaders = new Headers(upstream.headers)
  responseHeaders.set('Content-Type', 'text/event-stream')
  responseHeaders.set('Cache-Control', 'no-cache')
  responseHeaders.set('Connection', 'keep-alive')
  responseHeaders.set('X-Accel-Buffering', 'no')

  // Stream the backend response directly to the client
  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders
  })
} 