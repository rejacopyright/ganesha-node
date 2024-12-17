import { PrismaClient } from '@prisma/client'
import express from 'express'
import { prismaX } from '@helper/pagination'
import keyBy from 'lodash/keyBy'
import mapValues from 'lodash/mapValues'
import { z } from 'zod'
import { getServer } from '@src/_helper/function'
import AuthMiddleWare from '@src/middleware/auth'

const router = express.Router()

const prisma = new PrismaClient({
  omit: {
    user: {
      password: true,
    },
  },
})

export const CreateTagValidator = z.object({
  name: z.string({ required_error: 'Name is required' }).min(1, 'Name is required'),
})

// Get Tag List
router.get('/', async (req: any, res: any) => {
  const server = getServer(req)
  try {
    const q = req?.query?.q || ''
    const page = Number(req?.query?.page) || 1
    const limit = Number(req?.query?.limit) || 10
    const data = await prismaX.tags.paginate({
      page,
      limit,
      where: {
        // AND: [{}],
        OR: [{ name: { contains: q?.toString(), mode: 'insensitive' } }],
      },
      // orderBy: { updated_at: 'desc' },
    })
    return res.status(200).json(data)
  } catch (err: any) {
    return res.status(400).json({ status: 'failed', message: err })
  }
})

// Get Detail Tag
router.get('/:id/detail', async (req: any, res: any) => {
  const server = getServer(req)
  try {
    const { id } = req?.params
    const data = await prisma.tags.findUnique({ where: { id: id } })
    return res.status(200).json(data)
  } catch (err: any) {
    return res.status(400).json({ status: 'failed', message: err })
  }
})

// Create Tag
router.post('/create', AuthMiddleWare, async (req: any, res: any) => {
  const { name } = req?.body

  try {
    const data = await prisma.tags.create({
      data: CreateTagValidator.passthrough().parse({ name }),
    })

    return res.status(200).json({ status: 'success', message: 'Tag successfully created', data })
  } catch (err: any) {
    if (err?.errors) {
      const keyByErrors = keyBy(err?.errors, 'path.0')
      const errors = mapValues(keyByErrors, 'message')
      return res.status(400).json({ status: 'failed', message: errors })
    } else if (err) {
      let message = err
      if (err?.code === 'P2002') {
        message = `${err?.meta?.target?.[0]} can't be duplicated`
      }
      return res.status(400).json({ status: 'failed', message })
    }
  }
})

// Update Tag
router.put('/:id/update', AuthMiddleWare, async (req: any, res: any) => {
  const { name } = req?.body
  const { id } = req?.params

  try {
    const data = await prisma.tags.update({
      where: { id },
      data: CreateTagValidator.partial().passthrough().parse({ name }),
    })

    return res.status(200).json({ status: 'success', message: 'Tag successfully changed', data })
  } catch (err: any) {
    const keyByErrors = keyBy(err?.errors, 'path.0')
    const errors = mapValues(keyByErrors, 'message')
    return res.status(400).json({ status: 'failed', message: errors })
  }
})

// Delete Tag
router.delete('/:id/delete', AuthMiddleWare, async (req: any, res: any) => {
  const { id } = req?.params

  try {
    const data = await prisma.tags.delete({ where: { id } })
    return res.status(200).json({ status: 'success', message: 'Tag successfully removed', data })
  } catch (err: any) {
    const keyByErrors = keyBy(err?.errors, 'path.0')
    const errors = mapValues(keyByErrors, 'message')
    return res.status(400).json({ status: 'failed', message: errors })
  }
})

export default router
