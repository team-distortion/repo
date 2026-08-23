const { Client } = require('pg');

async function test() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'assetflow_user',
    password: 'assetflow_secure_password_change_this',
    database: 'assetflow'
  });
  
  try {
    await client.connect();
    console.log('Connected!');
    const res = await client.query('SELECT 1 as val');
    console.log(res.rows);
    await client.end();
  } catch(e) {
    console.error('Error connecting:', e);
  }
}
test();
