/**
 * useToast Hook
 * 
 * Manages toast notifications state and provides methods to show/hide toasts
 */

import { useState, useCallback } from 'react'
import type { ToastType, ToastProps } from '../components/ui/toast'

let toastIdCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const showToast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = `toast-${++toastIdCounter}`
    const newToast: ToastProps = {
      id,
      type,
      message,
      duration,
      onClose: (toastId: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId))
      },
    }
    setToasts((prev) => [...prev, newToast])
    return id
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback((message: string, duration?: number) => {
    return showToast('success', message, duration)
  }, [showToast])

  const error = useCallback((message: string, duration?: number) => {
    return showToast('error', message, duration)
  }, [showToast])

  const info = useCallback((message: string, duration?: number) => {
    return showToast('info', message, duration)
  }, [showToast])

  const warning = useCallback((message: string, duration?: number) => {
    return showToast('warning', message, duration)
  }, [showToast])

  return {
    toasts,
    showToast,
    hideToast,
    success,
    error,
    info,
    warning,
  }
}
