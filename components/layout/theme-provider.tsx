'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Initialize theme from localStorage or default to 'dark'
    const [theme, setTheme] = useState<Theme>(() => {
        // Only access localStorage on client-side
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme') as Theme | null
            return savedTheme || 'dark'
        }
        return 'dark'
    })
    const [mounted, setMounted] = useState(false)

    // Set mounted flag on client-side
    useEffect(() => {
        setMounted(true)
    }, [])

    // Update document class and localStorage when theme changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Save to localStorage
            localStorage.setItem('theme', theme)
            // Update document class
            document.documentElement.classList.remove('light', 'dark')
            document.documentElement.classList.add(theme)
        }
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark')
    }

    // Always render with context to prevent hydration mismatch
    // Use opacity to hide content until mounted
    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <div style={{ opacity: mounted ? 1 : 0 }} className="transition-opacity duration-150">
                {children}
            </div>
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
