const fs = require('fs');
let code = fs.readFileSync('src/components/RazorpayCheckoutModal.tsx', 'utf8');

const targetModal1 = `      // Step 1: Request Order ID from backend
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          currency: "INR",
          notes: {
            userEmail: email || "Guest",
            userPhone: cleanPhone || "N/A",
            userName: name || "VIP User",
          },
        }),
      });`;

const replaceModal1 = `      // Step 1: Request Order ID from backend
      
      // Pull dynamic settings if they exist in localStorage (since we can't easily pass them as props without changing App.tsx signature)
      let customKeyId = "";
      let customKeySecret = "";
      try {
        const stored = localStorage.getItem("app_paymentSettings");
        if (stored) {
          const parsed = JSON.parse(stored);
          customKeyId = parsed.razorpayAppId;
          customKeySecret = parsed.razorpaySecretKey;
        }
      } catch(e) {}

      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          currency: "INR",
          key_id: customKeyId,
          key_secret: customKeySecret,
          notes: {
            userEmail: email || "Guest",
            userPhone: cleanPhone || "N/A",
            userName: name || "VIP User",
          },
        }),
      });`;

code = code.replace(targetModal1, replaceModal1);

const targetModal2 = `        // Step 3: Configure Handler for verification
        handler: async function (response: any) {
          setVerifying(true);
          try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: numericAmount,
              }),
            });`;

const replaceModal2 = `        // Step 3: Configure Handler for verification
        handler: async function (response: any) {
          setVerifying(true);
          try {
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: numericAmount,
                custom_key_secret: customKeySecret,
              }),
            });`;

code = code.replace(targetModal2, replaceModal2);

fs.writeFileSync('src/components/RazorpayCheckoutModal.tsx', code);
console.log("Modal patched");
