const { execSync } = require('child_process');
const { sequelize } = require('../src/models');

async function initDatabase() {
  console.log('🔄 Inicializando base de datos...');
  
  try {
    // Verificar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a base de datos establecida');
    
    // Ejecutar migraciones
    console.log('🏗️ Ejecutando migraciones...');
    execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
    
    // Verificar si ya existe el usuario admin
    const adminExists = await sequelize.query(
      "SELECT COUNT(*) as count FROM users WHERE username = 'admin'",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    if (adminExists[0].count === '0') {
      console.log('🌱 Ejecutando seed inicial...');
      execSync('npx sequelize-cli db:seed --seed 20250613000001-initial-setup.js', { stdio: 'inherit' });
    } else {
      console.log('ℹ️ Usuario admin ya existe, saltando seed');
    }
    
    console.log('✅ Base de datos inicializada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    process.exit(1);
  }
}

initDatabase();