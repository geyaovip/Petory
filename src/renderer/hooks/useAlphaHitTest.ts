import { useCallback, useEffect, useRef } from 'react'

const ALPHA_THRESHOLD = 48

export function useAlphaHitTest(imageSrc: string | null): (
  img: HTMLImageElement,
  clientX: number,
  clientY: number
) => boolean {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!imageSrc) {
      canvasRef.current = null
      return
    }

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return
      ctx.drawImage(img, 0, 0)
      canvasRef.current = canvas
    }
    img.src = imageSrc
  }, [imageSrc])

  return useCallback((img: HTMLImageElement, clientX: number, clientY: number): boolean => {
    const canvas = canvasRef.current
    if (!canvas) return true

    const rect = img.getBoundingClientRect()
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return false
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return true

    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = Math.min(canvas.width - 1, Math.max(0, Math.floor((clientX - rect.left) * scaleX)))
    const y = Math.min(canvas.height - 1, Math.max(0, Math.floor((clientY - rect.top) * scaleY)))
    const alpha = ctx.getImageData(x, y, 1, 1).data[3]
    return alpha >= ALPHA_THRESHOLD
  }, [])
}
