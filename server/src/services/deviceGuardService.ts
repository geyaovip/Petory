import { prisma } from '../lib/prisma.js'

export async function assertDeviceAllowed(
  userId: string,
  localDeviceId?: string | null
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  const id = localDeviceId?.trim()
  if (!id) return { ok: true }

  const device = await prisma.device.findUnique({
    where: { userId_localDeviceId: { userId, localDeviceId: id } }
  })
  if (!device) return { ok: true }

  if (device.flagged) {
    return {
      ok: false,
      code: 'DEVICE_FLAGGED',
      message: '该设备已被限制使用，请联系客服。'
    }
  }

  return { ok: true }
}
