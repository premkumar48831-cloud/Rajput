const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Patch create-order
const createOrderTarget = `app.post("/api/razorpay/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt, notes = {} } = req.body || {};`;
    
const createOrderReplace = `app.post("/api/razorpay/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt, notes = {}, key_id, key_secret } = req.body || {};`;

code = code.replace(createOrderTarget, createOrderReplace);

const rzpClientTarget = `    const rzpClient = getRazorpayClient();
    const amountInPaise = Math.round(numericAmount * 100);
    const orderReceipt = receipt || \`rcpt_\${Date.now()}\`;
    const activeKeyId = process.env.RAZORPAY_KEY_ID || "rzp_test_TZUwf1FLBoMyDe";

    if (rzpClient) {`;

const rzpClientReplace = `    let rzpClient = getRazorpayClient();
    let activeKeyId = process.env.RAZORPAY_KEY_ID || "rzp_test_TZUwf1FLBoMyDe";
    
    if (key_id && key_secret) {
        try {
            rzpClient = new Razorpay({ key_id, key_secret });
            activeKeyId = key_id;
        } catch(e) {
            console.error("Dynamic rzp client error:", e);
        }
    }

    const amountInPaise = Math.round(numericAmount * 100);
    const orderReceipt = receipt || \`rcpt_\${Date.now()}\`;

    if (rzpClient) {`;

code = code.replace(rzpClientTarget, rzpClientReplace);

// Patch verify-payment
const verifyTarget = `    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      user_details = {},
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({
        status: false,
        error: "Missing required payment details (order_id and payment_id are required)"
      });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET || "vEEhzbKHyMIX7i7njn06b9lo";`;

const verifyReplace = `    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      user_details = {},
      custom_key_secret,
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({
        status: false,
        error: "Missing required payment details (order_id and payment_id are required)"
      });
    }

    const key_secret = custom_key_secret || process.env.RAZORPAY_KEY_SECRET || "vEEhzbKHyMIX7i7njn06b9lo";`;

code = code.replace(verifyTarget, verifyReplace);

fs.writeFileSync('server.ts', code);
console.log("server.ts patched");
