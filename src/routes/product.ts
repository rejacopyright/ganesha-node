import { PrismaClient } from '@prisma/client'
import express from 'express'
import { prismaX } from '@helper/pagination'
import keyBy from 'lodash/keyBy'
import mapValues from 'lodash/mapValues'
import { z } from 'zod'

const router = express.Router()

const prisma = new PrismaClient({
  omit: {
    user: {
      password: true,
    },
  },
})

export const CreateProductValidator = z.object({
  name: z.string({ required_error: 'Name is required' }).min(1, 'Name is required'),
})

// Get Product List
router.get('/', async (req: any, res: any) => {
  try {
    const q = req?.query?.q || ''
    const page = Number(req?.query?.page) || 1
    const limit = Number(req?.query?.limit) || 10
    const data = await prismaX.product.paginate({
      page,
      limit,
      where: {
        // AND: [{}],
        OR: [
          { name: { contains: q?.toString(), mode: 'insensitive' } },
          { description: { contains: q?.toString(), mode: 'insensitive' } },
        ],
      },
      // orderBy: { updated_at: 'desc' },
    })
    return res.status(200).json(data)
  } catch (err: any) {
    return res.status(400).json({ status: 'failed', message: err })
  }
})

// Get Detail Product
router.get('/:id/detail', async (req: any, res: any) => {
  try {
    const { id } = req?.params
    const data = await prisma.product.findUnique({ where: { id: id } })
    return res.status(200).json(data)
  } catch (err: any) {
    return res.status(400).json({ status: 'failed', message: err })
  }
})

// Create Product
router.post('/create', async (req: any, res: any) => {
  const { name, description } = req?.body

  try {
    const data = await prisma.product.create({
      data: CreateProductValidator.passthrough().parse({ name, description }),
    })

    return res
      .status(200)
      .json({ status: 'success', message: 'Product successfully created', data })
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

// Update Product
router.put('/:id/update', async (req: any, res: any) => {
  const { name, description } = req?.body
  const { id } = req?.params

  try {
    const data = await prisma.product.update({
      where: { id },
      data: CreateProductValidator.partial().passthrough().parse({ name, description }),
    })

    return res
      .status(200)
      .json({ status: 'success', message: 'Product successfully changed', data })
  } catch (err: any) {
    const keyByErrors = keyBy(err?.errors, 'path.0')
    const errors = mapValues(keyByErrors, 'message')
    return res.status(400).json({ status: 'failed', message: errors })
  }
})

// Delete Product
router.delete('/:id/delete', async (req: any, res: any) => {
  const { id } = req?.params

  try {
    const data = await prisma.product.delete({ where: { id } })
    return res
      .status(200)
      .json({ status: 'success', message: 'Product successfully removed', data })
  } catch (err: any) {
    const keyByErrors = keyBy(err?.errors, 'path.0')
    const errors = mapValues(keyByErrors, 'message')
    return res.status(400).json({ status: 'failed', message: errors })
  }
})

export default router
