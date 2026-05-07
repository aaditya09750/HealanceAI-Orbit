import React, { useState, useRef } from 'react';
import {
  Mail,
  Phone,
  Clock,
  MapPin,
  UploadCloud,
  Send,
  MessageSquare,
  Headphones,
  Loader2,
  X,
} from 'lucide-react';
import Button from '../../shared/ui/Button';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import DashReveal from '../../shared/ui/DashReveal';
import { API_URL } from '../../constants/config';

const DashboardContact = () => {
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => {
      const isValidType = ['image/png', 'image/jpeg', 'image/svg+xml', 'application/pdf'].includes(
        file.type
      );
      const isValidSize = file.size <= 10 * 1024 * 1024;
      return isValidType && isValidSize;
    });
    setAttachments((prev) => [...prev, ...validFiles].slice(0, 5));
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.message) {
      toast({ title: 'Please fill in all required fields', variant: 'error' });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast({ title: 'Please enter a valid email address', variant: 'error' });
      return;
    }

    setIsLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('fullName', formData.fullName);
      submitData.append('email', formData.email);
      submitData.append('subject', formData.subject);
      submitData.append('message', formData.message);

      attachments.forEach((file) => {
        submitData.append('attachments', file);
      });

      const response = await axios.post(`${API_URL}/contact/ticket`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

      if (response.data.success) {
        toast({
          title: 'Ticket submitted successfully',
          description: "We'll respond within 24 hours.",
          variant: 'success',
        });
        setFormData({
          fullName: '',
          email: '',
          subject: 'General Inquiry',
          message: '',
        });
        setAttachments([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        toast({ title: response.data.message || 'Something went wrong', variant: 'error' });
      }
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Failed to submit ticket', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        {/* <h2 className="text-xl sm:text-2xl font-heading font-bold text-[#0b1030]">Support Center</h2>
        <p className="text-sm sm:text-base text-[#5f697a]">Need help? Submit a ticket or contact our support team directly.</p> */}
      </div>

      <DashReveal className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column: Support Form */}
        <div className="lg:col-span-2">
          <div
            className="dash-card-static dash-card-accent h-full"
            style={{ '--accent-stripe': '#506cd7' }}
          >
            <h3 className="dash-heading text-base sm:text-lg mb-4 sm:mb-6 flex items-center gap-2">
              <div className="dash-icon-badge dash-icon-badge--gradient-indigo">
                <MessageSquare size={20} className="text-white" />
              </div>
              Submit a Request
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#0b1030] mb-1.5 sm:mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    autoComplete="off"
                    className="dash-input"
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0b1030] mb-1.5 sm:mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="off"
                    className="dash-input"
                    placeholder="Enter email id"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0b1030] mb-1.5 sm:mb-2">
                  Subject
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="dash-input"
                >
                  <option>General Inquiry</option>
                  <option>Technical Issue</option>
                  <option>Billing Question</option>
                  <option>Feature Request</option>
                  <option>Account Issue</option>
                  <option>Bug Report</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0b1030] mb-1.5 sm:mb-2">
                  Message *
                </label>
                <textarea
                  rows="4"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="dash-input resize-none"
                  placeholder="Describe your issue in detail..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0b1030] mb-1.5 sm:mb-2">
                  Attachments (Optional)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept=".png,.jpg,.jpeg,.svg,.pdf"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group border-2 border-dashed border-[#e8eaf9] rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:border-[#506cd7]/50"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(240, 241, 252, 0.4), rgba(253, 242, 245, 0.4))',
                  }}
                >
                  <div className="dash-icon-badge dash-icon-badge--gradient-indigo mb-2 sm:mb-3 transition-transform group-hover:scale-110">
                    <UploadCloud size={22} className="text-white" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-[#0b1030]">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-[10px] sm:text-xs text-[#6a7283] mt-1">
                    SVG, PNG, JPG or PDF (max. 10MB each, up to 5 files)
                  </p>
                </div>

                {/* Attached Files List */}
                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-2 bg-white border border-[#e8eaf9] px-3 py-2 rounded-lg hover:border-[#506cd7]/30 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="dash-icon-badge dash-icon-badge--gradient-indigo flex-shrink-0"
                            style={{ width: 24, height: 24 }}
                          >
                            <UploadCloud size={12} className="text-white" />
                          </span>
                          <span className="text-sm text-[#0b1030] truncate">{file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-[#6a7283] hover:text-red-500 transition-colors p-1"
                          aria-label="Remove attachment"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Ticket <Send size={18} className="ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Contact Info & Map */}
        <div className="space-y-4 sm:space-y-6">
          {/* Contact Details Card */}
          <div
            className="dash-card-static dash-card-accent"
            style={{ '--accent-stripe': '#0ea5e9' }}
          >
            <h3 className="dash-heading text-base sm:text-lg mb-4 sm:mb-6 flex items-center gap-2">
              <div className="dash-icon-badge dash-icon-badge--gradient-cyan">
                <Headphones size={20} className="text-white" />
              </div>
              Support Details
            </h3>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div
                  className="dash-icon-badge dash-icon-badge--gradient-indigo flex-shrink-0"
                  style={{ width: 38, height: 38 }}
                >
                  <Mail size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#6a7283] uppercase tracking-wide">
                    Email Support
                  </p>
                  <p className="text-[#0b1030] font-medium">support@healance.ai</p>
                  <p className="text-xs text-[#5f697a]">Response time: ~2 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div
                  className="dash-icon-badge dash-icon-badge--gradient-emerald flex-shrink-0"
                  style={{ width: 38, height: 38 }}
                >
                  <Phone size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#6a7283] uppercase tracking-wide">
                    Phone Support
                  </p>
                  <p className="text-[#0b1030] font-medium">+91 84335 09521</p>
                  <p className="text-xs text-[#5f697a]">Mon-Fri, 9am - 6pm IST</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div
                  className="dash-icon-badge dash-icon-badge--gradient-amber flex-shrink-0"
                  style={{ width: 38, height: 38 }}
                >
                  <Clock size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#6a7283] uppercase tracking-wide">
                    Working Hours
                  </p>
                  <p className="text-[#0b1030] font-medium">09:00 AM - 06:00 PM</p>
                  <p className="text-xs text-[#5f697a]">
                    Weekend support available for emergencies
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Map Card */}
          <div className="dash-card-static !p-2 overflow-hidden">
            <div className="rounded-xl overflow-hidden h-48 w-full">
              <iframe
                title="Healance Office Location - Mumbai"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.0252776517986!2d72.86546731490255!3d19.063280087096446!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c8e123bfffff%3A0xf1d9a6de0ebaaf38!2sBandra%20Kurla%20Complex%2C%20Bandra%20East%2C%20Mumbai%2C%20Maharashtra%20400051!5e0!3m2!1sen!2sin!4v1708000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-red-500" />
                <span className="text-xs font-bold text-[#0b1030]">Healance HQ - Mumbai</span>
              </div>
              <a
                href="https://www.google.com/maps/place/Bandra+Kurla+Complex,+Bandra+East,+Mumbai,+Maharashtra+400051/@19.0632801,72.8654673,17z"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#506cd7] font-medium hover:underline"
              >
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </DashReveal>

      {/* Bottom Banner */}
      <DashReveal delay={0.15}>
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-[20px] p-8 text-white shadow-lg flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="relative z-10 flex-1">
            <h3 className="text-2xl font-heading font-bold mb-2">Need Medical Advice?</h3>
            <p className="text-primary-100 mb-6 max-w-xl">
              Our support team can help with platform issues, but for medical concerns, please
              consult with our verified doctors or visit the nearest clinic.
            </p>
            <Button
              variant="secondary"
              className="bg-white text-primary-700 hover:bg-primary-50 border-none"
            >
              Find a Doctor
            </Button>
          </div>
          <div className="relative z-10 hidden md:block">
            <div className="bg-white/20 backdrop-blur-md p-4 rounded-full">
              <img
                src="https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=200"
                alt="Doctor"
                className="w-24 h-24 rounded-full border-4 border-white object-cover"
              />
            </div>
          </div>

          {/* Decorative Circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
        </div>
      </DashReveal>
    </div>
  );
};

export default DashboardContact;
