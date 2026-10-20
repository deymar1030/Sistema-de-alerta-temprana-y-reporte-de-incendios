import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import type { ActionResult, PhotoData } from '../types'

const MAX_WEB_IMAGE_BYTES = 700 * 1024

const readFileDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result === 'string') resolve(reader.result)
    else reject(new Error('IMAGE_READ_FAILED'))
  }
  reader.onerror = () => reject(new Error('IMAGE_READ_FAILED'))
  reader.readAsDataURL(file)
})

const compressWebImage = async (source: string): Promise<string> => {
  const image = new Image()
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('IMAGE_DECODE_FAILED'))
    image.src = source
  })

  const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  const context = canvas.getContext('2d')
  if (!context) return source
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.72)
}

export const cameraService = {
  async capturePhoto(): Promise<ActionResult<PhotoData>> {
    if (!Capacitor.isNativePlatform()) return { ok: false, error: 'UNSUPPORTED' }

    try {
      const photo = await Camera.getPhoto({
        quality: 70,
        width: 1280,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
      })
      if (!photo.dataUrl) return { ok: false, error: 'FAILED' }
      return { ok: true, data: { dataUrl: photo.dataUrl, format: photo.format } }
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : ''
      return { ok: false, error: message.includes('cancel') ? 'CANCELLED' : 'FAILED' }
    }
  },

  async readWebFile(file: File): Promise<ActionResult<PhotoData>> {
    if (!file.type.startsWith('image/')) return { ok: false, error: 'FAILED' }
    try {
      const original = await readFileDataUrl(file)
      if (file.size <= MAX_WEB_IMAGE_BYTES) {
        return { ok: true, data: { dataUrl: original, format: file.type || 'image/jpeg' } }
      }
      return { ok: true, data: { dataUrl: await compressWebImage(original), format: 'image/jpeg' } }
    } catch {
      return { ok: false, error: 'FAILED' }
    }
  },
}
