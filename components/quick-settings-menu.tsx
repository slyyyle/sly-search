"use client"

import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface SettingsButtonProps {
  compact?: boolean
}

export function QuickSettingsMenu({ compact = false }: SettingsButtonProps) {
  return (
    <Link href="/settings" passHref>
      <Button variant="ghost" size={compact ? "sm" : "icon"} className={compact ? "" : "rounded-full"}>
        <Settings className={compact ? "h-4 w-4" : "h-5 w-5"} />
      </Button>
    </Link>
  )
}
