const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');

// Replace dark HD card
css = css.replace(/background: #090b10 !important;/g, 'background: rgba(255, 255, 255, 0.05) !important;');

// Replace dark vignette
css = css.replace(/rgba\(5, 7, 14, 0\.65\)/g, 'rgba(255, 255, 255, 0.05)');
css = css.replace(/rgba\(2, 3, 6, 0\.95\)/g, 'rgba(255, 255, 255, 0.1)');

// Replace rainbow box content background
css = css.replace(/background: rgba\(0, 0, 0, 0\.15\);/g, 'background: rgba(255, 255, 255, 0.1);');

// Save
fs.writeFileSync('src/index.css', css);
console.log("Fixed CSS.");
