
"use client"

import * as React from "react"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: string
  storageKey?: string
  attribute?: string
  enableSystem?: boolean
  themes?: string[]
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  attribute = "data-theme",
  enableSystem = true,
  themes = ["light", "dark", "system"]
}: ThemeProviderProps) {
  return (
    <div className={defaultTheme}>
      {children}
    </div>
  )
}
