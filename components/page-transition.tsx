'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function PageTransition() {
  const pathname = usePathname()
  const [isAnimating, setIsAnimating] = useState(false)
  const [prevPath, setPrevPath] = useState(pathname)

  useEffect(() => {
    if (pathname !== prevPath) {
      setIsAnimating(true)
      setPrevPath(pathname)

      const timer = setTimeout(() => {
        setIsAnimating(false)
      }, 2400) // slightly less than 3s for smooth feel

      return () => clearTimeout(timer)
    }
  }, [pathname, prevPath])

  if (!isAnimating) return null

  return (
    <div className="page-transition-overlay" aria-hidden="true">
      {/* Backdrop blur */}
      <div className="page-transition-backdrop" />

      {/* Spinning E */}
      <div className="page-transition-content">
        <div className="page-transition-logo">
          <span className="page-transition-e">E</span>
        </div>

        {/* Orbiting dots */}
        <div className="page-transition-orbit">
          <div className="page-transition-dot dot-1" />
          <div className="page-transition-dot dot-2" />
          <div className="page-transition-dot dot-3" />
        </div>

        {/* Pulse rings */}
        <div className="page-transition-ring ring-1" />
        <div className="page-transition-ring ring-2" />
      </div>
    </div>
  )
}
