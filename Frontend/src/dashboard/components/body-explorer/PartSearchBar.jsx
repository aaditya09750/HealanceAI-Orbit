import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

/**
 * Lightweight client-side fuzzy search over the body-part catalog.
 * No external fuzzy-match library — we match on part name + diseases +
 * relatedConditions with a simple score (exact start > contains > token
 * match). Small, fast, and has zero network cost after initial catalog load.
 */
const PartSearchBar = ({ catalog = {}, onSelect, disabled = false }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  const entries = useMemo(() => Object.entries(catalog), [catalog]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return entries
      .map(([name, info]) => {
        const nameLower = name.toLowerCase();
        let score = 0;
        if (nameLower === q) score = 100;
        else if (nameLower.startsWith(q)) score = 80;
        else if (nameLower.includes(q)) score = 60;

        const diseaseHit = (info.diseases || []).some((d) => String(d).toLowerCase().includes(q));
        if (diseaseHit) score = Math.max(score, 40);

        const symptomHit = (info.symptoms || []).some((s) => String(s).toLowerCase().includes(q));
        if (symptomHit) score = Math.max(score, 30);

        const systemHit = (info.system || '').toLowerCase().includes(q);
        if (systemHit) score = Math.max(score, 20);

        return { name, info, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, 6);
  }, [entries, query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus via `/` shortcut (handled by page-level keyboard listener)
  useEffect(() => {
    const handler = (e) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSelect = (name) => {
    onSelect?.(name);
    setQuery('');
    setIsOpen(false);
    setHighlight(0);
    inputRef.current?.blur();
  };

  const handleKey = (e) => {
    if (!isOpen || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(results.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(results[highlight].name);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a7283] pointer-events-none"
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKey}
          disabled={disabled}
          placeholder="Search body parts (press / to focus)"
          aria-label="Search body parts"
          className="w-full pl-8 pr-8 py-2 text-xs sm:text-sm rounded-xl bg-white/90 backdrop-blur-md border border-[#e8eaf9] text-[#0b1030] placeholder:text-[#9ca3af] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#506cd7] focus-visible:ring-offset-1 disabled:opacity-50"
          style={{ boxShadow: '0 4px 14px rgba(2, 6, 23, 0.05)' }}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#6a7283] hover:bg-[#f0f1fc]"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {isOpen && query && results.length > 0 && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-30 bg-white/95 backdrop-blur-md rounded-xl border border-[#e8eaf9] overflow-hidden max-h-64 overflow-y-auto"
          style={{ boxShadow: '0 10px 35px rgba(2, 6, 23, 0.12)' }}
        >
          {results.map((r, i) => (
            <button
              key={r.name}
              type="button"
              role="option"
              aria-selected={i === highlight}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => handleSelect(r.name)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs sm:text-[13px] ${
                i === highlight ? 'bg-[#f0f1fc]' : 'bg-transparent hover:bg-[#f0f1fc]'
              }`}
            >
              <span className="font-medium text-[#0b1030] truncate">{r.name}</span>
              <span className="text-[10px] text-[#6a7283] uppercase tracking-wider flex-shrink-0">
                {r.info.system || 'general'}
              </span>
            </button>
          ))}
        </div>
      )}

      {isOpen && query && results.length === 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-30 bg-white/95 backdrop-blur-md rounded-xl border border-[#e8eaf9] px-3 py-2 text-xs text-[#6a7283]"
          style={{ boxShadow: '0 10px 35px rgba(2, 6, 23, 0.12)' }}
        >
          No matches — try "heart", "diabetes", or "back pain".
        </div>
      )}
    </div>
  );
};

export default PartSearchBar;
