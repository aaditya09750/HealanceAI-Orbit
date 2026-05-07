import { Contact, SupportTicket } from '../models/Contact.js';
import Notification from '../models/Notification.js';
import sendEmail from '../utils/sendEmail.js';

// @desc    Submit public contact form
// @route   POST /api/contact
// @access  Public
export const submitContactForm = async (req, res) => {
  try {
    const { firstName, lastName, name, email, message } = req.body;

    const trimmedName = (name || '').trim();
    const derivedFirstName =
      (firstName || '').trim() || (trimmedName ? trimmedName.split(/\s+/)[0] : 'Guest');
    const derivedLastName =
      (lastName || '').trim() || (trimmedName ? trimmedName.split(/\s+/).slice(1).join(' ') : '');
    const adminRecipient = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

    if (!email || !message || !derivedFirstName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const contact = await Contact.create({
      firstName: derivedFirstName,
      lastName: derivedLastName,
      email,
      message,
    });

    let emailDelivered = true;

    // Send confirmation email to user
    try {
      const userHtml = `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0ea5e9, #14b8a6); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Message Received! ✉️</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
            <p>Hi <strong>${derivedFirstName}</strong>,</p>
            <p>Thank you for contacting Healance AI. We have received your message and will get back to you within 24 hours.</p>
            <p><strong>Your message:</strong></p>
            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin: 15px 0;">
              ${message}
            </div>
            <p>Best regards,<br><strong>The Healance Team</strong></p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">
              © ${new Date().getFullYear()} Healance AI. BKC, Bandra East, Mumbai, Maharashtra
            </p>
          </div>
        </div>
      `;
      await sendEmail({
        to: email,
        subject: 'We received your message - Healance AI',
        html: userHtml,
      });

      // Send notification to admin
      const adminHtml = `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #1e293b; padding: 20px; border-radius: 16px 16px 0 0;">
            <h2 style="color: white; margin: 0;">📬 New Contact Form Submission</h2>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
            <p><strong>From:</strong> ${derivedFirstName} ${derivedLastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
              ${message}
            </div>
            <p style="margin-top: 20px; color: #64748b; font-size: 12px;">
              Submitted on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </p>
          </div>
        </div>
      `;
      if (adminRecipient) {
        await sendEmail({
          to: adminRecipient,
          subject: `New Contact: ${derivedFirstName} ${derivedLastName}`.trim(),
          html: adminHtml,
          replyTo: email,
        });
      }
    } catch (emailError) {
      emailDelivered = false;
      console.error('Email sending failed:', emailError.message);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: emailDelivered
        ? 'Your message has been sent successfully! We will get back to you soon.'
        : 'Your request was saved, but email delivery failed. Please check server email settings.',
      emailDelivered,
      contact,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit support ticket (dashboard)
// @route   POST /api/contact/ticket
// @access  Private
export const submitSupportTicket = async (req, res) => {
  try {
    const { fullName, email, subject, message } = req.body;

    if (!fullName || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and message are required',
      });
    }

    const ticketData = {
      user: req.user._id,
      fullName,
      email,
      subject: subject || 'General Inquiry',
      message,
    };

    // Handle file attachments. file.path is now a Cloudinary HTTPS URL.
    if (req.files && req.files.length > 0) {
      ticketData.attachments = req.files.map((file) => ({
        filename: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
      }));
    }

    const ticket = await SupportTicket.create(ticketData);
    const ticketId = ticket._id.toString().slice(-6).toUpperCase();

    // Send notification in-app
    await Notification.create({
      user: req.user._id,
      title: 'Support Ticket Created',
      message: `Your ticket #${ticketId} has been submitted. We'll respond within 24 hours.`,
      type: 'system',
    });

    // Send confirmation email to user
    try {
      const userHtml = `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0ea5e9, #14b8a6); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Ticket Submitted! 🎫</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
            <p>Hi <strong>${fullName}</strong>,</p>
            <p>Your support ticket has been successfully submitted. Here are the details:</p>

            <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Ticket ID:</strong> #${ticketId}</p>
              <p style="margin: 0 0 10px 0;"><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
              <p style="margin: 0 0 10px 0;"><strong>Status:</strong> <span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Open</span></p>
              <p style="margin: 0;"><strong>Message:</strong></p>
              <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; margin-top: 10px; color: #475569;">
                ${message}
              </div>
            </div>

            <p>Our support team will review your request and respond within 24 hours. You can track the status in your dashboard.</p>

            <p>Best regards,<br><strong>Healance Support Team</strong></p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #94a3b8; font-size: 12px;">
              📧 support@healance.ai | 📞 +91 84335 09521<br>
              © ${new Date().getFullYear()} Healance AI. BKC, Bandra East, Mumbai, Maharashtra
            </p>
          </div>
        </div>
      `;
      await sendEmail({
        to: email,
        subject: `Support Ticket #${ticketId} Received - Healance`,
        html: userHtml,
      });

      // Send notification to admin/support team
      const adminHtml = `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #dc2626; padding: 20px; border-radius: 16px 16px 0 0;">
            <h2 style="color: white; margin: 0;">🎫 New Support Ticket #${ticketId}</h2>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
            <p><strong>From:</strong> ${fullName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
            <p><strong>Message:</strong></p>
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
              ${message}
            </div>
            ${ticketData.attachments ? `<p><strong>Attachments:</strong> ${ticketData.attachments.length} file(s)</p>` : ''}
            <p style="margin-top: 20px; color: #64748b; font-size: 12px;">
              Submitted on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </p>
          </div>
        </div>
      `;
      const adminRecipient = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
      if (adminRecipient) {
        await sendEmail({
          to: adminRecipient,
          subject: `[TICKET] #${ticketId} - ${subject || 'General Inquiry'}`,
          html: adminHtml,
          replyTo: email,
        });
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: `Support ticket #${ticketId} submitted successfully! Check your email for confirmation.`,
      ticket,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's support tickets
// @route   GET /api/contact/tickets
// @access  Private
export const getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all contacts (admin)
// @route   GET /api/contact/admin/contacts
// @access  Private/Admin
export const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all support tickets (admin)
// @route   GET /api/contact/admin/tickets
// @access  Private/Admin
export const getAllTickets = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const tickets = await SupportTicket.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update ticket status (admin)
// @route   PUT /api/contact/admin/tickets/:id
// @access  Private/Admin
export const updateTicketStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status, adminNotes },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Notify user
    await Notification.create({
      user: ticket.user,
      title: 'Ticket Status Updated',
      message: `Your support ticket status has been updated to: ${status}`,
      type: 'system',
    });

    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
