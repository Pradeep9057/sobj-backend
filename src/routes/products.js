import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import * as svc from '../services/productService.js';

const router = Router();

router.get('/', async (req, res) => {
  const { category, metal, sort, min, max } = req.query;
  const products = await svc.list({ category, metal, sort, min, max });
  res.json(products);
});

router.get('/:id', async (req, res) => {
  const product = await svc.getById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Not found' });
  res.json(product);
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const created = await svc.create(req.body);
    res.status(201).json(created);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const updated = await svc.update(req.params.id, req.body);
    res.json(updated);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  await svc.remove(req.params.id);
  res.json({ ok: true });
});

export default router;


