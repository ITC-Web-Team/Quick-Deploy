import express from 'express';
import multer from 'multer';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import archiver from 'archiver';

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const SITES_DIR = process.env.SITES_DIR || './sites';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5242880;

// Create directories if they don't exist
[UPLOAD_DIR, SITES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ==================== SECURITY & MIDDLEWARE ====================

// Helmet for security headers with custom CSP to allow inline scripts/styles
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// JSON and URL-encoded parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// ==================== MULTER CONFIGURATION ====================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Only allow specific file types
  const allowedExtensions = ['.html', '.css', '.js'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${fileExt}. Only .html, .css, .js are allowed.`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// ==================== UTILITY FUNCTIONS ====================

/**
 * Validate site name format
 * Rules: lowercase letters, numbers, hyphens, 3-30 characters
 */
const isValidSiteName = (name) => {
  const regex = /^[a-z0-9-]+$/;
  return regex.test(name) && name.length >= 3 && name.length <= 30;
};

/**
 * Check if site name already exists
 */
const siteExists = (siteName) => {
  return fs.existsSync(path.join(SITES_DIR, siteName));
};

/**
 * Clean up temporary uploaded files
 */
const cleanupUploadedFiles = (files) => {
  files.forEach(file => {
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      console.error(`Error deleting temp file: ${file.path}`, err);
    }
  });
};

/**
 * Get file extension type
 */
const getFileType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.html':
      return 'html';
    case '.css':
      return 'css';
    case '.js':
      return 'javascript';
    default:
      return 'unknown';
  }
};

/**
 * Inject CSS and JS into HTML
 */
const injectFilesIntoHtml = (htmlPath, cssPath, jsPath) => {
  try {
    let html = fs.readFileSync(htmlPath, 'utf-8');
    
    // Inject CSS in <head>
    if (cssPath && fs.existsSync(cssPath)) {
      const cssContent = fs.readFileSync(cssPath, 'utf-8');
      const cssTag = `<style>\n${cssContent}\n</style>`;
      
      if (html.includes('</head>')) {
        html = html.replace('</head>', cssTag + '\n</head>');
      } else {
        html = cssTag + '\n' + html;
      }
    }
    
    // Inject JS before </body>
    if (jsPath && fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf-8');
      const jsTag = `<script>\n${jsContent}\n</script>`;
      
      if (html.includes('</body>')) {
        html = html.replace('</body>', jsTag + '\n</body>');
      } else {
        html = html + '\n' + jsTag;
      }
    }
    
    return html;
  } catch (err) {
    console.error('Error injecting files into HTML:', err);
    return null;
  }
};

// ==================== API ENDPOINTS ====================

/**
 * Health check endpoint
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'QuickDeploy server is running',
    timestamp: new Date(),
  });
});

/**
 * Deploy new site
 * POST /api/deploy
 * Accepts: multipart/form-data with html, css (optional), js (optional), siteName
 */
app.post('/api/deploy', upload.any(), async (req, res) => {
  try {
    const { siteName } = req.body;
    const uploadedFiles = req.files || [];

    // Validate site name
    if (!siteName) {
      cleanupUploadedFiles(uploadedFiles);
      return res.status(400).json({ error: 'Site name is required' });
    }

    if (!isValidSiteName(siteName)) {
      cleanupUploadedFiles(uploadedFiles);
      return res.status(400).json({
        error: 'Invalid site name. Must be 3-30 characters, lowercase letters, numbers, and hyphens only.',
      });
    }

    // Check for duplicate
    if (siteExists(siteName)) {
      cleanupUploadedFiles(uploadedFiles);
      return res.status(409).json({ error: `Site name "${siteName}" already exists` });
    }

    // Check for HTML file
    const htmlFile = uploadedFiles.find(f => path.extname(f.originalname).toLowerCase() === '.html');
    if (!htmlFile) {
      cleanupUploadedFiles(uploadedFiles);
      return res.status(400).json({ error: 'HTML file is required' });
    }

    // Create site directory
    const siteDir = path.join(SITES_DIR, siteName);
    fs.mkdirSync(siteDir, { recursive: true });

    try {
      // Copy files to site directory - keep original names for CSS/JS, rename HTML to index.html
      const fileMapping = {};
      
      uploadedFiles.forEach(file => {
        const ext = path.extname(file.originalname).toLowerCase();
        let targetName;

        if (ext === '.html') {
          // Always name HTML as index.html so it serves at the root
          targetName = 'index.html';
        } else {
          // Keep original filename for CSS, JS (so href="style.css" or src="game.js" works)
          targetName = file.originalname;
        }

        if (targetName) {
          const targetPath = path.join(siteDir, targetName);
          fs.copyFileSync(file.path, targetPath);
          fileMapping[ext.substring(1)] = targetName;
        }
      });

      // Create metadata
      const metadata = {
        name: siteName,
        url: `/${siteName}`,
        createdAt: new Date(),
        files: fileMapping,
        viewCount: 0,
      };

      fs.writeFileSync(
        path.join(siteDir, 'meta.json'),
        JSON.stringify(metadata, null, 2)
      );

      // Clean up uploaded files
      cleanupUploadedFiles(uploadedFiles);

      res.status(201).json({
        success: true,
        message: 'Site deployed successfully',
        site: {
          name: siteName,
          url: `/${siteName}`,
          accessUrl: `https://quickdeploy.tech-iitb.org/${siteName}`,
          createdAt: metadata.createdAt,
        },
      });
    } catch (err) {
      // Rollback: remove site directory on error
      try {
        fs.rmSync(siteDir, { recursive: true, force: true });
      } catch {}
      cleanupUploadedFiles(uploadedFiles);
      throw err;
    }
  } catch (err) {
    console.error('Deploy error:', err);
    res.status(500).json({ error: 'Deployment failed: ' + err.message });
  }
});

