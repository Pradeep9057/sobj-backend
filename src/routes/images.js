import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middlewares/auth.js'
import * as imageService from '../services/imageService.js'

const router = Router()

// Product Images
router.get('/products/:productId', async (req, res) => {
  try {
    const images = await imageService.getProductImages(req.params.productId)
    res.json(images)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

router.post('/products/:productId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { image_url, display_order } = req.body
    const productId = req.params.productId
    
    if (!image_url || !image_url.trim()) {
      return res.status(400).json({ message: 'image_url is required' })
    }
    
    console.log(`📤 Received request to add image:`)
    console.log(`   - Product ID: ${productId}`)
    console.log(`   - Image URL: ${image_url}`)
    console.log(`   - Display Order: ${display_order !== undefined ? display_order : 'auto'}`)
    
    // Pass null for display_order to let the service calculate it automatically
    const image = await imageService.addProductImage(productId, image_url.trim(), display_order !== undefined ? display_order : null)
    
    console.log(`✅ Image added successfully:`)
    console.log(`   - Image ID: ${image.id}`)
    
    res.status(201).json(image)
  } catch (e) {
    console.error('❌ Error adding product image:', e)
    res.status(400).json({ message: e.message })
  }
})

router.put('/products/:imageId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const updated = await imageService.updateProductImage(req.params.imageId, req.body)
    res.json(updated)
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

router.delete('/products/:imageId', requireAuth, requireAdmin, async (req, res) => {
  try {
    await imageService.deleteProductImage(req.params.imageId)
    res.json({ message: 'Image deleted' })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

router.post('/products/:productId/reorder', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { imageIds } = req.body
    await imageService.reorderProductImages(req.params.productId, imageIds)
    res.json({ message: 'Images reordered' })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

// Website Images
router.get('/website', async (req, res) => {
  try {
    const { section } = req.query
    const images = await imageService.getWebsiteImages(section || null)
    res.json(images)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

router.post('/website', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { section, image_url, title, description, display_order } = req.body
    const image = await imageService.addWebsiteImage(section, image_url, title, description, display_order || 0)
    res.status(201).json(image)
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

router.put('/website/:imageId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const updated = await imageService.updateWebsiteImage(req.params.imageId, req.body)
    res.json(updated)
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

router.delete('/website/:imageId', requireAuth, requireAdmin, async (req, res) => {
  try {
    await imageService.deleteWebsiteImage(req.params.imageId)
    res.json({ message: 'Image deleted' })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

router.post('/website/:section/reorder', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { imageIds } = req.body
    await imageService.reorderWebsiteImages(req.params.section, imageIds)
    res.json({ message: 'Images reordered' })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

export default router

