const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');

const appTarget = `                              key_id: paymentSettings.razorpayAppId,
                              key_secret: paymentSettings.razorpaySecretKey`;
const appReplace = `                              key_id: paymentSettings.razorpayAppId || "rzp_test_TbWSIPFPtuOiJb",
                              key_secret: paymentSettings.razorpaySecretKey || "ia1CT66DiuzfVLnsM5pxu3Y7"`;

app = app.replace(appTarget, appReplace);

const appTarget2 = `                                          custom_key_secret: paymentSettings.razorpaySecretKey`;
const appReplace2 = `                                          custom_key_secret: paymentSettings.razorpaySecretKey || "ia1CT66DiuzfVLnsM5pxu3Y7"`;

app = app.replace(appTarget2, appReplace2);
fs.writeFileSync('src/App.tsx', app);

let modal = fs.readFileSync('src/components/RazorpayCheckoutModal.tsx', 'utf8');
const modalTarget1 = `          key_id: customKeyId,
          key_secret: customKeySecret,`;
const modalReplace1 = `          key_id: customKeyId || "rzp_test_TbWSIPFPtuOiJb",
          key_secret: customKeySecret || "ia1CT66DiuzfVLnsM5pxu3Y7",`;

modal = modal.replace(modalTarget1, modalReplace1);

const modalTarget2 = `                custom_key_secret: customKeySecret,`;
const modalReplace2 = `                custom_key_secret: customKeySecret || "ia1CT66DiuzfVLnsM5pxu3Y7",`;
modal = modal.replace(modalTarget2, modalReplace2);
fs.writeFileSync('src/components/RazorpayCheckoutModal.tsx', modal);

console.log("Patched frontend");
