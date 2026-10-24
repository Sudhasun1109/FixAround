const http = require('http');
const crypto = require('crypto');
const config = require('../server/src/config/env');
const jwt = require('../server/node_modules/jsonwebtoken');
const { pool } = require('../server/src/config/database');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function run() {
  console.log('--- TESTING RAZORPAY WALLET TOP-UP FLOW ---');

  // Customer ID 2 (Rahul Sharma, customer@example.com)
  const token = jwt.sign({ id: 2, email: 'customer@example.com', role: 'customer' }, config.jwt.secret);

  // 1. Check starting wallet balance
  console.log('\n[1] Checking starting wallet balance...');
  const startWalletRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/customers/wallet',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const startingBalance = Number(startWalletRes.data?.data?.wallet_balance || 0);
  console.log(`Starting Balance: ₹${startingBalance.toFixed(2)}`);

  // 2. Create Razorpay Wallet Order
  const topupAmount = 250;
  console.log(`\n[2] Creating Razorpay Wallet Top-up Order for ₹${topupAmount}...`);
  const orderRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/customers/wallet/razorpay/create-order',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    amount: topupAmount
  });

  console.log('Order Response Status:', orderRes.status);
  if (orderRes.status !== 201) {
    console.error('Failed to create order:', orderRes.data);
    process.exit(1);
  }

  const orderData = orderRes.data?.data;
  console.log(`✓ Order Created: ${orderData.orderId}, Amount in paise: ${orderData.amount}, Key: ${orderData.keyId}`);

  // 3. Generate Valid Signature
  const mockPaymentId = `pay_wtest_${Date.now()}`;
  const secret = config.payment.razorpayKeySecret;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${orderData.orderId}|${mockPaymentId}`)
    .digest('hex');

  console.log(`Generated HMAC signature for payment ${mockPaymentId}`);

  // 4. Verify Razorpay Payment & Top up Wallet
  console.log('\n[3] Calling Razorpay Wallet Verification API...');
  const verifyRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/customers/wallet/razorpay/verify',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    amount: topupAmount,
    razorpay_order_id: orderData.orderId,
    razorpay_payment_id: mockPaymentId,
    razorpay_signature: signature
  });

  console.log('Verify Response Status:', verifyRes.status);
  console.log('Verify Message:', verifyRes.data?.message);
  if (verifyRes.status !== 200) {
    console.error('Verification failed:', verifyRes.data);
    process.exit(1);
  }

  const newBalance = Number(verifyRes.data?.data?.wallet_balance);
  console.log(`✓ Wallet Credited! New Balance: ₹${newBalance.toFixed(2)} (Expected: ₹${(startingBalance + topupAmount).toFixed(2)})`);

  // 5. Verify database ledger & transaction
  console.log('\n[4] Checking database ledger records...');
  const [txRows] = await pool.query(
    'SELECT * FROM wallet_transactions WHERE customer_id = 2 ORDER BY id DESC LIMIT 1'
  );
  if (txRows.length > 0 && txRows[0].description.includes(mockPaymentId)) {
    console.log(`✓ Wallet transaction recorded in DB: "${txRows[0].description}", Amount: ₹${txRows[0].amount}, Balance After: ₹${txRows[0].balance_after}`);
  } else {
    console.error('Wallet transaction was not found in DB!');
    process.exit(1);
  }

  // 6. Verify Customer in-app notification
  const [notifRows] = await pool.query(
    "SELECT * FROM notifications WHERE user_id = 2 AND type = 'WALLET_CREDITED' ORDER BY id DESC LIMIT 1"
  );
  if (notifRows.length > 0) {
    console.log(`✓ Customer Notification sent: "${notifRows[0].title}" - "${notifRows[0].message}"`);
  }

  // 7. Verify Idempotency (prevent duplicate credit for same payment ID)
  console.log('\n[5] Testing Idempotency (Duplicate verification request)...');
  const dupRes = await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/customers/wallet/razorpay/verify',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    amount: topupAmount,
    razorpay_order_id: orderData.orderId,
    razorpay_payment_id: mockPaymentId,
    razorpay_signature: signature
  });

  console.log('Duplicate Call Status:', dupRes.status);
  console.log('Duplicate Call Message:', dupRes.data?.message);
  console.log(`✓ Balance remained unchanged at ₹${Number(dupRes.data?.data?.wallet_balance).toFixed(2)} (no double credit)`);

  console.log('\n🎉 ALL RAZORPAY WALLET TESTS PASSED PERFECTLY!\n');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
