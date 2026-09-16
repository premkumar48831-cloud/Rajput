const Razorpay = require('razorpay');
const rzpClient = new Razorpay({
  key_id: "rzp_test_TZUwf1FLBoMyDe",
  key_secret: "vEEhzbKHyMIX7i7njn06b9lo"
});
rzpClient.orders.create({amount: 10000, currency: "INR"})
  .then(console.log)
  .catch(err => console.error(err));
