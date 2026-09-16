const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/rzp_test_TZUwf1FLBoMyDe/g, "rzp_test_TbWSIPFPtuOiJb");
code = code.replace(/vEEhzbKHyMIX7i7njn06b9lo/g, "ia1CT66DiuzfVLnsM5pxu3Y7");

fs.writeFileSync('server.ts', code);
console.log("Keys patched in server.ts");
