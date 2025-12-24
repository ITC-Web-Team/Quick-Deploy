import axios from 'axios';

// Configure base URL - use environment variable in production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Deploy a new site
 * @param {FormData} formData - Form data with html, css, js files and siteName
 * @returns {Promise} Response from server
 */
export const deploySite = async (formData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/deploy`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Deployment failed' };
  }
};

/**
 * Get all deployed sites
 * @returns {Promise} Array of deployed sites
 */
export const getAllSites = async () => {
  try {
    const response = await apiClient.get('/sites');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch sites' };
  }
};

/**
 * Get specific site metadata
 * @param {string} siteName - Name of the site
 * @returns {Promise} Site metadata
 */
export const getSiteMetadata = async (siteName) => {
  try {
    const response = await apiClient.get(`/sites/${siteName}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to fetch site metadata' };
  }
};

/**
 * Delete a deployed site
 * @param {string} siteName - Name of the site to delete
 * @param {string} password - Password for deletion
 * @returns {Promise} Response from server
 */
export const deleteSite = async (siteName, password) => {
  try {
    const response = await apiClient.delete(`/sites/${siteName}`, {
      data: { password }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Failed to delete site' };
  }
};

/**
 * Download site as ZIP
 * @param {string} siteName - Name of the site to download
 */
export const downloadSite = async (siteName) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/sites/${siteName}/download`, {
      responseType: 'blob', // Important for file downloads
    });
    
    // Create a download link and trigger it
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${siteName}.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw error.response?.data || { error: 'Failed to download site' };
  }
};

/**
 * Health check
 * @returns {Promise} Server status
 */
export const healthCheck = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: 'Server is not responding' };
  }
};

export default {
  deploySite,
  getAllSites,
  getSiteMetadata,
  deleteSite,
  downloadSite,
  healthCheck,
};
