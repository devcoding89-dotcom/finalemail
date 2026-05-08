'use client'

import { useEffect, useState } from 'react'

export default function AuthLoading() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="page-transition-overlay">
      {/* Backdrop */}
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
