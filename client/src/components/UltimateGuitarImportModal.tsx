import React, { useState } from 'react';
import { Search, Link as LinkIcon, Download, Star, Loader2, X, AlertCircle } from 'lucide-react';
import type { Song } from '../types/index.js';

interface UltimateGuitarImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedData: Partial<Song>) => void;
}

interface UGSearchResult {
  title: string;
  artist: string;
  url: string;
  type: string;
  rating: number;
  votes: number;
}

export const UltimateGuitarImportModal: React.FC<UltimateGuitarImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'search'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UGSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImportUrl = async (urlToImport: string) => {
    if (!urlToImport.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/import/ultimate-guitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToImport.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Nepodařilo se stáhnout data z Ultimate Guitar.');
      }

      onImportSuccess(data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Chyba při stahování skladby.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/import/ultimate-guitar/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Chyba při vyhledávání na Ultimate Guitar.');
      }
      setSearchResults(data);
      if (data.length === 0) {
        setErrorMsg('Nebyly nalezeny žádné akordy pro zadaný dotaz.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Chyba při vyhledávání.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
            🎸 Import z Ultimate Guitar
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            Stáhněte text a akordy přímo z největší světové kytarové databáze
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 mb-5 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('url');
              setErrorMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'url'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-black font-extrabold shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Zadat URL adresu</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('search');
              setErrorMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'search'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-black font-extrabold shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Vyhledat píseň</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl flex items-center gap-2.5 text-zinc-800 dark:text-zinc-200 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: URL Input */}
        {activeTab === 'url' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1.5">
                Vložte odkaz na kartu / akordy na Ultimate Guitar:
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://tabs.ultimate-guitar.com/tab/..."
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-zinc-400 dark:focus:border-zinc-500 focus:outline-hidden"
              />
            </div>

            <button
              onClick={() => handleImportUrl(urlInput)}
              disabled={isLoading || !urlInput.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Stahuji a analyzuji akordy...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Stáhnout a naformátovat</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab 2: Search UG */}
        {activeTab === 'search' && (
          <div>
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="např. Oasis Wonderwall nebo Ed Sheeran..."
                className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-zinc-400 dark:focus:border-zinc-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={isLoading || !searchQuery.trim()}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black font-bold rounded-xl text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Hledat</span>
              </button>
            </form>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {searchResults.map((result, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/60 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <p className="font-bold text-zinc-900 dark:text-white text-sm truncate">{result.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{result.artist}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                      <span className="flex items-center gap-0.5 text-zinc-900 dark:text-white font-bold">
                        <Star className="w-3 h-3 fill-current text-zinc-900 dark:text-white" />
                        {result.rating}
                      </span>
                      <span className="text-zinc-400 dark:text-zinc-500">({result.votes} hodnocení)</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleImportUrl(result.url)}
                    disabled={isLoading}
                    className="shrink-0 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-800 border border-zinc-300 dark:bg-zinc-800 dark:hover:bg-white dark:hover:text-black dark:text-zinc-200 dark:border-zinc-700 font-bold text-xs rounded-xl transition-colors active:scale-95"
                  >
                    Importovat
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
