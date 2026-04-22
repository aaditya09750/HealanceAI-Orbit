import express from 'express';
import {
  submitContactForm,
  submitSupportTicket,
  getMyTickets,
  getAllContacts,
  getAllTickets,
  updateTicketStatus,
} from '../controllers/contactController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public
router.post('/', submitContactForm);

// Protected (logged-in users)
router.post('/ticket', protect, upload.array('attachments', 5), submitSupportTicket);
router.get('/tickets', protect, getMyTickets);

// Admin
router.get('/admin/contacts', protect, admin, getAllContacts);
router.get('/admin/tickets', protect, admin, getAllTickets);
router.put('/admin/tickets/:id', protect, admin, updateTicketStatus);

export default router;
