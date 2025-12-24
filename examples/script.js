console.log('%c🚀 QuickDeploy', 'color: #667eea; font-size: 20px; font-weight: bold;');
console.log('%cYour site is live and running!', 'color: #764ba2; font-size: 14px;');

// Mark CSS as loaded
const cssCheck = document.getElementById('cssCheck');
if (cssCheck) {
    cssCheck.textContent = '✅ CSS loaded and styled perfectly';
}

// Mark JS as loaded
const jsCheck = document.getElementById('jsCheck');
if (jsCheck) {
    jsCheck.textContent = '✅ JavaScript executed successfully';
}

// Button click handler
const testBtn = document.getElementById('testBtn');
if (testBtn) {
    testBtn.addEventListener('click', function() {
        alert('✅ JavaScript is working perfectly!\n\nQuickDeploy makes deployment easy! 🎉');
        console.log('Button clicked at:', new Date().toLocaleTimeString());
    });
}

// Log page info
console.log('Page loaded at:', new Date().toISOString());
console.log('User Agent:', navigator.userAgent);
console.log('Viewport:', window.innerWidth + 'x' + window.innerHeight);
