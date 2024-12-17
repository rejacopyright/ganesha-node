import { PrismaClient } from '@prisma/client'
import express from 'express'
import { prismaX } from '@helper/pagination'
import moment from 'moment-timezone'
import keyBy from 'lodash/keyBy'
import mapValues from 'lodash/mapValues'
import fs from 'fs'
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

export const CreateBlogValidator = z.object({
  title: z.string({ required_error: 'Title is required' }).min(1, 'Title is required'),
})

// Get Blog List
router.get('/', async (req: any, res: any) => {
  const server = getServer(req)
  try {
    const user_id = req?.query?.user_id || ''
    const q = req?.query?.q || ''
    const page = Number(req?.query?.page) || 1
    const limit = Number(req?.query?.limit) || 10
    const data = await prismaX.blog.paginate({
      page,
      limit,
      where: {
        // AND: [{}],
        ...(user_id ? { user_id } : {}),
        OR: [
          { title: { contains: q?.toString(), mode: 'insensitive' } },
          { description: { contains: q?.toString(), mode: 'insensitive' } },
        ],
      },
      include: { user: true },
      orderBy: { updated_at: 'desc' },
    })
    data.data = data?.data?.map((item) => {
      const newItem = item
      newItem.image = item?.image ? `${server}/static/images/blog/${item?.image}` : null
      if (item?.user) {
        const user = item?.user
        newItem.user.full_name = user?.first_name
          ? `${user?.first_name} ${user?.last_name}`
          : user?.username
      }
      return newItem
    })
    return res.status(200).json({ ...data })
  } catch (err: any) {
    return res.status(400).json({ status: 'failed', message: err })
  }
})

// Get Detail Blog
router.get('/:id/detail', async (req: any, res: any) => {
  const server = getServer(req)
  try {
    const { id } = req?.params
    const data = await prisma.blog.findUnique({ where: { id: id }, include: { user: true } })
    const newData: any = data || {}
    newData.image = data?.image ? `${server}/static/images/blog/${data?.image}` : null
    if (data?.user) {
      const user = data?.user
      newData.user.full_name = user?.first_name
        ? `${user?.first_name} ${user?.last_name}`
        : user?.username
    }
    return res.status(200).json(newData)
  } catch (err: any) {
    return res.status(400).json({ status: 'failed', message: err })
  }
})

// Create Blog
router.post('/create', AuthMiddleWare, async (req: any, res: any) => {
  const { title, description, image, product_id, tags } = req?.body
  const user = req?.user

  try {
    let filename
    if (image) {
      const dir = 'public/images/blog'
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

    const data = await prisma.blog.create({
      data: CreateBlogValidator.passthrough().parse({
        user_id: user?.id,
        product_id: product_id && product_id !== 'all' ? product_id : null,
        title,
        description,
        image: filename,
        tags,
      }),
    })

    return res.status(200).json({ status: 'success', message: 'Blog successfully created', data })
  } catch (err: any) {
    const keyByErrors = keyBy(err?.errors, 'path.0')
    const errors = mapValues(keyByErrors, 'message')
    return res.status(400).json({ status: 'failed', message: errors })
  }
})

// Update Blog
router.put('/:id/update', AuthMiddleWare, async (req: any, res: any) => {
  const { title, description, image, isImageChanged, product_id, tags } = req?.body
  const { id } = req?.params
  const user = req?.user

  try {
    let filename
    if (isImageChanged) {
      const dir = 'public/images/blog'
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
      }
      const thisBlog = await prisma.blog.findUnique({ where: { id } })
      if (thisBlog?.image) {
        const filename = `${dir}/${thisBlog?.image}`
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
    const data = await prisma.blog.update({
      where: { id },
      data: CreateBlogValidator.partial()
        .passthrough()
        .parse({
          // user_id: user?.id,
          product_id: product_id && product_id !== 'all' ? product_id : null,
          title,
          description,
          image: filename,
          tags,
        }),
    })

    return res.status(200).json({ status: 'success', message: 'Blog successfully changed', data })
  } catch (err: any) {
    const keyByErrors = keyBy(err?.errors, 'path.0')
    const errors = mapValues(keyByErrors, 'message')
    return res.status(400).json({ status: 'failed', message: errors })
  }
})

// Delete Blog
router.delete('/:id/delete', AuthMiddleWare, async (req: any, res: any) => {
  const { id } = req?.params

  try {
    const dir = 'public/images/blog'
    const thisBlog = await prisma.blog.findUnique({ where: { id } })
    if (thisBlog?.image) {
      const filename = `${dir}/${thisBlog?.image}`
      if (fs.existsSync(filename)) {
        fs.unlink(filename, () => '')
      }
    }
    const data = await prisma.blog.delete({ where: { id } })
    return res.status(200).json({ status: 'success', message: 'Blog successfully removed', data })
  } catch (err: any) {
    const keyByErrors = keyBy(err?.errors, 'path.0')
    const errors = mapValues(keyByErrors, 'message')
    return res.status(400).json({ status: 'failed', message: errors })
  }
})

export default router
