import { PrismaClient } from '@prisma/client'
import { paginate, prismaX } from '@src/_helper/pagination'
import express from 'express'
import crypto from 'crypto'
import moment from 'moment-timezone'
const router = express.Router()

const prisma = new PrismaClient()

router.get('/', async (req, res: any, next) => {
  const test = moment().format('yyyy-MM-DD HH:mm:ss ZZ')
  const phoneStr = '085766666393'
  const phone = { sliced: phoneStr?.slice(-10), ln: phoneStr?.length }
  return res.status(200).json({ oke: 'okelah7', test, phone })
})

router.get('/generate', async (req, res: any, next) => {
  const data = crypto.randomBytes(64).toString('hex')
  return res.status(200).json(data)
})

export default router
