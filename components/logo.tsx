"use client"

import type React from "react"
import { useEffect, useState } from "react"

interface LogoProps {
  size?: "small" | "medium" | "large"
  text?: string
}

const Logo: React.FC<LogoProps> = ({ size = "medium", text }) => {
  const sizeClasses = {
    small: "text-xl md:text-2xl",
    medium: "text-2xl md:text-3xl",
    large: "text-4xl md:text-5xl",
  }

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Add a timeout to delay the animation start
    const timer = setTimeout(() => {
      setMounted(true)
    }, 1000) // 1 second delay before starting animation

    return () => clearTimeout(timer)
  }, [])

  // Use provided text. Defaulting happens in parent now.
  const displayText = text;
  const letters = displayText ? displayText.split("") : []; // Split only if text exists

  return (
    <div className="flex flex-col items-center">
      <h1 className={`font-bold ${sizeClasses[size]} logo-text flex`}>
        {/* Only render letters if text is available */}
        {letters.length > 0 ? (
          letters.map((letter, index) => (
            <span
              key={index}
              className={mounted ? "animate-letter-hop" : ""}
              style={{
                animationDelay: `${1000 + index * 150}ms`,
                display: "inline-block",
              }}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </span>
          ))
        ) : (
          // Render a non-breaking space as placeholder to maintain height if text is not yet available
          <span>&nbsp;</span>
        )}
      </h1>
      {size === "large" && (
        <p className="text-base text-muted-foreground mt-2">🌴 No sponsors 🏖️ No ads 🍹 Your internet 🌊</p>
      )}
    </div>
  )
}

export default Logo
