import { NextResponse } from "next/server";

export async function GET() {
  // Get the base URL from environment or fallback to a default
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  console.log(`[OpenSearch Route] Generating XML with baseUrl: ${baseUrl}`); // Add logging
  
  // Create the OpenSearch XML document - Simplest possible template
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
  <ShortName>Sly Search</ShortName>
  <Description>Search the web with Sly Search</Description>
  <Tags>search engine web</Tags>
  <Contact>admin@example.com</Contact>
  <Url type="text/html" 
       template="${baseUrl}/search?q={searchTerms}"/>
  <Url type="application/opensearchdescription+xml"
       rel="self"
       template="${baseUrl}/api/opensearch"/>
  <Image height="16" width="16" type="image/x-icon">${baseUrl}/favicon.ico</Image>
  <Image height="64" width="64" type="image/png">${baseUrl}/logo.png</Image>
  <Query role="example" searchTerms="search term"/>
  <InputEncoding>UTF-8</InputEncoding>
  <OutputEncoding>UTF-8</OutputEncoding>
  <Language>*</Language>
  <SyndicationRight>open</SyndicationRight>
  <AdultContent>false</AdultContent>
</OpenSearchDescription>`;

  // Return the XML with appropriate content type
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/opensearchdescription+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
} 