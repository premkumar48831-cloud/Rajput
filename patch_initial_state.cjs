const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/razorpayAppId: "",/g, 'razorpayAppId: "rzp_test_TbWSIPFPtuOiJb",');
code = code.replace(/razorpaySecretKey: "",/g, 'razorpaySecretKey: "ia1CT66DiuzfVLnsM5pxu3Y7",');

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx initial state");
