import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import * as svc from '../services/itemMasterService.js';

const router = Router();

router.get('/', async (req, res) => {
  const { item_type, is_active } = req.query;
  const items = await svc.list({ 
    item_type, 
    is_active: is_active !== undefined ? is_active === 'true' : undefined 
  });
  res.json(items);
});

router.get('/sku/:sku', async (req, res) => {
  const item = await svc.getBySku(req.params.sku);
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json(item);
});

router.get('/:id', async (req, res) => {
  const item = await svc.getById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json(item);
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

