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
  const [angle, setAngle] = useState(0)

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

  // Smoothly animate rotation toward the other window
  useEffect(() => {
    let raf = 0
    const animate = () => {
      let target = 0
      if (otherWindow) {
        const myCenterX = window.screenX + window.innerWidth / 2
        const myCenterY = window.screenY + window.innerHeight / 2
        const otherCenterX = otherWindow.x + otherWindow.width / 2
        const otherCenterY = otherWindow.y + otherWindow.height / 2
        target = (Math.atan2(otherCenterY - myCenterY, otherCenterX - myCenterX) * 180) / Math.PI
      }

      // simple easing towards target angle
      setAngle((prev) => {
        const d = target - prev
        // wrap shortest
        const delta = ((d + 180) % 360) - 180
        return prev + delta * 0.18
      })

      raf = requestAnimationFrame(animate)
    }

    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [otherWindow])

  const getRibbonPaths = () => {
    if (!otherWindow) return { ribbon: "", center: "", midX: 0, midY: 0 }

    const myScreenX = window.screenX
    const myScreenY = window.screenY
    const myWidth = window.innerWidth
    const myHeight = window.innerHeight

    const otherScreenX = otherWindow.x
    const otherScreenY = otherWindow.y
    const otherWidth = otherWindow.width
    const otherHeight = otherWindow.height

    const myMidY = myScreenY + myHeight / 2
    const otherMidY = otherScreenY + otherHeight / 2

    const startX = myWidth
    const startY = myMidY - myScreenY

    const endX = otherScreenX - myScreenX
    const endY = otherMidY - myScreenY

    const dx = endX - startX
    const dy = endY - startY
    const dist = Math.hypot(dx, dy) || 1

    // Perpendicular (unit) vector for ribbon thickness
    const nx = -dy / dist
    const ny = dx / dist

    // Thickness and bulge scale with distance, clamped for sane values
    const thickness = Math.min(80, Math.max(10, dist * 0.06))
    const bulge = Math.min(160, Math.max(20, dist * 0.12))

    const cx = (startX + endX) / 2
    const cy = (startY + endY) / 2
    const controlX = cx + nx * bulge
    const controlY = cy + ny * bulge

    // Four ribbon corner points (offset along perpendicular)
    const p1x = startX + nx * thickness
    const p1y = startY + ny * thickness
    const p2x = endX + nx * thickness
    const p2y = endY + ny * thickness
    const p3x = endX - nx * thickness
    const p3y = endY - ny * thickness
    const p4x = startX - nx * thickness
    const p4y = startY - ny * thickness

    const controlTopX = controlX + nx * thickness
    const controlTopY = controlY + ny * thickness
    const controlBottomX = controlX - nx * thickness
    const controlBottomY = controlY - ny * thickness

    // Closed smooth ribbon path (top curve -> straight to bottom curve -> back)
    const ribbon = `M ${p1x} ${p1y} Q ${controlTopX} ${controlTopY} ${p2x} ${p2y} L ${p3x} ${p3y} Q ${controlBottomX} ${controlBottomY} ${p4x} ${p4y} Z`

    // Center curve for stroke + glow
    const center = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`

    return { ribbon, center, midX: cx, midY: cy, startX, startY, endX, endY, thickness }
  }

  return (
    <main className="fixed inset-0 bg-slate-50 overflow-hidden">
      {/* Single semicircle oriented toward the other window */}
      <svg
        width={svgDims.width}
        height={svgDims.height}
        className="absolute inset-0"
        style={{ position: "fixed", top: 0, left: 0 }}
      >
        <defs>
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {(() => {
          const w = svgDims.width || window.innerWidth
          const h = svgDims.height || window.innerHeight
          const cx = w / 2
          const cy = h / 2

          // base radius (smaller than before)
          const base = Math.max(10, Math.min(w, h))
          let r = base * 0.9

          // decide color per-instance so some windows are blue, some green
          const idVal = parseInt(instanceId.current.slice(0, 4), 36) || 1
          const isBlue = idVal % 2 === 0

          // make blue semicircles smaller per request
          if (isBlue) r = r * 0.6

          // semicircle path oriented to the right (base), rotated via CSS for smoothness
          const semiPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} L ${cx} ${cy} Z`

          const fillColor = isBlue ? "#3b82f6" : "#10b981"

          // use CSS transform for smooth transitions (transformOrigin in px)
          const style: any = {
            transform: `rotate(${angle}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transition: "transform 180ms cubic-bezier(.2,.8,.2,1)",
          }

          return (
            <g transformBox="fill-box" style={style}>
              <path d={semiPath} fill={fillColor} filter="url(#soft)" />
            </g>
          )
        })()}
      </svg>
    </main>
  )
}
