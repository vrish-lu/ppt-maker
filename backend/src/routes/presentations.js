import express from 'express';
import {
  createPresentation,
  getPresentations,
  getPresentationById,
  updatePresentation,
  deletePresentation,
  addImageToPresentation,
  getPresentationImages
} from '../controllers/presentationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All presentation routes require authentication
router.use(authenticateToken);

// CRUD operations
router.post('/', createPresentation);
router.get('/', getPresentations);
router.get('/:id', getPresentationById);
router.put('/:id', updatePresentation);
router.delete('/:id', deletePresentation);

// Image operations
router.post('/:presentationId/slides/:slideId/images', addImageToPresentation);
router.get('/:presentationId/images', getPresentationImages);

export default router; 