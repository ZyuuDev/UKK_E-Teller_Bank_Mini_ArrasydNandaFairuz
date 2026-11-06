import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api'

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll']
const KEEPALIVE_MS = 45_000

/**
 * Mengembalikan pengguna ke halaman login setelah tidak ada aktivitas.
 *
 * - Aktivitas pengguna (klik, ketik, gulir, sentuh) menyegarkan penghitung.
 * - Server juga menerapkan batas tidak aktif. Saat pengguna aktif, klien mengirim
 *   permintaan ringan berkala agar sesi server tidak kedaluwarsa lebih dulu.
 * - Peringatan dengan hitung mundur muncul sebelum sesi diakhiri.
 */
export function useIdleTimeout({ enabled, idleSeconds, warnSeconds = 60, onTimeout }) {
  const [remaining, setRemaining] = useState(null)
  const lastActivity = useRef(Date.now())
  const lastPing = useRef(Date.now())
  const warning = useRef(false)
  const timeoutHandler = useRef(onTimeout)

  useEffect(() => {
    timeoutHandler.current = onTimeout
  }, [onTimeout])

  const ping = useCallback(() => {
    lastPing.current = Date.now()
    api('/auth/me').catch(() => {})
  }, [])

  const stay = useCallback(() => {
    lastActivity.current = Date.now()
    warning.current = false
    setRemaining(null)
    ping()
  }, [ping])

  useEffect(() => {
    if (!enabled || !idleSeconds) return undefined
    const warnAt = Math.max(idleSeconds - warnSeconds, Math.floor(idleSeconds / 2))
    lastActivity.current = Date.now()
    lastPing.current = Date.now()
    warning.current = false

    const touch = () => {
      if (warning.current) return
      const now = Date.now()
      lastActivity.current = now
      if (now - lastPing.current > KEEPALIVE_MS) ping()
    }
    const tick = () => {
      const idle = (Date.now() - lastActivity.current) / 1000
      if (idle >= idleSeconds) {
        warning.current = false
        setRemaining(null)
        timeoutHandler.current?.()
      } else if (idle >= warnAt) {
        warning.current = true
        setRemaining(Math.ceil(idleSeconds - idle))
      }
    }

    ACTIVITY_EVENTS.forEach((name) =>
      window.addEventListener(name, touch, { passive: true, capture: true }),
    )
    document.addEventListener('visibilitychange', tick)
    const timer = window.setInterval(tick, 1000)
    return () => {
      ACTIVITY_EVENTS.forEach((name) =>
        window.removeEventListener(name, touch, { capture: true }),
      )
      document.removeEventListener('visibilitychange', tick)
      window.clearInterval(timer)
      warning.current = false
    }
  }, [enabled, idleSeconds, warnSeconds, ping])

  return { remaining, stay }
}

