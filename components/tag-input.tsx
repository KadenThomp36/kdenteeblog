"use client"

import { useState, KeyboardEvent } from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
}

export function TagInput({ tags, onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState("")

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag()
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      removeTag(tags.length - 1)
    }
  }

  const addTag = () => {
    const tag = inputValue.trim().toLowerCase()
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag])
      setInputValue("")
    }
  }

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="tags">Tags</Label>
      <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[42px] focus-within:ring-2 focus-within:ring-ring">
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="gap-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="ml-1 hover:bg-muted rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          id="tags"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? "Add tags (press Enter or comma)" : ""}
          className="border-0 shadow-none focus-visible:ring-0 flex-1 min-w-[120px] p-0 h-6"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Press Enter or comma to add tags. Used for filtering and organizing posts.
      </p>
    </div>
  )
}
