import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔧 Setting up .env file with correct database configuration...\n');

const envContent = `# Database Configuration (PostgreSQL on Render)
DB_HOST=dpg-d4cj50idbo4c73d9sg90-a.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=sonaura
DB_USER=sonaura_user
DB_PASSWORD=yShz6JGrkxVJpRvGl48JHmidF9dKRKhg

# JWT Secret (keep this secure)
JWT_SECRET=sonaura_jwt_secret_2024_change_in_production

# CORS Origins (your frontend URLs)
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# Port for backend server
PORT=5000

# Optional: Disable price cron if needed
# DISABLE_PRICE_CRON=true
`;

const envPath = path.join(__dirname, '.env');

try {
  // Backup existing .env if it exists
  if (fs.existsSync(envPath)) {
    const backupPath = path.join(__dirname, '.env.backup');
    fs.copyFileSync(envPath, backupPath);
    console.log('✅ Backed up existing .env to .env.backup');
  }
  
  // Write new .env file
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created new .env file with correct configuration!\n');
  
  console.log('📋 Configuration Summary:');
  console.log('  Database Host: dpg-d4cj50idbo4c73d9sg90-a.oregon-postgres.render.com');
  console.log('  Database Port: 5432');
  console.log('  Database Name: sonaura');
  console.log('  Database User: sonaura_user');
  console.log('  Password: ***configured***\n');
  
  console.log('🚀 Next steps:');
  console.log('  1. node test-db-connection.js  (test connection)');
  console.log('  2. node run-migration.js        (add required columns)');
  console.log('  3. npm start                    (start server)\n');
  
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  console.log('\n📝 Please manually create backend/.env with this content:\n');
  console.log(envContent);
  process.exit(1);
}

