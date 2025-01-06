// npx ts-node prisma/seeders/3.product_category.seed.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const data = [
  { name: 'Smart Security' },
  { name: 'Data Protection' },
  { name: 'E-Certificate' },
  { name: 'Ransomware' },
]

async function main() {
  data?.map(async (item) => {
    await prisma.product_category.upsert({
      where: { name: item?.name },
      update: {},
      create: item,
    })
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
