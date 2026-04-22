import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, Pill, User, Info, Loader2, ShieldAlert, Paperclip } from 'lucide-react';
import Button from '../../shared/ui/Button';
import { chatbotService, healthService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import MessageDispatcher from './chatbot/MessageDispatcher';
import LocationPermissionModal from './chatbot/LocationPermissionModal';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const TypingDots = () => (
  <div className="flex gap-1 items-center p-4">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2 h-2 bg-[#506cd7] rounded-full"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </div>
);

const AIChatbots = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('health');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [locationModal, setLocationModal] = useState({ open: false, specialty: null });
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: 'Hello! I am your AI Health Assistant. How can I help you today?',
      botType: 'health',
    },
    {
      type: 'bot',
      text: 'I can provide detailed information about medicines using FDA database. Just type the medicine name (e.g., aspirin, ibuprofen, metformin).',
      botType: 'medicine',
    },
  ]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const newMessages = [...messages, { type: 'user', text: userMessage, botType: activeTab }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await chatbotService.sendMessage({
        message: userMessage,
        botType: activeTab,
        sessionId: sessionId,
      });

      if (response.success) {
        if (!sessionId && response.sessionId) {
          setSessionId(response.sessionId);
        }

        setMessages((prev) => [
          ...prev,
          {
            type: 'bot',
            text: response.response,
            botType: activeTab,
          },
        ]);
      } else {
        throw new Error(response.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages((prev) => [
        ...prev,
        {
          type: 'bot',
          text: `Sorry, I encountered an error: ${error.message}. Please try again.`,
          botType: activeTab,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReportUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const isAllowedType =
      ALLOWED_TYPES.includes(file.type) || /\.(pdf|png|jpe?g|docx)$/i.test(file.name);
    if (!isAllowedType) {
      toast({
        title: 'Unsupported file type',
        description: 'Use PDF, image, or DOCX.',
        variant: 'error',
      });
      e.target.value = '';
      return;
    }

    // Validate size
    if (file.size > MAX_UPLOAD_BYTES) {
      toast({ title: 'File too large', description: 'Maximum size is 10MB.', variant: 'error' });
      e.target.value = '';
      return;
    }

    setUploading(true);

    // 1. Show the user bubble immediately for responsive UX
    setMessages((prev) => [
      ...prev,
      { type: 'user', text: `📎 Uploaded ${file.name}`, botType: activeTab },
      { type: 'system', text: 'Uploading…', botType: activeTab },
    ]);

    let uploadedReport = null;
    try {
      const uploadResp = await healthService.uploadReport(file, {
        title: file.name,
        type: 'general',
      });
      uploadedReport = uploadResp?.report;
      if (!uploadedReport?._id) throw new Error('Upload did not return a report id');

      // Replace the "Uploading…" system message with "Analyzing…"
      setMessages((prev) => {
        const next = [...prev];
        const idx = next.findLastIndex((m) => m.type === 'system' && m.text === 'Uploading…');
        if (idx !== -1)
          next[idx] = { type: 'system', text: 'Analyzing report…', botType: activeTab };
        return next;
      });
      toast({ title: 'Report uploaded', variant: 'success' });
    } catch (err) {
      // Upload failed — show an error message and bail
      setMessages((prev) => {
        const filtered = prev.filter((m) => !(m.type === 'system' && m.text === 'Uploading…'));
        return [
          ...filtered,
          {
            type: 'bot-text',
            text: 'I could not upload that file. Please try again.',
            botType: activeTab,
          },
        ];
      });
      toast({
        title: err.response?.data?.message || 'Upload failed',
        variant: 'error',
      });
      setUploading(false);
      if (e.target) e.target.value = '';
      return;
    }

    // 2. Call analyze endpoint — happens AFTER upload success
    try {
      const analysis = await chatbotService.analyzeReport(uploadedReport._id);
      setMessages((prev) => {
        const filtered = prev.filter(
          (m) => !(m.type === 'system' && m.text === 'Analyzing report…')
        );
        return [
          ...filtered,
          {
            type: 'bot-report-card',
            payload: { ...analysis, fileName: uploadedReport.title || file.name },
            reportId: uploadedReport._id,
            botType: activeTab,
          },
        ];
      });
    } catch (err) {
      // Analysis failed (network / server) — degrade gracefully
      setMessages((prev) => {
        const filtered = prev.filter(
          (m) => !(m.type === 'system' && m.text === 'Analyzing report…')
        );
        return [
          ...filtered,
          {
            type: 'bot-report-card',
            payload: {
              status: 'error',
              fileName: uploadedReport.title || file.name,
              message:
                'Your report is uploaded, but I could not analyze it right now. You can still ask me questions about it.',
              disclaimer:
                'AI-generated analysis for educational purposes. Not a medical diagnosis.',
            },
            reportId: uploadedReport._id,
            botType: activeTab,
          },
        ];
      });
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  // Triggered when the user clicks "Explain medications" on a ReportSummaryCard.
  // Fetches FDA + RxNav info for each suggested medication and appends the
  // enriched results as a single bot-medicine-cards message.
  const handleExplainMedications = async (suggestedMedications) => {
    const list = Array.isArray(suggestedMedications) ? suggestedMedications : [];
    const placeholderSet = new Set(['unknown', 'not specified', 'n/a', 'na', 'none', 'tbd']);
    const names = list
      .map((m) => (typeof m === 'string' ? m : m?.name))
      .filter(
        (n) =>
          typeof n === 'string' &&
          n.trim().length > 1 &&
          !placeholderSet.has(n.trim().toLowerCase())
      );

    if (names.length === 0) {
      toast({ title: 'No specific medications to look up', variant: 'info' });
      return;
    }

    // Show a status pill so the user knows we're working
    setMessages((prev) => [
      ...prev,
      { type: 'system', text: 'Looking up medications…', botType: activeTab },
    ]);

    const userMedications = Array.isArray(user?.profile?.medications)
      ? user.profile.medications
      : [];

    try {
      const results = await Promise.all(
        names.slice(0, 5).map((name) =>
          chatbotService.explainMedicine({ name, userMedications }).catch((err) => ({
            status: 'error',
            message: err?.response?.data?.message || 'Lookup failed',
            medicine: null,
          }))
        )
      );

      setMessages((prev) => {
        const filtered = prev.filter(
          (m) => !(m.type === 'system' && m.text === 'Looking up medications…')
        );
        return [
          ...filtered,
          {
            type: 'bot-medicine-cards',
            payload: results,
            botType: activeTab,
          },
        ];
      });
    } catch (err) {
      setMessages((prev) =>
        prev.filter((m) => !(m.type === 'system' && m.text === 'Looking up medications…'))
      );
      toast({
        title: 'Could not load medication info',
        description: 'Please try again in a moment.',
        variant: 'error',
      });
    }
  };

  // Triggered when the user clicks "Find nearby <specialty>" on a ReportSummaryCard.
  // Opens the location permission modal; actual search fires after resolve.
  const handleFindSpecialist = (specialty) => {
    setLocationModal({ open: true, specialty: specialty || 'specialist' });
  };

  // Called by LocationPermissionModal once it has either { lat, lon } or { city }.
  const handleLocationResolved = async ({ lat, lon, city }) => {
    const specialty = locationModal.specialty || 'doctor';
    setLocationModal({ open: false, specialty: null });

    setMessages((prev) => [
      ...prev,
      { type: 'system', text: `Searching for ${specialty}s nearby…`, botType: activeTab },
    ]);

    try {
      const result = await chatbotService.getNearbyDoctors({
        specialty,
        lat,
        lon,
        city,
        radius: 7000,
      });

      setMessages((prev) => {
        const filtered = prev.filter(
          (m) => !(m.type === 'system' && m.text.startsWith('Searching for'))
        );
        return [
          ...filtered,
          {
            type: 'bot-doctor-grid',
            payload: result,
            botType: activeTab,
          },
        ];
      });
    } catch (err) {
      setMessages((prev) => {
        const filtered = prev.filter(
          (m) => !(m.type === 'system' && m.text.startsWith('Searching for'))
        );
        return [
          ...filtered,
          {
            type: 'bot-doctor-grid',
            payload: {
              status: 'error',
              message:
                err?.response?.data?.message ||
                'Could not search for nearby doctors. Please try again.',
            },
            botType: activeTab,
          },
        ];
      });
      toast({
        title: 'Could not load nearby doctors',
        description: 'Please try again in a moment.',
        variant: 'error',
      });
    }
  };

  const filteredMessages = messages.filter((m) => m.botType === activeTab);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages, loading]);

  const renderMessage = (text) => {
    if (typeof text !== 'string') return text;

    const lines = text.split('\n').map((line, idx) => {
      const hasBold = line.includes('**');

      if (hasBold) {
        const parts = line.split('**');
        return (
          <div key={idx} className={line.startsWith('━') ? 'text-[#6a7283]' : ''}>
            {parts.map((part, i) =>
              i % 2 === 1 ? (
                <strong key={i} className="font-bold text-[#0b1030]">
                  {part}
                </strong>
              ) : (
                part
              )
            )}
          </div>
        );
      } else if (line.startsWith('•')) {
        return (
          <div key={idx} className="ml-2">
            {line}
          </div>
        );
      } else if (line.startsWith('✓') || line.startsWith('❌')) {
        return (
          <div key={idx} className="font-medium">
            {line}
          </div>
        );
      } else if (line.trim() === '') {
        return <div key={idx} className="h-2"></div>;
      } else {
        return <div key={idx}>{line}</div>;
      }
    });

    return <div className="space-y-1 font-mono text-sm leading-relaxed">{lines}</div>;
  };

  return (
    <div className="h-[calc(100vh-10rem)] sm:h-[calc(100vh-8rem)] flex flex-col dash-card-static overflow-hidden !p-0">
      {/* Tabs */}
      <div className="flex border-b border-[#e8eaf9] bg-white">
        <button
          onClick={() => setActiveTab('health')}
          className={`relative flex-1 py-3 sm:py-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-colors ${
            activeTab === 'health'
              ? 'text-[#506cd7] bg-gradient-to-b from-[#f0f1fc] to-white'
              : 'text-[#5f697a] hover:bg-[#f8f9ff]'
          }`}
        >
          <span
            className={`dash-icon-badge ${activeTab === 'health' ? 'dash-icon-badge--gradient-indigo' : 'bg-[#f0f1fc]'}`}
            style={{ width: 26, height: 26 }}
          >
            <Bot size={13} className={activeTab === 'health' ? 'text-white' : 'text-[#506cd7]'} />
          </span>
          <span className="hidden xs:inline">Health</span> Assistant
          {activeTab === 'health' && (
            <span
              className="absolute bottom-0 left-4 right-4 h-[3px] rounded-full"
              style={{ background: 'linear-gradient(90deg, #506cd7, #0ea5e9)' }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('medicine')}
          className={`relative flex-1 py-3 sm:py-4 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 sm:gap-2 transition-colors ${
            activeTab === 'medicine'
              ? 'text-[#506cd7] bg-gradient-to-b from-[#f0f1fc] to-white'
              : 'text-[#5f697a] hover:bg-[#f8f9ff]'
          }`}
        >
          <span
            className={`dash-icon-badge ${activeTab === 'medicine' ? 'dash-icon-badge--gradient-rose' : 'bg-[#f0f1fc]'}`}
            style={{ width: 26, height: 26 }}
          >
            <Pill
              size={13}
              className={activeTab === 'medicine' ? 'text-white' : 'text-[#506cd7]'}
            />
          </span>
          <span className="hidden xs:inline">Medicine</span> Info
          {activeTab === 'medicine' && (
            <span
              className="absolute bottom-0 left-4 right-4 h-[3px] rounded-full"
              style={{ background: 'linear-gradient(90deg, #e74c4c, #fb7185)' }}
            />
          )}
        </button>
      </div>

      {/* Medical Disclaimer */}
      <div
        className="px-4 py-2 border-b border-amber-100 text-xs text-amber-700 flex items-center gap-2"
        style={{ background: 'linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)' }}
      >
        <ShieldAlert size={14} className="flex-shrink-0" />
        <span>
          This AI provides general health information only. Always consult a healthcare professional
          for medical advice.
        </span>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-3 sm:p-6 overflow-y-auto scrollbar-hide space-y-3 sm:space-y-4 bg-[#f3f3ff]">
        {filteredMessages.map((msg, idx) => (
          <MessageDispatcher
            key={idx}
            message={msg}
            onExplainMedications={handleExplainMedications}
            onFindSpecialist={handleFindSpecialist}
          />
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%] gap-3">
              <div
                className={`dash-icon-badge ${activeTab === 'health' ? 'dash-icon-badge--gradient-indigo' : 'dash-icon-badge--gradient-rose'} flex-shrink-0`}
                style={{ width: 32, height: 32 }}
              >
                {activeTab === 'health' ? (
                  <Bot size={14} className="text-white" />
                ) : (
                  <Pill size={14} className="text-white" />
                )}
              </div>
              <div
                className="rounded-[16px] bg-white border border-[#e8eaf9] rounded-tl-none"
                style={{ boxShadow: '0 10px 35px rgba(2, 6, 23, 0.08)' }}
              >
                <TypingDots />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 bg-white border-t border-[#e8eaf9]">
        <div className="flex gap-2 items-center">
          <input
            type="file"
            ref={fileInputRef}
            hidden
            accept=".pdf,.png,.jpg,.jpeg,.docx"
            onChange={handleReportUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || uploading}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#f0f1fc] hover:bg-[#e8eaf9] disabled:opacity-50 transition-colors"
            aria-label="Upload medical report"
            title="Upload medical report"
          >
            {uploading ? (
              <Loader2 size={18} className="animate-spin text-[#506cd7]" />
            ) : (
              <Paperclip size={18} className="text-[#506cd7]" />
            )}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
            placeholder={
              activeTab === 'health' ? 'Ask about symptoms...' : 'Enter medicine name...'
            }
            disabled={loading || uploading}
            className={`flex-1 dash-input ${loading || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          <Button onClick={handleSend} disabled={loading || uploading} className="px-3 sm:px-4">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </Button>
        </div>
      </div>

      {/* Location permission modal for the "Find nearby specialist" flow */}
      <LocationPermissionModal
        isOpen={locationModal.open}
        specialtyLabel={locationModal.specialty ? `${locationModal.specialty}s` : 'specialists'}
        onClose={() => setLocationModal({ open: false, specialty: null })}
        onResolved={handleLocationResolved}
      />
    </div>
  );
};

export default AIChatbots;
