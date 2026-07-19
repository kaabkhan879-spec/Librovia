import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn, Move, Check, RotateCcw } from 'lucide-react'
import { Button } from './Button'

export interface ImageCropperModalProps {
  isOpen: boolean
  imageSrc: string
  onClose: () => void
  onCropComplete: (croppedDataUrl: string) => Promise<void> | void
  isUploading?: boolean
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  isUploading = false,
}) => {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null)
  const [prevImageSrc, setPrevImageSrc] = useState<string>(imageSrc)

  // Reset zoom & pan when imageSrc changes during render
  if (imageSrc !== prevImageSrc) {
    setPrevImageSrc(imageSrc)
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setLoadedImage(null)
  }

  // Load image element when modal is open
  useEffect(() => {
    let active = true
    if (isOpen && imageSrc) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = imageSrc
      img.onload = () => {
        if (active) {
          setLoadedImage(img)
        }
      }
    }
    return () => {
      active = false
    }
  }, [isOpen, imageSrc])

  // Generate 512x512 WebP cropped image canvas helper
  const generateCroppedCanvas = useCallback(() => {
    if (!loadedImage) return null

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Fill white background for safety
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 512, 512)

    // Calculate crop parameters based on zoom and pan
    const cropSize = Math.min(loadedImage.width, loadedImage.height)
    const scale = cropSize / 280 // viewport size 280px

    const srcWidth = cropSize / zoom
    const srcHeight = cropSize / zoom

    const centerX = loadedImage.width / 2 - (pan.x * scale) / zoom
    const centerY = loadedImage.height / 2 - (pan.y * scale) / zoom

    const srcX = Math.max(0, Math.min(loadedImage.width - srcWidth, centerX - srcWidth / 2))
    const srcY = Math.max(0, Math.min(loadedImage.height - srcHeight, centerY - srcHeight / 2))

    ctx.drawImage(loadedImage, srcX, srcY, srcWidth, srcHeight, 0, 0, 512, 512)
    return canvas
  }, [loadedImage, pan.x, pan.y, zoom])

  // Update live preview widget
  useEffect(() => {
    if (loadedImage) {
      const timer = setTimeout(() => {
        const canvas = generateCroppedCanvas()
        if (canvas) {
          setPreviewUrl(canvas.toDataURL('image/webp', 0.85))
        }
      }, 10)
      return () => clearTimeout(timer)
    }
  }, [loadedImage, zoom, pan, generateCroppedCanvas])

  // Mouse / Touch drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    const maxOffset = 140 * zoom
    setPan({
      x: Math.max(-maxOffset, Math.min(maxOffset, newX)),
      y: Math.max(-maxOffset, Math.min(maxOffset, newY)),
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleSave = async () => {
    const canvas = generateCroppedCanvas()
    if (!canvas) return

    // Convert to WebP format at 0.85 quality (size < 200 KB)
    const dataUrl = canvas.toDataURL('image/webp', 0.85)
    await onCropComplete(dataUrl)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop click dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isUploading && onClose()}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Crop Profile Picture
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Drag to reposition and scale your avatar photo
              </p>
            </div>
            <button
              type="button"
              disabled={isUploading}
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Interactive Crop Viewport Area */}
          <div className="my-5 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <div className="relative flex flex-col items-center">
              <div
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="relative h-[280px] w-[280px] cursor-grab overflow-hidden rounded-2xl bg-slate-950 select-none active:cursor-grabbing"
              >
                {loadedImage && (
                  <img
                    src={imageSrc}
                    alt="Crop workspace"
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                    }}
                    className="pointer-events-none h-full w-full object-contain"
                  />
                )}

                {/* Circular Crop Guide Mask */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-[240px] w-[240px] rounded-full border-2 border-white/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.6)]" />
                </div>

                {/* Drag hint overlay */}
                <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 text-[9px] font-bold text-white backdrop-blur-xs">
                  <Move className="h-3 w-3" /> Drag to move
                </div>
              </div>
            </div>

            {/* Live Preview Panel */}
            <div className="flex flex-col items-center justify-center gap-3 text-center sm:items-center">
              <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                Live Preview
              </span>
              <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-purple-500 shadow-md ring-4 ring-purple-500/10">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Cropped live preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full animate-pulse bg-slate-200 dark:bg-slate-800" />
                )}
              </div>
              <span className="font-mono text-[9px] text-slate-400">512 × 512 (WebP)</span>
            </div>
          </div>

          {/* Controls: Zoom slider & Reset */}
          <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <ZoomIn className="h-4 w-4 text-purple-600" /> Zoom Scale
              </span>
              <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400">
                {zoom.toFixed(1)}x
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                disabled={isUploading}
                className="h-1.5 flex-1 cursor-pointer accent-purple-600"
              />
              <button
                type="button"
                onClick={() => {
                  setZoom(1)
                  setPan({ x: 0, y: 0 })
                }}
                title="Reset zoom & position"
                disabled={isUploading}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              disabled={isUploading}
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <Button
              onClick={handleSave}
              disabled={isUploading || !loadedImage}
              className="rounded-xl bg-purple-600 text-white hover:bg-purple-700"
            >
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Uploading...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Check className="h-4 w-4" />
                  <span>Save & Apply</span>
                </div>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
