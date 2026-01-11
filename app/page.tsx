"use client"

import { useEffect, useRef, useState } from "react"

interface WindowPosition {
  id: string
  x: number
  y: number
  width: number
  height: number
}

export default function Home() {
  const [otherWindow, setOtherWindow] = useState<WindowPosition | null>(null)
  const [svgDims, setSvgDims] = useState({ width: 0, height: 0 })
  const instanceId = useRef(Math.random().toString(36).substr(2, 9))
  const channelRef = useRef<BroadcastChannel | null>(null)

  // Initialize BroadcastChannel for cross-tab communication
  useEffect(() => {
    try {
      channelRef.current = new BroadcastChannel("window-alignment-line")

      const handleMessage = (event: MessageEvent) => {
        const data = event.data as WindowPosition
        if (data.id !== instanceId.current) {
          setOtherWindow(data)
        }
      }

      channelRef.current.addEventListener("message", handleMessage)
      return () => {
        if (channelRef.current) {
          channelRef.current.removeEventListener("message", handleMessage)
          channelRef.current.close()
        }
      }
    } catch (e) {
      console.log("BroadcastChannel not available")
    }
  }, [])

  // Broadcast window position frequently for smooth updates
  useEffect(() => {
    const broadcastPosition = () => {
      if (channelRef.current) {
        const message: WindowPosition = {
          id: instanceId.current,
          x: window.screenX,
          y: window.screenY,
          width: window.innerWidth,
          height: window.innerHeight,
        }
        channelRef.current.postMessage(message)
      }
    }

    // Update SVG dimensions
    setSvgDims({ width: window.innerWidth, height: window.innerHeight })

    const interval = setInterval(broadcastPosition, 50)
    broadcastPosition()

    const handleResize = () => {
      setSvgDims({ width: window.innerWidth, height: window.innerHeight })
    }

    window.addEventListener("resize", handleResize)
    return () => {
      clearInterval(interval)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const getSvgPath = () => {
    if (!otherWindow) return ""

    const myScreenX = window.screenX
    const myScreenY = window.screenY
    const myWidth = window.innerWidth
    const myHeight = window.innerHeight

    const otherScreenX = otherWindow.x
    const otherScreenY = otherWindow.y
    const otherWidth = otherWindow.width
    const otherHeight = otherWindow.height

    // Calculate in screen space first
    const myRightEdge = myScreenX + myWidth
    const otherLeftEdge = otherScreenX
    const myMidY = myScreenY + myHeight / 2
    const otherMidY = otherScreenY + otherHeight / 2

    // Convert screen coordinates to viewport coordinates (relative to current window)
    // Viewport X: 0 to innerWidth
    // For other window, we subtract current window's screenX to get its position relative to this window's viewport
    const startX = myWidth
    const startY = myMidY - myScreenY

    const endX = otherLeftEdge - myScreenX
    const endY = otherMidY - myScreenY

    // Quadratic bezier curve that bends smoothly between windows
    const controlX = (startX + endX) / 2
    const controlY = (startY + endY) / 2

    return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`
  }

  return (
    <main className="fixed inset-0 bg-slate-50 overflow-hidden">
      {/* Full-screen SVG for the connecting line */}
      <svg
        width={svgDims.width}
        height={svgDims.height}
        className="absolute inset-0 pointer-events-none"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
        }}
      >
        {otherWindow && (
          <>
            {/* Main connecting line */}
            <path d={getSvgPath()} stroke="#1f2937" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Glow effect */}
            <path d={getSvgPath()} stroke="#3b82f6" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.2" />
          </>
        )}
      </svg>

      {/* Status text */}
      <div className="fixed bottom-8 left-8 text-sm font-medium text-slate-600">
        {otherWindow ? (
          <span className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Connected - Line aligns as you drag
          </span>
        ) : (
          <span className="text-slate-400">Open in another tab or window to see the line...</span>
        )}
      </div>
    </main>
  )
}
