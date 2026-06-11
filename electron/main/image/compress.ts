import sharp from 'sharp'
import { MAX_IMAGE_EDGE } from '../../../src/shared/constants'

export async function compressImage(input: Buffer): Promise<Buffer> {
  const image = sharp(input)
  const metadata = await image.metadata()
  const width = metadata.width ?? 0
  const height = metadata.height ?? 0
  const maxEdge = Math.max(width, height)

  if (maxEdge <= MAX_IMAGE_EDGE) {
    return image.png({ compressionLevel: 9 }).toBuffer()
  }

  const scale = MAX_IMAGE_EDGE / maxEdge
  const targetWidth = Math.round(width * scale)
  const targetHeight = Math.round(height * scale)

  return image
    .resize(targetWidth, targetHeight, { fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer()
}
