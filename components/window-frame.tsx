"use client"

import { useEffect, useState } from "react"

interface WindowFrameProps {
  alignment: {
    left: boolean
    right: boolean
    top: boolean
    bottom: boolean
  }
  instanceId: string
  otherWindows: boolean
}

export default function WindowFrame({ alignment, instanceId, otherWindows }: WindowFrameProps) {
  const [displayId, setDisplayId] = useState("")

  useEffect(() => {
    setDisplayId(instanceId.slice(0, 6).toUpperCase())
  }, [instanceId])

  return (
    <div className="relative w-96 h-96 perspective">
      {/* Main window frame */}
      <div
        className={`
          relative w-full h-full rounded-2xl bg-white shadow-2xl transition-all duration-300 overflow-hidden
          ${alignment.right ? "origin-right scale-x-105" : ""}
          ${alignment.left ? "origin-left scale-x-105" : ""}
          ${alignment.bottom ? "origin-bottom scale-y-105" : ""}
          ${alignment.top ? "origin-top scale-y-105" : ""}
        `}
      >
        {/* Window header */}
        <div className="h-12 bg-gradient-to-r from-slate-800 to-slate-700 flex items-center px-4 gap-3 border-b border-slate-600">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-xs font-mono text-slate-300 ml-2">window-{displayId}</span>
        </div>

        {/* Window content */}
        <div className="h-full overflow-hidden bg-slate-50 p-6 flex flex-col items-center justify-center gap-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Window Alignment</h2>
            <p className="text-sm text-slate-600">Open another tab/window nearby</p>
          </div>

          {/* Status indicators */}
          <div className="grid grid-cols-3 gap-4 mt-6 w-32 h-32">
            {/* Top */}
            <div
              className={`col-span-3 h-8 rounded-lg transition-all duration-300 flex items-center justify-center text-xs font-semibold ${
                alignment.top
                  ? "bg-gradient-to-b from-emerald-400 to-emerald-500 text-white shadow-lg scale-y-110"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {alignment.top ? "↑ ALIGNED" : "–"}
            </div>

            {/* Left, Center, Right */}
            <div
              className={`h-8 rounded-lg transition-all duration-300 flex items-center justify-center text-xs font-semibold ${
                alignment.left
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-500 text-white shadow-lg scale-x-110"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {alignment.left ? "← L" : "–"}
            </div>

            <div className="h-8 rounded-lg bg-slate-300 flex items-center justify-center">
              <span className="text-xs font-mono text-slate-600">●</span>
            </div>

            <div
              className={`h-8 rounded-lg transition-all duration-300 flex items-center justify-center text-xs font-semibold ${
                alignment.right
                  ? "bg-gradient-to-l from-emerald-400 to-emerald-500 text-white shadow-lg scale-x-110"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {alignment.right ? "R →" : "–"}
            </div>

            {/* Bottom */}
            <div
              className={`col-span-3 h-8 rounded-lg transition-all duration-300 flex items-center justify-center text-xs font-semibold ${
                alignment.bottom
                  ? "bg-gradient-to-t from-emerald-400 to-emerald-500 text-white shadow-lg scale-y-110"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {alignment.bottom ? "↓ ALIGNED" : "–"}
            </div>
          </div>

          {/* Connection status */}
          <div className="mt-4 pt-4 border-t border-slate-200 w-full text-center">
            <div
              className={`text-xs font-semibold transition-colors duration-300 ${
                otherWindows ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              {otherWindows ? "✓ Connected" : "○ Waiting for connection..."}
            </div>
          </div>
        </div>

        {/* Animated border effect for alignment */}
        {(alignment.left || alignment.right || alignment.top || alignment.bottom) && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none">
            {alignment.right && (
              <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-emerald-400 via-emerald-500 to-transparent animate-pulse"></div>
            )}
            {alignment.left && (
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 via-emerald-500 to-transparent animate-pulse"></div>
            )}
            {alignment.top && (
              <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-transparent animate-pulse"></div>
            )}
            {alignment.bottom && (
              <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-transparent animate-pulse"></div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
