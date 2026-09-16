const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetApp = `                          // 1. Order ID generate
                          const orderRes = await fetch('/api/razorpay/create-order', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ amount: amt, currency: "INR" }) 
                          });`;

const replaceApp = `                          // 1. Order ID generate
                          const orderRes = await fetch('/api/razorpay/create-order', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              amount: amt, 
                              currency: "INR",
                              key_id: paymentSettings.razorpayAppId,
                              key_secret: paymentSettings.razorpaySecretKey
                            }) 
                          });`;

code = code.replace(targetApp, replaceApp);

const targetApp2 = `                                  // 3. Verify Payment
                                  const verifyResponse = await fetch('/api/razorpay/verify-payment', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                          razorpay_order_id: paymentResponse.razorpay_order_id,
                                          razorpay_payment_id: paymentResponse.razorpay_payment_id,
                                          razorpay_signature: paymentResponse.razorpay_signature,
                                          amount: amt
                                      })
                                  });`;

const replaceApp2 = `                                  // 3. Verify Payment
                                  const verifyResponse = await fetch('/api/razorpay/verify-payment', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                          razorpay_order_id: paymentResponse.razorpay_order_id,
                                          razorpay_payment_id: paymentResponse.razorpay_payment_id,
                                          razorpay_signature: paymentResponse.razorpay_signature,
                                          amount: amt,
                                          custom_key_secret: paymentSettings.razorpaySecretKey
                                      })
                                  });`;

code = code.replace(targetApp2, replaceApp2);

fs.writeFileSync('src/App.tsx', code);
console.log("App.tsx auto pay patched");