/**
 * Get all deployed sites
 * GET /api/sites
 */
app.get('/api/sites', (req, res) => {
  try {
    const sites = [];
    
    if (!fs.existsSync(SITES_DIR)) {
      return res.json(sites);
    }

    const siteNames = fs.readdirSync(SITES_DIR);
    
    siteNames.forEach(siteName => {
      const metaPath = path.join(SITES_DIR, siteName, 'meta.json');
      
      if (fs.existsSync(metaPath)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
          sites.push({
            ...metadata,
            url: `/${siteName}`,
          });
        } catch (err) {
          console.error(`Error reading metadata for ${siteName}:`, err);
        }
      }
    });

    // Sort by creation date (newest first)
    sites.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(sites);
  } catch (err) {
    console.error('Error fetching sites:', err);
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
});

/**
 * Get specific site metadata
 * GET /api/sites/:siteName
 */
app.get('/api/sites/:siteName', (req, res) => {
  try {
    const { siteName } = req.params;
    const metaPath = path.join(SITES_DIR, siteName, 'meta.json');

    if (!fs.existsSync(metaPath)) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    res.json(metadata);
  } catch (err) {
    console.error('Error fetching site metadata:', err);
    res.status(500).json({ error: 'Failed to fetch site metadata' });
  }
});

/**
 * Delete a deployed site
 * DELETE /api/sites/:siteName
 */
app.delete('/api/sites/:siteName', (req, res) => {
  try {
    const { siteName } = req.params;
    const { password } = req.body;
    const siteDir = path.join(SITES_DIR, siteName);

    // Check password
    if (password !== 'gnaanuxweb') {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    if (!fs.existsSync(siteDir)) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Remove site directory
    fs.rmSync(siteDir, { recursive: true, force: true });

    res.json({
      success: true,
      message: `Site "${siteName}" deleted successfully`,
    });
  } catch (err) {
    console.error('Error deleting site:', err);
    res.status(500).json({ error: 'Failed to delete site: ' + err.message });
  }
});

/**
 * Download site as ZIP
 * GET /api/sites/:siteName/download
 */
app.get('/api/sites/:siteName/download', (req, res) => {
  try {
    const { siteName } = req.params;
    const siteDir = path.join(SITES_DIR, siteName);

    // Check if site exists
    if (!fs.existsSync(siteDir)) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${siteName}.zip"`);

    // Create zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Handle archive errors
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      res.status(500).json({ error: 'Failed to create archive' });
    });

    // Pipe archive to response
    archive.pipe(res);

    // Add only code files (exclude metadata.json)
    const files = fs.readdirSync(siteDir);
    files.forEach(file => {
      if (file !== 'meta.json') {
        const filePath = path.join(siteDir, file);
        archive.file(filePath, { name: file });
      }
    });

    // Finalize the archive
    archive.finalize();
  } catch (err) {
    console.error('Error downloading site:', err);
    res.status(500).json({ error: 'Failed to download site: ' + err.message });
  }
});

