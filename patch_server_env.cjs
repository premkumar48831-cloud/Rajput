const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace getRazorpayClient
const target1 = `function getRazorpayClient() {
  const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_TbWSIPFPtuOiJb";
  const key_secret = process.env.RAZORPAY_KEY_SECRET || "ia1CT66DiuzfVLnsM5pxu3Y7";`;
const replace1 = `function getRazorpayClient() {
  const key_id = "rzp_test_TbWSIPFPtuOiJb";
  const key_secret = "ia1CT66DiuzfVLnsM5pxu3Y7";`;

code = code.replace(target1, replace1);

// Replace create-order
const target2 = `    let activeKeyId = process.env.RAZORPAY_KEY_ID || "rzp_test_TbWSIPFPtuOiJb";`;
const replace2 = `    let activeKeyId = "rzp_test_TbWSIPFPtuOiJb";`;

code = code.replace(target2, replace2);

const target3 = `    if (key_id && key_secret) {
        try {
            rzpClient = new Razorpay({ key_id, key_secret });
            activeKeyId = key_id;
        } catch(e) {
            console.error("Dynamic rzp client error:", e);
        }
    }`;
const replace3 = `    if (key_id && key_id.trim() !== "" && key_secret && key_secret.trim() !== "") {
        try {
            rzpClient = new Razorpay({ key_id, key_secret });
            activeKeyId = key_id;
        } catch(e) {
            console.error("Dynamic rzp client error:", e);
        }
    }`;

code = code.replace(target3, replace3);

// Replace verify
const target4 = `    const key_secret = custom_key_secret || process.env.RAZORPAY_KEY_SECRET || "ia1CT66DiuzfVLnsM5pxu3Y7";`;
const replace4 = `    const key_secret = (custom_key_secret && custom_key_secret.trim() !== "") ? custom_key_secret : "ia1CT66DiuzfVLnsM5pxu3Y7";`;

code = code.replace(target4, replace4);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts env vars");
