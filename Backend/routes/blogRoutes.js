import express from 'express';
import {
  getBlogs,
  getBlog,
  getTrendingBlogs,
  getCategories,
  createBlog,
  updateBlog,
  deleteBlog,
  likeBlog,
} from '../controllers/blogController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/categories', getCategories);
router.get('/trending', getTrendingBlogs);
router.get('/', getBlogs);
router.get('/:identifier', getBlog);

// Protected routes
router.post('/:id/like', protect, likeBlog);

// Admin routes
router.post('/', protect, admin, createBlog);
router.put('/:id', protect, admin, updateBlog);
router.delete('/:id', protect, admin, deleteBlog);

export default router;
