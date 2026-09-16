const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(/rzp_test_TZUwf1FLBoMyDe/g, "rzp_test_TbWSIPFPtuOiJb");
fs.writeFileSync('src/App.tsx', appCode);

let modalCode = fs.readFileSync('src/components/RazorpayCheckoutModal.tsx', 'utf8');
modalCode = modalCode.replace(/rzp_test_TZUwf1FLBoMyDe/g, "rzp_test_TbWSIPFPtuOiJb");
fs.writeFileSync('src/components/RazorpayCheckoutModal.tsx', modalCode);

console.log("Keys patched in frontend files");
