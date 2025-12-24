import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, FileCode, FileType, FileJson } from 'lucide-react';
import { deploySite } from '../services/api';

const DeployForm = ({ onSuccess }) => {
  const [siteName, setSiteName] = useState('');
  const [htmlFile, setHtmlFile] = useState(null);
  const [cssFile, setCssFile] = useState(null);
  const [jsFile, setJsFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');

  const isValidSiteName = (name) => {
    const regex = /^[a-z0-9-]+$/;
    return regex.test(name) && name.length >= 3 && name.length <= 30;
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (type === 'html' && ext === 'html') setHtmlFile(file);
      else if (type === 'css' && ext === 'css') setCssFile(file);
      else if (type === 'js' && ext === 'js') setJsFile(file);
      else {
        setMessage(`Please select a .${type} file`);
        setMessageType('error');
      }
    }
  };

  const handleDeploy = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!siteName.trim()) {
      setMessage('Please enter a site name');
      setMessageType('error');
      return;
    }

    if (!isValidSiteName(siteName)) {
      setMessage('Use only lowercase letters, numbers, and hyphens (3-30 chars)');
      setMessageType('error');
      return;
    }

    if (!htmlFile) {
      setMessage('HTML file is required');
      setMessageType('error');
      return;
    }

    const formData = new FormData();
    formData.append('siteName', siteName);
    formData.append('files', htmlFile);
    if (cssFile) formData.append('files', cssFile);
    if (jsFile) formData.append('files', jsFile);

    setLoading(true);
    try {
      const response = await deploySite(formData);
      setMessage(`✓ Live at: https://api.quickdeploy.tech-iitb.org/${siteName}/`);
      setMessageType('success');
      setSiteName('');
      setHtmlFile(null);
      setCssFile(null);
      setJsFile(null);
      document.querySelector('form')?.reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      setMessage(error.error || 'Deployment failed');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-6 border-2 border-amber-200 hover:border-amber-300 transition-all">
      <h2 className="text-2xl font-bold text-amber-800 mb-4 flex items-center gap-3">
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-2.5 shadow-md">
          <Upload className="w-6 h-6 text-white" />
        </div>
        <span>Deploy Your Site 🎯</span>
      </h2>

      {message && (
        <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm border-2 ${
          messageType === 'success'
            ? 'bg-green-50 text-green-700 border-green-300'
            : 'bg-red-50 text-red-700 border-red-300'
        }`}>
          {messageType === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="break-all">{message}</span>
        </div>
      )}

      <form onSubmit={handleDeploy} className="space-y-4">
        {/* Site Name */}
        <div>
          <label className="block text-sm font-medium text-amber-800 mb-2">
            🏷️ Site Name
          </label>
          <input
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value.toLowerCase().replace(/\s/g, '-'))}
            placeholder="my-cool-project"
            className="w-full px-4 py-3 border-2 border-amber-200 rounded-xl focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200 transition bg-amber-50/50"
          />
          {siteName && (
            <p className="text-xs text-amber-600 mt-2 bg-amber-100 rounded-lg px-2 py-1 inline-block">
              🔗 https://api.quickdeploy.tech-iitb.org/{siteName}/
            </p>
          )}
        </div>

        {/* File Upload Buttons */}
        <div className="space-y-3">
          {/* HTML */}
          <label className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all hover:scale-[1.02] ${
            htmlFile ? 'border-green-400 bg-green-50' : 'border-amber-300 bg-amber-50/50 hover:border-orange-400 hover:bg-orange-50'
          }`}>
            <div className={`p-2 rounded-xl ${htmlFile ? 'bg-green-200' : 'bg-amber-200'}`}>
              <FileCode className={`w-6 h-6 ${htmlFile ? 'text-green-700' : 'text-amber-700'}`} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-amber-900">
                {htmlFile ? htmlFile.name : '📄 HTML File'} 
                <span className="text-red-500 ml-1">*</span>
              </p>
              <p className="text-xs text-amber-600">{htmlFile ? '✅ Ready to go!' : 'Required - Your main page'}</p>
            </div>
            <input type="file" accept=".html" onChange={(e) => handleFileChange(e, 'html')} className="hidden" />
          </label>

          {/* CSS */}
          <label className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all hover:scale-[1.02] ${
            cssFile ? 'border-green-400 bg-green-50' : 'border-amber-300 bg-amber-50/50 hover:border-orange-400 hover:bg-orange-50'
          }`}>
            <div className={`p-2 rounded-xl ${cssFile ? 'bg-green-200' : 'bg-amber-200'}`}>
              <FileType className={`w-6 h-6 ${cssFile ? 'text-green-700' : 'text-amber-700'}`} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-amber-900">{cssFile ? cssFile.name : '🎨 CSS File'}</p>
              <p className="text-xs text-amber-600">{cssFile ? '✅ Styles loaded!' : 'Optional - Make it pretty'}</p>
            </div>
            <input type="file" accept=".css" onChange={(e) => handleFileChange(e, 'css')} className="hidden" />
          </label>

          {/* JS */}
          <label className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all hover:scale-[1.02] ${
            jsFile ? 'border-green-400 bg-green-50' : 'border-amber-300 bg-amber-50/50 hover:border-orange-400 hover:bg-orange-50'
          }`}>
            <div className={`p-2 rounded-xl ${jsFile ? 'bg-green-200' : 'bg-amber-200'}`}>
              <FileJson className={`w-6 h-6 ${jsFile ? 'text-green-700' : 'text-amber-700'}`} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-amber-900">{jsFile ? jsFile.name : '⚡ JavaScript File'}</p>
              <p className="text-xs text-amber-600">{jsFile ? '✅ Code ready!' : 'Optional - Add interactivity'}</p>
            </div>
            <input type="file" accept=".js" onChange={(e) => handleFileChange(e, 'js')} className="hidden" />
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Launch Site! 🚀
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default DeployForm;
