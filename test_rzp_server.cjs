const Razorpay = require('razorpay');
const rzpClient = new Razorpay({
  key_id: "rzp_test_TbWSIPFPtuOiJb",
  key_secret: "ia1CT66DiuzfVLnsM5pxu3Y7"
});
const options = {
  amount: 10000,
  currency: "INR",
  receipt: "rcpt_123",
  notes: {
    app: "FFH4X VIP Store"
  }
};
rzpClient.orders.create(options)
  .then(console.log)
  .catch(err => console.error(err));
