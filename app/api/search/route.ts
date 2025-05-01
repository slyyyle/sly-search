import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")
  const source = searchParams.get("source") || "web"
  const ragMode = searchParams.get("rag") || "normal"
  const page = Number.parseInt(searchParams.get("pageno") || "1", 10)
  const resultsPerPage = Number.parseInt(searchParams.get("results") || "10", 10)

  // Get additional settings from the request
  const safeSearch = searchParams.get("safesearch") || "0"
  const language = searchParams.get("language") || "all"
  const timeRange = searchParams.get("time_range") || "all"
  const category = searchParams.get("category") || "general"
  const engines = searchParams.get("engines") || ""

  // These parameters are supported by our backend but might need formatting
  const resultsOnNewTab = searchParams.get("results_on_new_tab")
  const imageProxy = searchParams.get("image_proxy")

  // These parameters are not currently used by our backend
  // const format = searchParams.get("format") || "json"
  // const theme = searchParams.get("theme") || "auto"
  // const autocomplete = searchParams.get("autocomplete") === "true"
  // const urlFormat = searchParams.get("url_format") || "pretty"

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 })
  }

  try {
    // Get the backend URL from environment variable
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

    if (!backendUrl) {
      console.error("NEXT_PUBLIC_BACKEND_URL environment variable is not set")
      // Return mock data instead of failing
      return NextResponse.json(getMockSearchResults(query, ragMode, page, resultsPerPage))
    }

    // Build the search URL with parameters
    const searchUrl = new URL(`${backendUrl}/search`)
    searchUrl.searchParams.append("q", query)
    searchUrl.searchParams.append("source", source)

    // Add pagination parameters
    searchUrl.searchParams.append("pageno", page.toString())
    searchUrl.searchParams.append("results", resultsPerPage.toString())

    // Add all other supported parameters
    searchUrl.searchParams.append("safesearch", safeSearch)
    if (language && language !== "auto") {
      searchUrl.searchParams.append("language", language)
    }
    if (timeRange && timeRange !== "all") {
      searchUrl.searchParams.append("time_range", timeRange)
    }
    if (category && category !== "all") {
      searchUrl.searchParams.append("categories", category)
    }

    // Only add engines if specified and not empty
    if (engines && engines.trim() !== "") {
      searchUrl.searchParams.append("engines", engines)

      // Also pass engine weights if provided
      const engineWeights = searchParams.get("engine_weights")
      if (engineWeights) {
        try {
          // Validate that it's proper JSON before passing it
          JSON.parse(engineWeights)
          searchUrl.searchParams.append("engine_weights", engineWeights)
        } catch (e) {
          console.error("Invalid engine_weights parameter:", engineWeights)
        }
      }

      // Log for debugging
      console.log(`Searching with engines: ${engines}`)
      if (engineWeights) console.log(`Using engine weights: ${engineWeights}`)
    }

    // Add optional parameters if they're provided
    if (resultsOnNewTab) {
      // Convert boolean-like values to 0/1 for SearXNG
      const newTabValue = resultsOnNewTab === "true" ? "1" : "0"
      searchUrl.searchParams.append("results_on_new_tab", newTabValue)
    }

    if (imageProxy) {
      // Convert boolean-like values to lowercase string for SearXNG
      const proxyValue = imageProxy === "true" ? "true" : "false"
      searchUrl.searchParams.append("image_proxy", proxyValue)
    }

    // Add a safeguard for handling many engines
    // If we have too many engines, SearXNG might reject the request due to URL length limits
    // Most servers limit URLs to 2000-8000 characters
    if (searchUrl.toString().length > 6000) {
      console.warn("Search URL is very long, may exceed server limits:", searchUrl.toString().length)
      // Consider limiting the number of engines or using POST instead
    }

    console.log(`Fetching search results from: ${searchUrl.toString()}`)

    try {
      // Call the FastAPI backend with a timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(searchUrl.toString(), {
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Backend returned status ${response.status}`)
      }

      const data = await response.json()

      // Add the RAG mode to the response for frontend use
      data.ragMode = ragMode

      // Add pagination info to the response
      data.pagination = {
        currentPage: page,
        resultsPerPage: resultsPerPage,
        totalResults: data.totalResults || data.results?.length || 0,
        hasMore: data.hasMore !== undefined ? data.hasMore : true,
      }

      return NextResponse.json(data)
    } catch (fetchError: unknown) {
      console.error("Fetch error:", fetchError)

      // Check if it's a timeout error using instanceof Error
      let isTimeout = false;
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.log("Request timed out, returning mock data");
        isTimeout = true;
      }

      if (!isTimeout) {
        console.log("Fetch failed, returning mock data");
      }

      // Return mock data as fallback
      return NextResponse.json(getMockSearchResults(query, ragMode, page, resultsPerPage))
    }
  } catch (error: unknown) {
    console.error("Search API error:", error)
    // Return mock data as fallback
    return NextResponse.json(getMockSearchResults(query, ragMode, page, resultsPerPage))
  }
}

// Function to generate mock search results when the backend is unavailable
function getMockSearchResults(query: string, ragMode: string, page: number, resultsPerPage: number) {
  const startIndex = (page - 1) * resultsPerPage

  // Generate mock results based on the query
  const mockResults = Array.from({ length: resultsPerPage }, (_, i) => {
    const resultIndex = startIndex + i + 1
    return {
      title: `Result ${resultIndex} for "${query}"`,
      link: `https://example.com/result-${resultIndex}`,
      snippet: `This is a mock search result ${resultIndex} for the query "${query}". The backend connection is currently unavailable.`,
      source: "Mock Data",
      position: resultIndex,
      category: "general",
      pretty_url: `example.com/result-${resultIndex}`,
      content_type: "text/html",
      score: 1.0 - i * 0.05,
      engines: ["mock"],
      parsed_url: ["https", "example.com", "/result-" + resultIndex, "", ""],
    }
  })

  return {
    query: query,
    number_of_results: resultsPerPage * 3, // Simulate more pages
    results: mockResults,
    answers: [],
    corrections: [],
    infoboxes: [],
    suggestions: [],
    unresponsive_engines: [],
    ragMode: ragMode,
    pagination: {
      currentPage: page,
      resultsPerPage: resultsPerPage,
      totalResults: resultsPerPage * 3,
      hasMore: page < 3, // Simulate 3 pages of results
    },
    _mock: true, // Flag to indicate these are mock results
  }
}
