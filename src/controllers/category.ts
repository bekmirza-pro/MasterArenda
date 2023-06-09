
import { NextFunction, Request, Response } from 'express'
import { logger } from '../config/logger'
import { storage } from '../storage/main'
import AppError from '../utils/appError'
import catchAsync from '../utils/catchAsync'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import sharp from 'sharp'
import { unlink } from 'fs/promises'
import { message } from '../locales/get_message'
import Category from '../models/Category'

export class CategoryController {
    getAll = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const { lang } = res.locals
        const { id } = req.params
        if (id) {
            req.query = {
                category: id
            }
        }

        const categorys = await storage.category.find(req.query)

        res.status(200).json({
            success: true,
            data: {
                categorys
            },
            message: message('category_getAll_200', lang)
        })
    })

    get = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const category = await storage.category.findOne({ _id: req.params.id })

        res.status(200).json({
            success: true,
            data: {
                category
            }
        })
    })

    create = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        let photo
        // await storage.category.update(req.body.category, {})
        
        if (req.file) {
            photo = `${req.file.fieldname}-${uuidv4()}`

            await sharp(req.file.buffer)
                .jpeg()
                .toFile(path.join(__dirname, '../../uploads/images', `${photo}.jpg`))
        }
        const category = await storage.category.create({
            ...req.body,
            images: `${photo}.jpg`
        })

        res.status(201).json({
            success: true,
            data: {
                category
            }
        })
    })

    update = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        let photo
        let category
        
        if (req.file) {
            const categorys = await Category.findById(req.params.id)

            if (`${categorys?.images}` !== 'undefined') {
                await unlink(path.join(__dirname, '../../uploads', `${categorys?.images}`))
            }

            photo = `images/${req.file.fieldname}-${uuidv4()}`

            await sharp(req.file.buffer)
                .png()
                .toFile(path.join(__dirname, '../../uploads', `${photo}.png`))

            category = await storage.category.update(req.params.id, {
                ...req.body,
                images: `${photo}.png`
            })
        } else {
            category = await storage.category.update(req.params.id, req.body)
        }

        res.status(200).json({
            success: true,
            data: {
                category
            }
        })
    })

    delete = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const category = await Category.findById(req.params.id)

        if (`${category?.images}` !== 'undefined') {
            await unlink(path.join(__dirname, '../../uploads', `${category?.images}`))
        }

        await storage.category.delete(req.params.id)
        res.status(204).json({
            success: true,
            data: null
        })
    })
}