// ==================== SITE SERVING ====================

/**
 * Serve static files (CSS, JS, images) for deployed sites
 * GET /:siteName/:filename
 */
app.get('/:siteName/:filename', (req, res) => {
  try {
    const { siteName, filename } = req.params;
    const siteDir = path.resolve(SITES_DIR, siteName);
    const filePath = path.resolve(siteDir, filename);
    const sitesRoot = path.resolve(SITES_DIR);

    // Security: prevent directory traversal
    if (!filePath.startsWith(sitesRoot)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `File "${filename}" not found` });
    }

    // Set correct MIME type
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.set('Content-Type', contentType);
    res.sendFile(filePath);
  } catch (err) {
    console.error('Error serving file:', err);
    res.status(500).json({ error: 'Error serving file: ' + err.message });
  }
});

/**
 * Serve deployed sites at custom URLs
 * GET /:siteName
 * Serves the HTML file directly (no injection)
 */
app.get('/:siteName', (req, res) => {
  try {
    const { siteName } = req.params;
    const siteDir = path.resolve(SITES_DIR, siteName);
    const htmlPath = path.resolve(siteDir, 'index.html');

    if (!fs.existsSync(htmlPath)) {
      return res.status(404).json({ error: `Site "${siteName}" not found` });
    }

    // Redirect to trailing slash so relative paths work correctly
    // e.g., /mario-test -> /mario-test/
    if (!req.originalUrl.endsWith('/')) {
      return res.redirect(301, `/${siteName}/`);
    }

    // Update view count
    const metaPath = path.join(siteDir, 'meta.json');
    if (fs.existsSync(metaPath)) {
      try {
        const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        metadata.viewCount = (metadata.viewCount || 0) + 1;
        fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
      } catch (err) {
        console.error('Error updating view count:', err);
      }
    }

    // Serve HTML file directly - no modification needed
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(path.resolve(htmlPath));
  } catch (err) {
    console.error('Error serving site:', err);
    res.status(500).json({ error: 'Error serving site: ' + err.message });
  }
});

// Also handle /:siteName/ with trailing slash
app.get('/:siteName/', (req, res) => {
  try {
    const { siteName } = req.params;
    const siteDir = path.resolve(SITES_DIR, siteName);
    const htmlPath = path.resolve(siteDir, 'index.html');

    if (!fs.existsSync(htmlPath)) {
      return res.status(404).json({ error: `Site "${siteName}" not found` });
    }

    // Update view count
    const metaPath = path.resolve(siteDir, 'meta.json');
    if (fs.existsSync(metaPath)) {
      try {
        const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        metadata.viewCount = (metadata.viewCount || 0) + 1;
        fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
      } catch (err) {
        console.error('Error updating view count:', err);
      }
    }

    // Serve HTML file directly
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(htmlPath);
  } catch (err) {
    console.error('Error serving site:', err);
    res.status(500).json({ error: 'Error serving site: ' + err.message });
  }
});

// ==================== ERROR HANDLING ====================

/**
 * Handle multer errors
 */
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 5MB limit' });
    }
    return res.status(400).json({ error: 'File upload error: ' + err.message });
  }

  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }

  next(err);
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Internal server error',
  });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`
    ╔══════════════════════════════════════╗
    ║   QuickDeploy Server Running         ║
    ╚══════════════════════════════════════╝
    
    🚀 Server: http://localhost:${PORT}
    📁 Sites Directory: ${SITES_DIR}
    📤 Uploads Directory: ${UPLOAD_DIR}
    🔒 Max File Size: ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB
    🌐 CORS Enabled: ${process.env.FRONTEND_URL}
    
    Available Endpoints:
    • GET  /api/health          - Health check
    • POST /api/deploy          - Deploy new site
    • GET  /api/sites           - List all sites
    • GET  /api/sites/:siteName - Get site metadata
    • DELETE /api/sites/:siteName - Delete site
    • GET  /:siteName           - Serve deployed site
  `);
});

export default app;
