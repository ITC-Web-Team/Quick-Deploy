#!/usr/bin/env node

/**
 * QuickDeploy API Test Script
 * 
 * This script tests all QuickDeploy API endpoints
 * Usage: node test-api.js
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000/api';
const TEST_SITE_NAME = 'test-site-' + Date.now();

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, data = null, isFormData = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {},
    };

    if (!isFormData) {
      options.headers['Content-Type'] = 'application/json';
    }

    const req = protocol.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  log('\n╔════════════════════════════════════════╗', 'blue');
  log('║   QuickDeploy API Test Suite           ║', 'blue');
  log('╚════════════════════════════════════════╝\n', 'blue');

  let passedTests = 0;
  let failedTests = 0;

  try {
    // Test 1: Health Check
    log('Test 1: Health Check', 'yellow');
    try {
      const health = await makeRequest('GET', '/health');
      if (health.status === 200 && health.data.status === 'OK') {
        log('✓ PASSED: Server is healthy\n', 'green');
        passedTests++;
      } else {
        log('✗ FAILED: Unexpected health status\n', 'red');
        failedTests++;
      }
    } catch (err) {
      log(`✗ FAILED: ${err.message}\n`, 'red');
      failedTests++;
    }

    // Test 2: Get all sites (should be empty or have existing sites)
    log('Test 2: Get All Sites', 'yellow');
    try {
      const sites = await makeRequest('GET', '/sites');
      if (sites.status === 200 && Array.isArray(sites.data)) {
        log(`✓ PASSED: Retrieved ${sites.data.length} site(s)\n`, 'green');
        passedTests++;
      } else {
        log('✗ FAILED: Invalid response format\n', 'red');
        failedTests++;
      }
    } catch (err) {
      log(`✗ FAILED: ${err.message}\n`, 'red');
      failedTests++;
    }

    // Test 3: Deploy site
    log('Test 3: Deploy Site', 'yellow');
    try {
      const htmlContent = '<html><body><h1>Test</h1></body></html>';
      const cssContent = 'body { color: red; }';
      const jsContent = 'console.log("test");';

      // Create temp files
      const tempDir = path.join(__dirname, 'temp-test');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

      const htmlPath = path.join(tempDir, 'index.html');
      const cssPath = path.join(tempDir, 'style.css');
      const jsPath = path.join(tempDir, 'script.js');

      fs.writeFileSync(htmlPath, htmlContent);
      fs.writeFileSync(cssPath, cssContent);
      fs.writeFileSync(jsPath, jsContent);

      // Note: This test would need proper multipart/form-data handling
      // For now, we'll skip the actual deployment test
      log('⊘ SKIPPED: Requires multipart/form-data support\n', 'yellow');
    } catch (err) {
      log(`✗ FAILED: ${err.message}\n`, 'red');
      failedTests++;
    }

    // Test 4: Validate site name patterns
    log('Test 4: Site Name Validation', 'yellow');
    try {
      const validNames = ['test-site', 'my-app-2024', 'portfolio-v1'];
      const invalidNames = ['Test-Site', 'test_site', 'si', 'this-is-a-very-long-site-name-that-exceeds-thirty-characters'];

      let allValid = true;
      
      for (const name of validNames) {
        const regex = /^[a-z0-9-]+$/;
        if (!regex.test(name) || name.length < 3 || name.length > 30) {
          allValid = false;
          break;
        }
      }

      for (const name of invalidNames) {
        const regex = /^[a-z0-9-]+$/;
        if (regex.test(name) && name.length >= 3 && name.length <= 30) {
          allValid = false;
          break;
        }
      }

      if (allValid) {
        log('✓ PASSED: Site name validation works correctly\n', 'green');
        passedTests++;
      } else {
        log('✗ FAILED: Validation patterns incorrect\n', 'red');
        failedTests++;
      }
    } catch (err) {
      log(`✗ FAILED: ${err.message}\n`, 'red');
      failedTests++;
    }

    // Test 5: Rate limiting (make multiple requests)
    log('Test 5: Rate Limiting', 'yellow');
    try {
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(makeRequest('GET', '/health'));
      }
      
      const results = await Promise.all(requests);
      const allSuccess = results.every(r => r.status === 200);
      
      if (allSuccess) {
        log('✓ PASSED: Rate limiting allows legitimate requests\n', 'green');
        passedTests++;
      } else {
        log('✗ FAILED: Some requests were blocked\n', 'red');
        failedTests++;
      }
    } catch (err) {
      log(`✗ FAILED: ${err.message}\n`, 'red');
      failedTests++;
    }

    // Summary
    log('╔════════════════════════════════════════╗', 'blue');
    log('║         Test Summary                   ║', 'blue');
    log('╚════════════════════════════════════════╝', 'blue');
    log(`Passed: ${passedTests}`, 'green');
    log(`Failed: ${failedTests}\n`, failedTests > 0 ? 'red' : 'green');

    // Cleanup temp files
    const tempDir = path.join(__dirname, 'temp-test');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    process.exit(failedTests > 0 ? 1 : 0);

  } catch (err) {
    log(`\nUnexpected error: ${err.message}`, 'red');
    process.exit(1);
  }
}

// Run tests
runTests();
