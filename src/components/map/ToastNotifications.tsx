// ─── Toast Notifications ──────────────────────────────────────────────────
// Slide-in alerts when simulation generates new active alerts

import type { SimAlert } from '@/lib/stadiumSimulation'

interface Props {
  toasts: SimAlert[]
}

export function ToastNotifications({ toasts }: Props) {
  if (toasts.length === 0) return null

  return (
    <div className="absolute top-4 right-[372px] z-[600] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="toast-slide-in flex items-start gap-3 px-4 py-3 rounded-lg shadow-2xl min-w-[270px] max-w-[320px]"
          style={{
            background: '#FFFFFF',
            border: `1.5px solid ${toast.severity === 'critical' ? '#ef4444' : '#f97316'}55`,
            boxShadow: `0 4px 24px rgba(0,0,0,0.12), 0 0 12px ${toast.severity === 'critical' ? '#ef444415' : '#f9731615'}`,
          }}
        >
          <div className="text-[18px] flex-none mt-0.5">
            {toast.type === 'bin' ? '🗑️' : '👥'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border"
                style={{
                  color: toast.severity === 'critical' ? '#ef4444' : '#f97316',
                  background: toast.severity === 'critical' ? '#ef444415' : '#f9731615',
                  borderColor: toast.severity === 'critical' ? '#ef444440' : '#f9731640',
                }}
              >
                {toast.severity === 'critical' ? '🚨 CRITIQUE' : '⚠️ ALERTE'}
              </span>
            </div>
            <div className="text-[12px] font-semibold text-[#111827] truncate">{toast.name}</div>
            <div className="text-[10px] text-[#6B7280] font-mono mt-0.5 leading-snug">{toast.description}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
