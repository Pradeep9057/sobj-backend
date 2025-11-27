import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

console.log('🔍 Testing database connection...\n');
console.log('Database Configuration:');
console.log('  Host:', process.env.DB_HOST);
console.log('  Port:', process.env.DB_PORT || 5432);
console.log('  Database:', process.env.DB_NAME);
console.log('  User:', process.env.DB_USER);
console.log('  Password:', process.env.DB_PASSWORD ? '***hidden***' : 'NOT SET');
console.log('');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('📡 Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Successfully connected to database!\n');
    
    // Test query
    console.log('🔍 Checking database tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Tables found:');
    tablesResult.rows.forEach(row => {
      console.log('  ✓', row.table_name);
    });
    
    // Check orders table columns
    console.log('\n🔍 Checking orders table structure...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders'
      ORDER BY ordinal_position;
    `);
    
    if (columnsResult.rows.length > 0) {
      console.log('\n📋 Orders table columns:');
      columnsResult.rows.forEach(row => {
        console.log(`  ✓ ${row.column_name} (${row.data_type})`);
      });
      
      // Check for required migration columns
      const requiredColumns = ['status', 'payment_status', 'tracking_number', 'shipping_address'];
      const existingColumns = columnsResult.rows.map(r => r.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('\n⚠️  WARNING: Missing columns (migration needed):');
        missingColumns.forEach(col => {
          console.log('  ✗', col);
        });
        console.log('\n💡 Run: node run-migration.js');
      } else {
        console.log('\n✅ All required columns present!');
      }
      
      // Check for order_items table
      const orderItemsExists = tablesResult.rows.some(r => r.table_name === 'order_items');
      if (!orderItemsExists) {
        console.log('\n⚠️  WARNING: order_items table does not exist (migration needed)');
        console.log('💡 Run: node run-migration.js');
      }
    } else {
      console.log('\n❌ Orders table not found!');
    }
    
    client.release();
    
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('\nError:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Troubleshooting:');
      console.error('  1. Check if DB_HOST in .env is correct');
      console.error('  2. Ensure the hostname includes full domain (e.g., .render.com)');
      console.error('  3. Verify internet connection');
    } else if (error.code === '28P01') {
      console.error('\n💡 Troubleshooting:');
      console.error('  1. Check DB_USER and DB_PASSWORD in .env');
      console.error('  2. Verify database credentials are correct');
    } else if (error.code === '3D000') {
      console.error('\n💡 Troubleshooting:');
      console.error('  1. Check DB_NAME in .env');
      console.error('  2. Verify database exists');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();

