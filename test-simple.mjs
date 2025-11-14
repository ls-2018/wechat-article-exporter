import mysql from 'mysql2/promise';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    const dbConfig = {
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'root',
      database: process.env.MYSQL_DATABASE || 'crawl',
      charset: 'utf8mb4',
      timezone: '+00:00',
      connectionLimit: 10,
      queueLimit: 0,
    };
    
    console.log('Connecting with config:', {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database
    });
    
    const pool = mysql.createPool(dbConfig);
    console.log('Pool created successfully');
    
    const connection = await pool.getConnection();
    console.log('Got connection');
    
    await connection.ping();
    console.log('Ping successful');
    
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('Query result:', rows);
    
    connection.release();
    console.log('Connection released');
    
    await pool.end();
    console.log('Pool closed');
    
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