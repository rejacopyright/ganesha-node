import { PrismaClient } from '@prisma/client'
import express from 'express'
import { sendMail } from '@helper/mail'
import { paginate, prismaX } from '@helper/pagination'
import moment from 'moment-timezone'
import fs from 'fs'

const router = express.Router()

const prisma = new PrismaClient({
  omit: {
    user: {
      password: true,
    },
  },
})

router.get('/test', async (req: any, res: any) => {
  const { user } = req
  const data = await prismaX.user.paginate({
    page: 2,
    limit: 3,
    where: { first_name: { contains: '3' } },
    include: { religion: true },
  })
  return res.status(200).json(data)
})

router.get('/me', async (req: any, res: any) => {
  const { user } = req
  const data = await prisma.user.findUnique({
    where: { id: user?.id },
  })
  return res.status(200).json(data)
})

export default router
