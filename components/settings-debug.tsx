"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useSettings } from "@/lib/use-settings"
import { Code } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function SettingsDebug() {
  const { settings } = useSettings()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Code className="h-4 w-4 mr-2" />
          Debug
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Settings Debug View</DialogTitle>
          <DialogDescription>Current settings stored in localStorage</DialogDescription>
        </DialogHeader>
        <div className="bg-gray-900 p-4 rounded-md overflow-auto">
          <pre className="text-xs text-gray-300 whitespace-pre-wrap">{JSON.stringify(settings, null, 2)}</pre>
        </div>
      </DialogContent>
    </Dialog>
  )
}
