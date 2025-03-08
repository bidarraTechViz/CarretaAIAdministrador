"use client"

import { useState, useEffect } from "react"

type ToastProps = {
  title: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
}

type ToastState = ToastProps & {
  id: string
  visible: boolean
}

let toastCounter = 0
const toasts: ToastState[] = []
let listeners: ((toasts: ToastState[]) => void)[] = []

export function toast(props: ToastProps) {
  const id = `toast-${++toastCounter}`
  const newToast: ToastState = {
    ...props,
    id,
    visible: true,
    duration: props.duration || 5000,
  }

  toasts.push(newToast)
  notifyListeners()

  setTimeout(() => {
    const index = toasts.findIndex((t) => t.id === id)
    if (index !== -1) {
      toasts[index].visible = false
      notifyListeners()

      // Remove from array after animation
      setTimeout(() => {
        const removeIndex = toasts.findIndex((t) => t.id === id)
        if (removeIndex !== -1) {
          toasts.splice(removeIndex, 1)
          notifyListeners()
        }
      }, 300)
    }
  }, newToast.duration)
}

function notifyListeners() {
  listeners.forEach((listener) => listener([...toasts]))
}

export function Toaster() {
  const [visibleToasts, setVisibleToasts] = useState<ToastState[]>([])

  useEffect(() => {
    const handleToastsChange = (updatedToasts: ToastState[]) => {
      setVisibleToasts(updatedToasts)
    }

    listeners.push(handleToastsChange)
    return () => {
      listeners = listeners.filter((l) => l !== handleToastsChange)
    }
  }, [])

  if (visibleToasts.length === 0) return null

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 flex flex-col gap-2 max-w-md">
      {visibleToasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-md shadow-lg transition-all duration-300 ${
            toast.visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          } ${toast.variant === "destructive" ? "bg-red-600 text-white" : "bg-black text-[#F2BE13]"}`}
        >
          <div className="font-semibold">{toast.title}</div>
          {toast.description && <div className="text-sm mt-1">{toast.description}</div>}
        </div>
      ))}
    </div>
  )
}

