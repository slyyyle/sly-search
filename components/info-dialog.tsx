"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function InfoDialog() {
  const router = useRouter()

  // Make sure we're using the router correctly
  // Update the handleClick function to navigate to the info page
  const handleClick = () => {
    router.push("/info")
  }

  return (
    <Button variant="ghost" size="sm" className="h-8" onClick={handleClick}>
      <AlertTriangle className="h-4 w-4 text-amber-500" />
    </Button>
  )
}
