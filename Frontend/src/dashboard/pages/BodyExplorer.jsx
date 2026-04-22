import React, { useCallback, useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import AnatomyViewer from '../components/body-explorer/AnatomyViewer';
import PartDetailCard from '../components/body-explorer/PartDetailCard';
import PartSearchBar from '../components/body-explorer/PartSearchBar';
import { bodyExplorerService } from '../../services/api';

const CANVAS_REGIONS = new Set(['Brain', 'Heart', 'Lungs', 'Shoulders', 'Hands', 'Legs', 'Feet']);

const BodyExplorer = () => {
  const [gender, setGender] = useState('male');
  const [selectedPart, setSelectedPart] = useState(null);
  const [activeSystem, setActiveSystem] = useState('all');

  // Catalog cache — fetched once per gender change
  const [catalog, setCatalog] = useState({});
  const [catalogError, setCatalogError] = useState('');
  const [catalogLoading, setCatalogLoading] = useState(true);

  // Per-selection details
  const [partInfo, setPartInfo] = useState(null);
  const [partLoading, setPartLoading] = useState(false);
  const [partError, setPartError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setCatalogLoading(true);
    setCatalogError('');
    bodyExplorerService
      .listParts({ gender })
      .then((res) => {
        if (cancelled) return;
        if (res?.success) setCatalog(res.data || {});
        else setCatalogError('Could not load body-part catalog.');
      })
      .catch(() => {
        if (!cancelled) setCatalogError('Could not load body-part catalog. Offline?');
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gender]);

  useEffect(() => {
    if (!selectedPart) {
      setPartInfo(null);
      setPartError('');
      return;
    }
    const cached = catalog[selectedPart];
    if (cached) {
      setPartInfo(cached);
      setPartError('');
      return;
    }
    let cancelled = false;
    setPartLoading(true);
    setPartError('');
    bodyExplorerService
      .getPart(selectedPart)
      .then((res) => {
        if (cancelled) return;
        if (res?.success) setPartInfo(res.data);
        else setPartError('No details available for this region.');
      })
      .catch(() => {
        if (!cancelled) setPartError('Could not load details right now.');
      })
      .finally(() => {
        if (!cancelled) setPartLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedPart, catalog]);

  const handlePartClick = useCallback((partName) => {
    setSelectedPart(partName);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedPart(null);
  }, []);

  const handleSearchSelect = useCallback((partName) => {
    setSelectedPart(partName);
  }, []);

  // Keyboard shortcut: Esc closes the detail panel
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') setSelectedPart(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (activeSystem === 'all' || !selectedPart) return;
    const entry = catalog[selectedPart];
    if (entry && entry.system && entry.system !== activeSystem) {
      setSelectedPart(null);
    }
  }, [activeSystem, selectedPart, catalog]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-heading font-bold text-[#0b1030] truncate">
          Interactive Body Explorer
        </h2>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex-1 min-w-[200px] sm:min-w-0 sm:w-80">
            <PartSearchBar
              catalog={catalog}
              onSelect={handleSearchSelect}
              disabled={catalogLoading}
            />
          </div>
          <div className="bg-white p-0.5 sm:p-1 rounded-xl border border-[#e8eaf9] flex flex-shrink-0">
            <button
              onClick={() => setGender('male')}
              aria-pressed={gender === 'male'}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200
                ${
                  gender === 'male'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-[#5f697a] hover:bg-[#f0f1fc]'
                }`}
            >
              Male
            </button>
            <button
              onClick={() => setGender('female')}
              aria-pressed={gender === 'female'}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200
                ${
                  gender === 'female'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-[#5f697a] hover:bg-[#f0f1fc]'
                }`}
            >
              Female
            </button>
          </div>
        </div>
      </div>

      {/* 3D Viewer */}
      <div
        className="flex-1 bg-gradient-to-b from-[#f0f1fc] to-white rounded-[20px] border border-[#e8eaf9]
                   relative overflow-hidden min-h-[350px] sm:min-h-[450px] lg:min-h-[550px]"
        style={{ boxShadow: '0 10px 35px rgba(2, 6, 23, 0.08)' }}
      >
        <AnatomyViewer
          gender={gender}
          selectedPart={CANVAS_REGIONS.has(selectedPart) ? selectedPart : null}
          onPartClick={handlePartClick}
          onHover={() => {}}
          activeSystem={activeSystem}
          onSystemChange={setActiveSystem}
          catalog={catalog}
          catalogLoading={catalogLoading}
          onPartSelect={handleSearchSelect}
        />

        <PartDetailCard
          partName={selectedPart}
          partInfo={partInfo}
          loading={partLoading}
          error={partError}
          onClose={handleCloseDetail}
        />

        {/* Hint */}
        <div
          className="absolute bottom-12 sm:bottom-14 left-3 sm:left-4 z-10
                     bg-white/80 backdrop-blur-md p-2 sm:p-3 rounded-lg sm:rounded-xl
                     border border-[#e8eaf9] max-w-[180px] sm:max-w-[210px]"
          style={{ boxShadow: '0 10px 35px rgba(2, 6, 23, 0.08)' }}
        >
          <p className="text-[9px] sm:text-[10px] lg:text-xs text-[#6a7283] flex items-start gap-1">
            <Activity size={10} className="mr-1 sm:mr-1.5 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="hidden sm:inline">
              Drag to rotate · Scroll to zoom ·{' '}
              <kbd className="px-1 py-0.5 bg-[#f0f1fc] rounded text-[9px] font-mono">/</kbd> search
              · <kbd className="px-1 py-0.5 bg-[#f0f1fc] rounded text-[9px] font-mono">Esc</kbd>{' '}
              close
            </span>
            <span className="sm:hidden">Drag &amp; pinch</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BodyExplorer;
