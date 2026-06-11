import { config } from '../src/config.js'
import { prisma } from '../src/lib/prisma.js'
import { hashPassword } from '../src/lib/password.js'

async function main() {
  const email = config.adminEmail
  const password = config.adminPassword
  const passwordHash = await hashPassword(password)
  const existing = await prisma.adminUser.findUnique({ where: { email } })

  if (existing) {
    await prisma.adminUser.update({
      where: { email },
      data: { passwordHash, status: 'active' }
    })
    console.info(`[petory] admin password reset: ${email}`)
  } else {
    await prisma.adminUser.create({
      data: { email, passwordHash, role: 'admin', status: 'active' }
    })
    console.info(`[petory] admin created: ${email}`)
  }
}

main()
  .catch((error) => {
    console.error('[petory] admin reset failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
