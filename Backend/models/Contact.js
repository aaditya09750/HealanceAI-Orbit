import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    // Public contact form (no auth required)
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['new', 'in-progress', 'resolved', 'closed'],
      default: 'new',
    },
  },
  {
    timestamps: true,
  }
);

const supportTicketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    subject: {
      type: String,
      enum: ['General Inquiry', 'Technical Issue', 'Billing Question', 'Feature Request'],
      required: true,
    },
    message: { type: String, required: true },
    attachments: [
      {
        filename: String,
        path: String,
        mimetype: String,
      },
    ],
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    adminNotes: String,
  },
  {
    timestamps: true,
  }
);

supportTicketSchema.index({ user: 1, status: 1 });

export const Contact = mongoose.model('Contact', contactSchema);
export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
