// npx ts-node prisma/seeders/100.user.seed.ts

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
async function main() {
  const john = await prisma.user.upsert({
    where: { email: 'admin@email.com' },
    update: {},
    create: {
      role_id: 4,
      email: 'admin@email.com',
      username: 'admin',
      password: await bcrypt.hash('Test@123', 10),
      first_name: 'Super',
      last_name: 'Admin',
      phone: '123',
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
