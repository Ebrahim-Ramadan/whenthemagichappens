"use client"

import { useEffect, useRef, useState, useMemo } from "react"

interface WindowPosition {
  id: string
  x: number
  y: number
  width: number
  height: number
}

interface Particle {
  id: number
  angle: number // polar angle
  dist: number // polar distance (0-1 normalized)
  size: number
  baseOpacity: number
  speed: number
  offset: number
}

export default function Home() {
  const [otherWindow, setOtherWindow] = useState<WindowPosition | null>(null)
  const [svgDims, setSvgDims] = useState({ width: 0, height: 0 })
  const instanceId = useRef(Math.random().toString(36).substr(2, 9))
  const channelRef = useRef<BroadcastChannel | null>(null)
  const [angle, setAngle] = useState(0)
  const [distance, setDistance] = useState(0)
  const [connected, setConnected] = useState(false)

  // Generate particles only once
  const particles = useMemo(() => {
    const p: Particle[] = []
    const count = 80 // Number of dots for the shape
    
    for (let i = 0; i < count; i++) {
      // Distribution: Semi-circle (-PI/2 to PI/2)
      // We bias towards the edge for definition, but fill the center for volume
      const isEdge = Math.random() > 0.6
      const rBase = isEdge ? 0.9 + Math.random() * 0.1 : Math.random() * 0.9
      
      // Angle: -PI/2 to PI/2 (right side)
      const theta = (Math.random() * Math.PI) - (Math.PI / 2)
      
      p.push({
        id: i,
        angle: theta,
        dist: rBase,
        size: Math.random() * 3 + 1, // 1px to 4px
        baseOpacity: Math.random() * 0.5 + 0.3,
        speed: Math.random() * 2 + 1, // animation duration multiplier
        offset: Math.random() * 1000 // animation delay
      })
    }
    return p
  }, [])

  // Initialize BroadcastChannel for cross-tab communication
  useEffect(() => {
    try {
      channelRef.current = new BroadcastChannel("window-alignment-line")

      const handleMessage = (event: MessageEvent) => {
        const data = event.data as WindowPosition
        if (data.id !== instanceId.current) {
          setOtherWindow(data)
          setConnected(true)
        }
      }

      channelRef.current.addEventListener("message", handleMessage)
      return () => {
        if (channelRef.current) {
          channelRef.current.removeEventListener("message", handleMessage)
          channelRef.current.close()
        }
      }
    } catch {
      console.log("BroadcastChannel not available")
    }
  }, [])

  // Broadcast window position loop - High Frequency
  useEffect(() => {
    let rafId = 0
    let lastX = 0
    let lastY = 0
    let lastW = 0
    let lastH = 0

    const broadcastPosition = () => {
      // Check if position changed to avoid flooding, but check aggressively
      const currentX = window.screenX
      const currentY = window.screenY
      const currentW = window.innerWidth
      const currentH = window.innerHeight

      // Only broadcast if changed
      const sizeChanged = currentW !== lastW || currentH !== lastH
      if (channelRef.current && (currentX !== lastX || currentY !== lastY || sizeChanged)) {

        const message: WindowPosition = {
          id: instanceId.current,
          x: currentX,
          y: currentY,
          width: currentW,
          height: currentH,
        }
        channelRef.current.postMessage(message)

        // Also update local SVG dims immediately if size changed
        if (sizeChanged) {
          setSvgDims({ width: currentW, height: currentH })
        }

        lastX = currentX
        lastY = currentY
        lastW = currentW
        lastH = currentH
      }

      rafId = requestAnimationFrame(broadcastPosition)
    }

    // Initial SVG dimensions
    setSvgDims({ width: window.innerWidth, height: window.innerHeight })
    
    // Start loop
    broadcastPosition()

    const handleResize = () => {
      setSvgDims({ width: window.innerWidth, height: window.innerHeight })
    }

    window.addEventListener("resize", handleResize)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Smoothly animate rotation toward the other window
  useEffect(() => {
    let raf = 0
    const animate = () => {
      let target = 0
      let dist = 0

      if (otherWindow) {
        const myCenterX = window.screenX + window.innerWidth / 2
        const myCenterY = window.screenY + window.innerHeight / 2
        const otherCenterX = otherWindow.x + otherWindow.width / 2
        const otherCenterY = otherWindow.y + otherWindow.height / 2

        const dx = otherCenterX - myCenterX
        const dy = otherCenterY - myCenterY

        // Angle pointing towards the other window
        target = (Math.atan2(dy, dx) * 180) / Math.PI
        dist = Math.hypot(dx, dy)
      } else {
        // If no connection, rotate slowly to show it's "scanning"
        target = (Date.now() / 20) % 360
      }

      setDistance(dist)

      // simple easing towards target angle
      setAngle((prev) => {
        const d = target - prev
        // wrap shortest
        const delta = ((d + 180) % 360) - 180
        
        // MUCH faster response (0.5 instead of 0.2)
        // If delta is huge (jump), snap to it
        if (Math.abs(delta) > 100) return target
        
        return prev + delta * 0.5
      })

      raf = requestAnimationFrame(animate)
    }

    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [otherWindow])

  // Dynamic colors based on ID
  const idVal = parseInt(instanceId.current.slice(0, 4), 36) || 1
  const isBlue = idVal % 2 === 0
  const primaryColor = isBlue ? "#3b82f6" : "#10b981" // blue-500 : emerald-500
  const secondaryColor = isBlue ? "#60a5fa" : "#34d399" // blue-400 : emerald-400

  return (
    <main className="fixed inset-0 bg-slate-900 overflow-hidden text-slate-100">
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); opacity: 0.8; }
          50% { transform: translate(var(--tx), var(--ty)); opacity: 0.4; }
        }
        @keyframes flow {
          0% { transform: translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(var(--dist)); opacity: 0; }
        }
      `}</style>
      
      <svg
        width={svgDims.width}
        height={svgDims.height}
        className="absolute inset-0 pointer-events-none"
        style={{ position: "fixed", top: 0, left: 0 }}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {(() => {
          const w = svgDims.width
          const h = svgDims.height
          const cx = w / 2
          const cy = h / 2
          if (!w || !h) return null

          // Size of the core shape
          const r = Math.min(w, h) * 0.25

          return (
            <g transform={`translate(${cx}, ${cy}) rotate(${angle})`}>
              {/* Beam made of flowing dots */}
              {connected && (
                <g filter="url(#glow)">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <circle
                      key={`beam-${i}`}
                      r={Math.random() * 2 + 1}
                      fill={secondaryColor}
                      opacity={0.6}
                    >
                      <animate
                        attributeName="cx"
                        from="0"
                        to={distance / 2}
                        dur={`${1000 + Math.random() * 1000}ms`}
                        repeatCount="indefinite"
                        begin={`${Math.random() * -2000}ms`}
                      />
                      <animate
                        attributeName="cy"
                        values="-2;2;-2"
                        dur={`${500 + Math.random() * 1000}ms`}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0;0.8;0"
                        dur={`${1000 + Math.random() * 1000}ms`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  ))}
                  {/* Core connector beam line (faint) */}
                  <line 
                    x1="0" y1="0" x2={distance / 2} y2="0" 
                    stroke={primaryColor} 
                    strokeWidth="1" 
                    opacity="0.2" 
                    strokeDasharray="4 4"
                  />
                </g>
              )}

              {/* The "Half" Shape - Particle System */}
              <g filter="url(#glow)">
                {particles.map((p) => {
                  // Polar to Cartesian
                  // x = r * dist * cos(theta)
                  // y = r * dist * sin(theta)
                  const px = r * p.dist * Math.cos(p.angle)
                  const py = r * p.dist * Math.sin(p.angle)
                  
                  // Random float direction
                  const tx = (Math.random() - 0.5) * 10 + "px"
                  const ty = (Math.random() - 0.5) * 10 + "px"

                  return (
                    <circle
                      key={p.id}
                      cx={px}
                      cy={py}
                      r={p.size}
                      fill={primaryColor}
                      style={
                        {
                          opacity: p.baseOpacity,
                          animation: `float ${3 * p.speed}s ease-in-out infinite alternate`,
                          animationDelay: `${-p.offset}ms`,
                          ["--tx"]: tx,
                          ["--ty"]: ty,
                        } as React.CSSProperties & Record<string, string | number>
                      }
                    />
                  )
                })}
                
                {/* Central concentrated energy */}
                 <circle cx="0" cy="0" r={r * 0.1} fill={secondaryColor} filter="url(#glow)" opacity="0.5">
                   <animate attributeName="r" values={`${r*0.08};${r*0.12};${r*0.08}`} dur="3s" repeatCount="indefinite" />
                 </circle>
              </g>

            </g>
          )
        })()}
      </svg>

      {/* ControlPanel intentionally omitted during SSR to avoid window access */}
    </main>
  )
}
