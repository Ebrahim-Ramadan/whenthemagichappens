"use client"

interface ControlPanelProps {
  alignment: {
    left: boolean
    right: boolean
    top: boolean
    bottom: boolean
  }
  instanceId: string
  hasConnection: boolean
}

export default function ControlPanel({ alignment, instanceId, hasConnection }: ControlPanelProps) {
  const isAligned = Object.values(alignment).some((v) => v === true)

  return (
    <div className="absolute bottom-8 left-8 right-8 bg-slate-800/90 backdrop-blur rounded-xl p-6 border border-slate-700">
      <div className="flex items-start justify-between gap-6">
        {/* Info section */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Window Information</h3>
          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Instance ID:</span>
              <span className="font-mono text-slate-300">{instanceId}</span>
            </div>
            <div className="flex justify-between">
              <span>Screen Position:</span>
              <span className="font-mono text-slate-300">
                {Math.round(window.screenX)}, {Math.round(window.screenY)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Window Size:</span>
              <span className="font-mono text-slate-300">
                {window.innerWidth} × {window.innerHeight}
              </span>
            </div>
          </div>
        </div>

        {/* Status section */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Alignment Status</h3>
          <div className="space-y-2">
            {alignment.left && (
              <div className="text-xs bg-emerald-900/50 border border-emerald-700 rounded px-3 py-2 text-emerald-300">
                ← Left edge aligned
              </div>
            )}
            {alignment.right && (
              <div className="text-xs bg-emerald-900/50 border border-emerald-700 rounded px-3 py-2 text-emerald-300">
                → Right edge aligned
              </div>
            )}
            {alignment.top && (
              <div className="text-xs bg-emerald-900/50 border border-emerald-700 rounded px-3 py-2 text-emerald-300">
                ↑ Top edge aligned
              </div>
            )}
            {alignment.bottom && (
              <div className="text-xs bg-emerald-900/50 border border-emerald-700 rounded px-3 py-2 text-emerald-300">
                ↓ Bottom edge aligned
              </div>
            )}
            {!isAligned && (
              <div className="text-xs bg-slate-700/50 border border-slate-600 rounded px-3 py-2 text-slate-400">
                No alignment detected
              </div>
            )}
          </div>
        </div>

        {/* Connection indicator */}
        <div className="text-center">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
              hasConnection
                ? "bg-emerald-500/20 border-2 border-emerald-500"
                : "bg-slate-700/50 border-2 border-slate-600"
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                hasConnection ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
              }`}
            ></div>
          </div>
          <span className="text-xs text-slate-400 mt-2 block">{hasConnection ? "Connected" : "Standalone"}</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <p className="text-xs text-slate-400">
          💡 Open this page in another tab or window, and position them side-by-side or above/below each other. The
          edges will detect proximity and bend to align.
        </p>
      </div>
    </div>
  )
}
