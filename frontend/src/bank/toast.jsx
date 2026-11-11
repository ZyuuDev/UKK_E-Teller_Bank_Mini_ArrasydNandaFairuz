import { useEffect, useState } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

let listeners = []

function notify(toastItem) {
  listeners.forEach((listener) => listener(toastItem))
}

export const toast = {
  subscribe(listener) {
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  },
  show(message, type = 'info', duration = 4000) {
    if (!message) return
    const id = Date.now() + Math.random().toString(36).slice(2, 6)
    notify({ id, message, type, duration })
  },
  success(message, duration = 4000) {
    this.show(message, 'success', duration)
  },
  error(message, duration = 5000) {
    this.show(message, 'error', duration)
  },
  warning(message, duration = 4500) {
    this.show(message, 'warning', duration)
  },
  info(message, duration = 4000) {
    this.show(message, 'info', duration)
  },
}

// Pencegahan: Intersep window.alert bawaan browser agar tidak pernah muncul dialog jelek
if (typeof window !== 'undefined') {
  window.alert = (message) => {
    toast.info(String(message ?? ''))
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    return toast.subscribe((newToast) => {
      setToasts((current) => [...current, newToast])
      if (newToast.duration > 0) {
        setTimeout(() => {
          setToasts((current) => current.filter((t) => t.id !== newToast.id))
        }, newToast.duration)
      }
    })
  }, [])

  function remove(id) {
    setToasts((current) => current.filter((t) => t.id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div className="bank-toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((t) => {
        const IconComponent =
          t.type === 'error'
            ? AlertCircle
            : t.type === 'success'
            ? CheckCircle2
            : t.type === 'warning'
            ? AlertTriangle
            : Info

        return (
          <div key={t.id} className={`bank-toast bank-toast--${t.type}`} role="status">
            <IconComponent size={20} className="bank-toast__icon" aria-hidden="true" />
            <div className="bank-toast__message">{t.message}</div>
            <button
              type="button"
              className="bank-toast__close"
              onClick={() => remove(t.id)}
              aria-label="Tutup notifikasi"
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
