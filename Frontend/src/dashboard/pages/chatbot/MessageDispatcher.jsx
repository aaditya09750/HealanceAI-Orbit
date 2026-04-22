import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Pill, User } from 'lucide-react';
import ReportSummaryCard from './ReportSummaryCard';
import MedicineCard from './MedicineCard';
import DoctorGrid from './DoctorGrid';

// Render the bot avatar (matches existing chat look)
const BotAvatar = ({ botType }) => (
  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#f0f1fc] text-[#506cd7]">
    {botType === 'medicine' ? <Pill size={14} /> : <Bot size={14} />}
  </div>
);

const UserAvatar = () => (
  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#e8eaf9] text-[#506cd7]">
    <User size={14} />
  </div>
);

// Simple markdown-ish text renderer matching the prior implementation
const renderText = (text) => {
  if (typeof text !== 'string') return text;
  const lines = text.split('\n').map((line, idx) => {
    if (line.includes('**')) {
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
    }
    if (line.startsWith('•'))
      return (
        <div key={idx} className="ml-2">
          {line}
        </div>
      );
    if (line.startsWith('✓') || line.startsWith('❌'))
      return (
        <div key={idx} className="font-medium">
          {line}
        </div>
      );
    if (line.trim() === '') return <div key={idx} className="h-2" />;
    return <div key={idx}>{line}</div>;
  });
  return <div className="space-y-1 font-mono text-sm leading-relaxed">{lines}</div>;
};

/**
 * Discriminated message union renderer.
 *
 * Accepts a single message object and returns the appropriate chat bubble.
 * The wrapping flex/layout mirrors the original AIChatbots message row.
 */
const MessageDispatcher = ({ message, onExplainMedications, onFindSpecialist }) => {
  if (!message) return null;

  // ─── System note (e.g., "Analyzing…") ───
  if (message.type === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-center"
      >
        <span className="text-[11px] text-[#6a7283] italic bg-[#f0f1fc] px-3 py-1 rounded-full">
          {message.text}
        </span>
      </motion.div>
    );
  }

  // ─── User bubble ───
  if (message.type === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-end"
      >
        <div className="flex max-w-[90%] sm:max-w-[85%] gap-2 sm:gap-3 flex-row-reverse">
          <UserAvatar />
          <div className="p-3 sm:p-4 text-xs sm:text-sm bg-primary-600 text-white rounded-2xl rounded-tr-none">
            {renderText(message.text)}
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── Bot — plain text ───
  if (message.type === 'bot-text' || message.type === 'bot') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-start"
      >
        <div className="flex max-w-[90%] sm:max-w-[85%] gap-2 sm:gap-3">
          <BotAvatar botType={message.botType} />
          <div
            className="p-3 sm:p-4 text-xs sm:text-sm bg-white border border-[#e8eaf9] text-[#5f697a] rounded-[16px] rounded-tl-none"
            style={{ boxShadow: '0 10px 35px rgba(2, 6, 23, 0.08)' }}
          >
            {renderText(message.text)}
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── Bot — rich report analysis card ───
  if (message.type === 'bot-report-card') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-start"
      >
        <div className="flex max-w-[92%] sm:max-w-[88%] gap-2 sm:gap-3 w-full">
          <BotAvatar botType={message.botType} />
          <div className="flex-1 min-w-0">
            <ReportSummaryCard
              payload={message.payload}
              onExplainMedications={onExplainMedications}
              onFindSpecialist={onFindSpecialist}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── Bot — grid of nearby doctors ───
  if (message.type === 'bot-doctor-grid') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-start"
      >
        <div className="flex max-w-[92%] sm:max-w-[88%] gap-2 sm:gap-3 w-full">
          <BotAvatar botType={message.botType} />
          <div className="flex-1 min-w-0">
            <DoctorGrid payload={message.payload} />
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── Bot — one or more medicine cards ───
  if (message.type === 'bot-medicine-cards') {
    const cards = Array.isArray(message.payload) ? message.payload : [];
    if (cards.length === 0) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-start"
      >
        <div className="flex max-w-[92%] sm:max-w-[88%] gap-2 sm:gap-3 w-full">
          <BotAvatar botType={message.botType} />
          <div className="flex-1 min-w-0 space-y-3">
            {cards.map((card, i) => (
              <MedicineCard key={i} payload={card} />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // Unknown type — render as plain text fallback
  return (
    <div className="text-xs text-[#6a7283] italic text-center">
      {typeof message.text === 'string' ? message.text : 'Unsupported message'}
    </div>
  );
};

export default MessageDispatcher;
