import React, { useState } from 'react';
import { ExternalLink, Trash2, Copy, Check, Download } from 'lucide-react';

const SiteCard = ({ site, onDelete, onView }) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://api.quickdeploy.tech-iitb.org/${site.name}/`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    onDelete(site.name);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Dynamically import the downloadSite function
      const { downloadSite } = await import('../services/api');
      await downloadSite(site.name);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download site');
    } finally {
      setDownloading(false);
    }
  };

  const formattedDate = new Date(site.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="border-2 border-amber-200 rounded-2xl p-4 shadow-md hover:shadow-xl hover:border-orange-300 transition-all bg-gradient-to-br from-white to-amber-50/50 hover:scale-[1.02]">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-amber-900 text-lg font-bold">{site.name}</h3>
          <p className="text-xs text-amber-600">{formattedDate}</p>
        </div>
        {site.viewCount > 0 && (
          <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">
            👁 {site.viewCount}
          </span>
        )}
      </div>

      {/* URL */}
      <div className="bg-amber-50 rounded-xl px-3 py-2.5 mb-3 flex items-center justify-between border-2 border-amber-200">
        <code className="text-sm text-amber-800 truncate font-mono">/{site.name}/</code>
        <button
          onClick={handleCopy}
          className={`transition ml-2 shrink-0 p-1.5 rounded-lg border-2 ${copied ? 'bg-green-100 text-green-700 border-green-300' : 'text-amber-600 hover:bg-amber-100 border-amber-200 hover:border-orange-300'}`}
          title="Copy URL"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Files */}
      {site.files && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {Object.keys(site.files).map((type) => (
            <span
              key={type}
              className="text-xs px-2.5 py-1.5 rounded-lg border-2 font-medium bg-amber-100 text-amber-800 border-amber-300"
            >
              {type === 'html' ? '📄' : type === 'css' ? '🎨' : '⚡'} {type.toUpperCase()}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t-2 border-amber-200">
        <button
          onClick={() => onView(site.name)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-2.5 px-3 rounded-xl transition text-sm font-bold shadow-md"
        >
          <ExternalLink className="w-4 h-4" />
          Open 🚀
        </button>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl transition text-sm font-medium border-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-300 hover:border-green-400 disabled:opacity-50"
          title="Download code"
        >
          <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
        </button>
        
        <button
          onClick={handleDelete}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl transition text-sm font-medium border-2 bg-red-50 text-red-600 hover:bg-red-100 border-red-200 hover:border-red-300"
          title="Delete site"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SiteCard;
