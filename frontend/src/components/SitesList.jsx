import React, { useState, useEffect } from 'react';
import { AlertCircle, Globe, Search, RefreshCw } from 'lucide-react';
import SiteCard from './SiteCard';
import { getAllSites, deleteSite } from '../services/api';

const SitesList = ({ refreshTrigger, onRefreshComplete }) => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSites = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllSites();
      setSites(data);
    } catch (err) {
      setError(err.error || 'Failed to load sites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, [refreshTrigger]);

  const handleDelete = async (siteName) => {
    const password = prompt('🔒 Enter password to delete:');
    if (!password) return; // User cancelled
    
    try {
      await deleteSite(siteName, password);
      setSites(sites.filter((site) => site.name !== siteName));
      onRefreshComplete?.();
    } catch (err) {
      setError(err.error || 'Failed to delete site');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleView = (siteName) => {
    window.open(`http://localhost:3000/${siteName}/`, '_blank');
  };

  const filteredSites = sites.filter((site) =>
    site.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-6 border-2 border-amber-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-amber-800 flex items-center gap-3">
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-2.5 shadow-md">
            <Globe className="w-6 h-6 text-white" />
          </div>
          Your Sites 🌐
          {sites.length > 0 && (
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-sm px-3 py-1 rounded-full shadow-sm">
              {sites.length}
            </span>
          )}
        </h2>

        <button
          onClick={fetchSites}
          className="text-amber-600 hover:text-orange-600 transition p-2.5 hover:bg-amber-100 rounded-xl border-2 border-amber-200 hover:border-orange-300"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search */}
      {sites.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-amber-400" />
          <input
            type="text"
            placeholder="🔍 Search your sites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-amber-200 rounded-xl focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200 transition bg-amber-50/50"
          />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-12">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-orange-500 rounded-full animate-spin mb-4" />
          <p className="text-amber-700">Loading your sites...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && sites.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🌍</div>
          <h3 className="text-xl font-bold text-amber-800 mb-2">No sites yet!</h3>
          <p className="text-amber-600">Upload your files and launch your first website! ✨</p>
        </div>
      )}

      {/* Sites Grid */}
      {!loading && filteredSites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSites.map((site) => (
            <SiteCard
              key={site.name}
              site={site}
              onDelete={handleDelete}
              onView={handleView}
            />
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && searchTerm && filteredSites.length === 0 && sites.length > 0 && (
        <div className="text-center py-8">
          <p className="text-amber-700">No sites match "{searchTerm}" 🔍</p>
        </div>
      )}
    </div>
  );
};

export default SitesList;
