async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@assetflow.com',
        password: 'Admin@123',
      }),
    });
    
    const text = await res.text();
    console.log('STATUS:', res.status);
    console.log('RESPONSE:', text);
  } catch (error) {
    console.error('ERROR:', error);
  }
}

test();
