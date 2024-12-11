import { PrismaClient } from '@prisma/client'
import { prismaX } from '@src/_helper/pagination'
import express from 'express'
import moment from 'moment-timezone'

const router = express.Router()

const prisma = new PrismaClient({
  omit: {
    user: {
      password: true,
    },
  },
})

router.get('/config', async (req: any, res: any) => {
  const data = await prisma.config.findFirst()
  return res.status(200).json(data)
})

router.get('/province', async (req, res: any) => {
  const q = req?.query?.q || ''
  const page = Number(req?.query?.page) || 1
  const limit = Number(req?.query?.limit) || 10
  const data = await prismaX.province.paginate({
    page,
    limit,
    where: {
      OR: [
        {
          name: { contains: q?.toString(), mode: 'insensitive' },
        },
      ],
    },
  })

  return res.status(200).json({ test: moment().add(1, 'months').toISOString(), data })
})

router.get('/city', async (req, res: any, next) => {
  const q = req?.query?.q || ''
  const province_id = Number(req?.query?.province_id) || ''
  const page = Number(req?.query?.page) || 1
  const limit = Number(req?.query?.limit) || 10
  const data = await prismaX.city.paginate({
    page,
    limit,
    where: {
      AND: [{ province_id }],
      OR: [
        {
          name: { contains: q?.toString(), mode: 'insensitive' },
        },
      ],
    },
  })

  return res.status(200).json({ test: moment().add(1, 'months').toISOString(), data })
})

export default router
