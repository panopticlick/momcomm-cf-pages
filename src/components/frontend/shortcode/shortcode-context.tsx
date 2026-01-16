'use client'

import React, { createContext, useContext } from 'react'
import type { ShortcodeDataItem } from '@/services/shortcode/process'

interface ShortcodeContextType {
  getData: (id: string) => ShortcodeDataItem | undefined
}

const ShortcodeContext = createContext<ShortcodeContextType | null>(null)

export function useShortcodeData() {
  return useContext(ShortcodeContext)
}

interface ShortcodeProviderProps {
  children: React.ReactNode
  data: Record<string, ShortcodeDataItem>
}

export function ShortcodeProvider({ children, data }: ShortcodeProviderProps) {
  const getData = (id: string) => {
    return data[id]
  }

  return <ShortcodeContext.Provider value={{ getData }}>{children}</ShortcodeContext.Provider>
}
