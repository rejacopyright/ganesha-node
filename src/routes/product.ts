import { PrismaClient } from '@prisma/client'
import express from 'express'
import { prismaX } from '@helper/pagination'
import keyBy from 'lodash/keyBy'
import mapValues from 'lodash/mapValues'
import { z } from 'zod'
import AuthMiddleWare from '@src/middleware/auth'
import { getServer } from '@src/_helper/function'
import fs from 'fs'
import moment from 'moment-timezone'

const router = express.Router()

const prisma = new PrismaClient({
  omit: {
    user: {
      password: true,
    },
  },
})

export const CreateCategoryValidator = z.object({
  name: z.string({ required_error: 'Name is required' }).min(1, 'Name is required'),
})

// ========================== CATEGORY ==========================

// Get Product Category
router.get('/category', async (req: any, res: any) => {
  try {
    const q = req?.query?.q || ''
    const page = Number(req?.query?.page) || 1
    const limit = Number(req?.query?.limit) || 10
    const data = await prismaX.product_category.paginate({
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

// Get Detail Category
router.get('/category/:id/detail', async (req: any, res: any) => {
  try {
    const { id } = req?.params
    const data = await prisma.product_category.findUnique({ where: { id: id } })
    return res.status(200).json(data)
  } catch (err: any) {
    return res.status(400).json({ status: 'failed', message: err })
  }
})

// Create Product Category
router.post('/category/create', AuthMiddleWare, async (req: any, res: any) => {
  const { name, description } = req?.body

  try {
    const data = await prisma.product_category.create({
      data: CreateCategoryValidator.passthrough().parse({ name, description }),
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

// Update Product Category
router.put('/category/:id/update', AuthMiddleWare, async (req: any, res: any) => {
  const { name, description } = req?.body
  const { id } = req?.params

  try {
    const data = await prisma.product_category.update({
      where: { id },
      data: CreateCategoryValidator.partial().passthrough().parse({ name, description }),
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

// Delete Product Category
router.delete('/category/:id/delete', AuthMiddleWare, async (req: any, res: any) => {
  const { id } = req?.params

  try {
    const data = await prisma.product_category.delete({ where: { id } })
    return res
      .status(200)
      .json({ status: 'success', message: 'Product successfully removed', data })
  } catch (err: any) {
    const keyByErrors = keyBy(err?.errors, 'path.0')
    const errors = mapValues(keyByErrors, 'message')
    return res.status(400).json({ status: 'failed', message: errors })
  }
})

// ========================== PRODUCT ==========================

export const CreateProductValidator = z.object({
  name: z.string({ required_error: 'Name is required' }).min(1, 'Name is required'),
})

// Get Product List
router.get('/', async (req: any, res: any) => {
  const server = getServer(req)
  try {
    const q = req?.query?.q || ''
    const category_id = req?.query?.category_id || ''
    const page = Number(req?.query?.page) || 1
    const limit = Number(req?.query?.limit) || 10
    const data = await prismaX.product.paginate({
      page,
      limit,
      where: {
        AND: [{ ...(category_id ? { category_id } : {}) }],
        OR: [
          { name: { contains: q?.toString(), mode: 'insensitive' } },
          { description: { contains: q?.toString(), mode: 'insensitive' } },
        ],
      },
      include: { category: true },
      orderBy: { updated_at: 'desc' },
    })
    data.data = data?.data?.map((item) => {
      const newItem = item
      newItem.image = item?.image ? `${server}/static/images/product/${item?.image}` : null
      return newItem
    })
    return res.status(200).json({ ...data })
  } catch (err: any) {
    return res.status(400).json({ status: 'failed', message: err })
  }
})

// Get Detail Product
router.get('/:id/detail', async (req: any, res: any) => {
  const server = getServer(req)
  try {
    const { id } = req?.params
    const data = await prisma.product.findUnique({ where: { id: id }, include: { category: true } })
    const newData: any = data || {}
    newData.image = data?.image ? `${server}/static/images/product/${data?.image}` : null
    return res.status(200).json(newData)
  } catch (err: any) {
    return res.status(400).json({ status: 'failed', message: err })
  }
})

// Create Product
router.post('/create', AuthMiddleWare, async (req: any, res: any) => {
  const { category_id, name, description, image, tags } = req?.body

  try {
    let filename, dir, base64Data
    if (image) {
      dir = 'public/images/product'
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
      }
      const base64 = image?.split(',')
      const base64Ext = base64?.[0]?.toLowerCase()
      base64Data = base64?.[1]
      let ext = 'png'
      // var base64_buffer = Buffer.from(base64, 'base64')
      if (base64Ext?.indexOf('jpeg') !== -1) {
        ext = 'jpg'
      }

      filename = `${moment().format('YYYYMMDDHHmmss')}.${ext}`
    }

    const data = await prisma.product.create({
      data: CreateProductValidator.passthrough().parse({
        category_id: category_id && category_id !== 'all' ? category_id : null,
        name,
        description,
        image: filename,
        tags,
      }),
    })

    if (image && filename) {
      fs.writeFile(`${dir}/${filename}`, base64Data, 'base64', () => '')
    }

    return res
      .status(200)
      .json({ status: 'success', message: 'Product successfully created', data })
  } catch (err: any) {
    const keyByErrors = keyBy(err?.errors, 'path.0')
    const errors = mapValues(keyByErrors, 'message')
    return res.status(400).json({ status: 'failed', message: errors })
  }
})

// Update Product
router.put('/:id/update', AuthMiddleWare, async (req: any, res: any) => {
  const { category_id, name, description, image, isImageChanged, tags } = req?.body
  const { id } = req?.params

  try {
    let filename, dir, base64Data
    if (isImageChanged) {
      dir = 'public/images/product'
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
      }
      const thisProduct = await prisma.product.findUnique({ where: { id } })
      if (thisProduct?.image) {
        const filename = `${dir}/${thisProduct?.image}`
        if (fs.existsSync(filename)) {
          fs.unlink(filename, () => '')
        }
      }
      if (image) {
        const base64 = image?.split(',')
        const base64Ext = base64?.[0]?.toLowerCase()
        base64Data = base64?.[1]
        let ext = 'png'
        // var base64_buffer = Buffer.from(base64, 'base64')
        if (base64Ext?.indexOf('jpeg') !== -1) {
          ext = 'jpg'
        }

        filename = `${moment().format('YYYYMMDDHHmmss')}.${ext}`
      } else {
        filename = null
      }
    }
    const data = await prisma.product.update({
      where: { id },
      data: CreateProductValidator.partial()
        .passthrough()
        .parse({
          category_id: category_id && category_id !== 'all' ? category_id : null,
          name,
          description,
          image: filename,
          tags,
        }),
    })

    if (image && filename) {
      fs.writeFile(`${dir}/${filename}`, base64Data, 'base64', () => '')
    }

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
router.delete('/:id/delete', AuthMiddleWare, async (req: any, res: any) => {
  const { id } = req?.params

  try {
    const dir = 'public/images/product'
    const thisProduct = await prisma.product.findUnique({ where: { id } })
    if (thisProduct?.image) {
      const filename = `${dir}/${thisProduct?.image}`
      if (fs.existsSync(filename)) {
        fs.unlink(filename, () => '')
      }
    }
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
