import { PrismaClient } from '@prisma/client'
import { prismaX } from '@src/_helper/pagination'
import express from 'express'
import has from 'lodash/has'
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

router.post('/config/update', async (req, res: any) => {
  const body = req?.body || {}
  const data: any = {}
  if (has(body, 'phone')) {
    data.phone = body?.phone
  }
  if (has(body, 'email')) {
    data.email = body?.email
  }
  if (has(body, 'address')) {
    data.address = body?.address
  }
  if (has(body, 'home_title')) {
    data.home_title = body?.home_title
  }
  if (has(body, 'home_description')) {
    data.home_description = body?.home_description
  }
  if (has(body, 'about_title')) {
    data.about_title = body?.about_title
  }
  if (has(body, 'about_description')) {
    data.about_description = body?.about_description
  }
  try {
    const result = await prisma.config.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    })
    return res
      .status(200)
      .json({ status: 'success', message: 'Configuration successfully updated', data: result })
  } catch (err) {
    return res.status(400).json({ status: 'failed', message: err })
  }
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
