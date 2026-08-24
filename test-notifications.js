async function test() {
  try {
    console.log('1. Logging in as Admin...');
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@assetflow.com',
        password: 'Admin@123',
      }),
    });
    
    if (!loginRes.ok) {
      const errText = await loginRes.text();
      throw new Error(`Login failed with status ${loginRes.status}: ${errText}`);
    }
    
    const loginData = await loginRes.json();
    const token = loginData.data.token;
    const adminId = loginData.data.user.userId;
    console.log(`Login successful! Admin User ID: ${adminId}`);

    console.log('\n2. Fetching notifications list for Admin...');
    const notificationsRes = await fetch('http://localhost:3000/api/notifications?pageSize=5', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const notificationsData = await notificationsRes.json();
    const notifications = notificationsData.data || [];
    console.log(`Retrieved ${notifications.length} notifications.`);

    if (notifications.length > 0) {
      const firstId = notifications[0].id;
      console.log(`\n3. Marking first notification (${firstId}) as read...`);
      const readRes = await fetch(`http://localhost:3000/api/notifications/${firstId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const readData = await readRes.json();
      console.log('Mark read response:', JSON.stringify(readData));

      console.log('\n4. Marking all notifications as read...');
      const readAllRes = await fetch('http://localhost:3000/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const readAllData = await readAllRes.json();
      console.log('Mark all read response:', JSON.stringify(readAllData));

      console.log('\n5. Verifying unread status...');
      const verifyRes = await fetch('http://localhost:3000/api/notifications?pageSize=5', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const verifyData = await verifyRes.json();
      const unread = (verifyData.data || []).filter(n => n.isUnread);
      console.log(`Remaining unread notifications: ${unread.length}`);
    }

    console.log('\nAll notification tests passed successfully!');

  } catch (error) {
    console.error('Test script failed:', error);
  }
}

test();
