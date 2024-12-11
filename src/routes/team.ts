import { PrismaClient } from '@prisma/client'
import express from 'express'
import { sendMail } from '@helper/mail'
import { paginate, prismaX } from '@helper/pagination'
import moment from 'moment-timezone'
import keyBy from 'lodash/keyBy'
import mapValues from 'lodash/mapValues'
import fs from 'fs'
import { z } from 'zod'
import { getServer } from '@src/_helper/function'

const router = express.Router()

const prisma = new PrismaClient({
  omit: {
    user: {
      password: true,
    },
  },
})

export const CreateTeamValidator = z.object({
  full_name: z.string({ required_error: 'Name is required' }).min(1, 'Name is required'),
  title: z.string({ required_error: 'Title is required' }).min(1, 'Title is required'),
  email: z.string({ required_error: 'Email is required' }).min(1, 'Email is required'),
  phone: z.string({ required_error: 'Phone is required' }).min(1, 'Phone is required'),
  gender: z.number().optional(),
  category: z.string().nullish(),
  avatar: z.string().nullish(),
  // social: z.object(),
})

// Get Team List
router.get('/', async (req: any, res: any) => {
  const server = getServer(req)
  console.log(`${server}/static/images/team/`)
  try {
    const q = req?.query?.q || ''
    const page = Number(req?.query?.page) || 1
    const limit = Number(req?.query?.limit) || 10
    const data = await prismaX.team.paginate({
      page,
      limit,
      where: {
        // AND: [{}],
        OR: [
          {
            full_name: { contains: q?.toString(), mode: 'insensitive' },
          },
        ],
      },
      // orderBy: { updated_at: 'desc' },
    })
    data.data = data?.data?.map((item) => {
      const newItem = item
      newItem.avatar = item?.avatar ? `${server}/static/images/team/${item?.avatar}` : null
      return newItem
    })
    return res.status(200).json({ ...data })
  } catch (err: any) {
    return res.status(400).json({ status: 'failed', message: err })
  }
})

// Get Detail Team
router.get('/:id/detail', async (req: any, res: any) => {
  const server = getServer(req)
  try {
    const { id } = req?.params
    const data = await prisma.team.findUnique({ where: { id: id } })
    const newData: any = data || {}
    newData.avatar = data?.avatar ? `${server}/static/images/team/${data?.avatar}` : null
    return res.status(200).json(newData)
  } catch (err: any) {
    return res.status(400).json({ status: 'failed', message: err })
  }
})

// Create Team
router.post('/create', async (req: any, res: any) => {
  const { full_name, title, gender, social, email, phone, image, category } = req?.body

  try {
    let filename
    if (image) {
      const dir = 'public/images/team'
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
      }
      const base64 = image?.split(',')
      const base64Ext = base64?.[0]?.toLowerCase()
      const base64Data = base64?.[1]
      let ext = 'png'
      // var base64_buffer = Buffer.from(base64, 'base64')
      if (base64Ext?.indexOf('jpeg') !== -1) {
        ext = 'jpg'
      }

      filename = `${moment().format('YYYYMMDDHHmmss')}.${ext}`
      fs.writeFile(`${dir}/${filename}`, base64Data, 'base64', () => '')
    }

    const data = await prisma.team.create({
      data: CreateTeamValidator.passthrough().parse({
        full_name,
        title,
        gender,
        category,
        avatar: filename,
        email,
        phone,
        social,
      }),
    })

    return res.status(200).json({ status: 'success', message: 'Team successfully created', data })
  } catch (err: any) {
    const keyByErrors = keyBy(err?.errors, 'path.0')
    const errors = mapValues(keyByErrors, 'message')
    return res.status(400).json({ status: 'failed', message: errors })
  }
})

// Update Team
router.put('/:id/update', async (req: any, res: any) => {
  const { full_name, title, gender, social, email, phone, image, category, isImageChanged } =
    req?.body
  const { id } = req?.params

  try {
    let filename
    if (isImageChanged) {
      const dir = 'public/images/team'
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
      }
      const thisTeam = await prisma.team.findUnique({ where: { id } })
      if (thisTeam?.avatar) {
        const filename = `${dir}/${thisTeam?.avatar}`
        if (fs.existsSync(filename)) {
          fs.unlink(filename, () => '')
        }
      }
      if (image) {
        const base64 = image?.split(',')
        const base64Ext = base64?.[0]?.toLowerCase()
        const base64Data = base64?.[1]
        let ext = 'png'
        // var base64_buffer = Buffer.from(base64, 'base64')
        if (base64Ext?.indexOf('jpeg') !== -1) {
          ext = 'jpg'
        }

        filename = `${moment().format('YYYYMMDDHHmmss')}.${ext}`
        fs.writeFile(`${dir}/${filename}`, base64Data, 'base64', () => '')
      } else {
        filename = null
      }
    }
    const data = await prisma.team.update({
      where: { id },
      data: CreateTeamValidator.partial().passthrough().parse({
        full_name,
        title,
        gender,
        category,
        avatar: filename,
        email,
        phone,
        social,
      }),
    })

    return res.status(200).json({ status: 'success', message: 'Team successfully changed', data })
  } catch (err: any) {
    const keyByErrors = keyBy(err?.errors, 'path.0')
    const errors = mapValues(keyByErrors, 'message')
    return res.status(400).json({ status: 'failed', message: errors })
  }
})

// Delete Team
router.delete('/:id/delete', async (req: any, res: any) => {
  const { id } = req?.params

  try {
    const dir = 'public/images/team'
    const thisTeam = await prisma.team.findUnique({ where: { id } })
    if (thisTeam?.avatar) {
      const filename = `${dir}/${thisTeam?.avatar}`
      if (fs.existsSync(filename)) {
        fs.unlink(filename, () => '')
      }
    }
    const data = await prisma.team.delete({ where: { id } })
    return res.status(200).json({ status: 'success', message: 'Team successfully removed', data })
  } catch (err: any) {
    const keyByErrors = keyBy(err?.errors, 'path.0')
    const errors = mapValues(keyByErrors, 'message')
    return res.status(400).json({ status: 'failed', message: errors })
  }
})

export default router
