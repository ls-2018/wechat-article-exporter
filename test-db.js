const { getDbPool } = require('./server/utils/database');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const pool = getDbPool();
    console.log('Pool created successfully');
    
    const connection = await pool.getConnection();
    console.log('Got connection');
    
    await connection.ping();
    console.log('Ping successful');
    
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('Query result:', rows);
    
    connection.release();
    console.log('Connection released');
    
    return true;
  } catch (error) {
    console.error('Database test failed:', error);
    return false;
  }
}

testConnection().then(success => {
  console.log('Test result:', success);
  process.exit(success ? 0 : 1);
});