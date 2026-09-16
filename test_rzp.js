const Razorpay = require('razorpay');
const rzp = new Razorpay({
  key_id: "rzp_test_TbWSIPFPtuOiJb",
  key_secret: "ia1CT66DiuzfVLnsM5pxu3Y7"
});
rzp.orders.create({amount: 100, currency: "INR"}).then(console.log).catch(err => console.error(JSON.stringify(err)));
