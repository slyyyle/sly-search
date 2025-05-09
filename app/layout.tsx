import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import type { Metadata } from "next"
import localFont from "next/font/local"
import { SettingsProvider } from "@/lib/use-settings"

const hackFont = localFont({
  src: [
    {
      path: "../public/fonts/hack/Hack-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/hack/Hack-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/hack/Hack-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/hack/Hack-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  display: "swap",
  variable: "--font-hack",
})

export const metadata: Metadata = {
  title: "SlySearch",
  description: "A futuristic search engine",
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={hackFont.variable}>
      <head>
        <link
          rel="search"
          type="application/opensearchdescription+xml"
          title="SlySearch"
          href="/api/opensearch"
        />
      </head>
      <body className={`antialiased bg-black`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
          <SettingsProvider>{children}</SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}