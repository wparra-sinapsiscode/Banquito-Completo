require('dotenv').config();
const { sequelize } = require('./src/models');
const { execSync } = require('child_process');

async function resetAll() {
  try {
    console.log('🗑️ 1. Eliminando todas las tablas...');
    
    // Eliminar tablas
    await sequelize.query('DROP TABLE IF EXISTS payment_history CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS loans CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS loan_requests CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS savings_plans CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS users CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS members CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS system_settings CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS "SequelizeMeta" CASCADE');
    
    // Eliminar tipos ENUM
    await sequelize.query('DROP TYPE IF EXISTS enum_members_credit_rating CASCADE');
    await sequelize.query('DROP TYPE IF EXISTS enum_loan_requests_status CASCADE');
    await sequelize.query('DROP TYPE IF EXISTS enum_loans_status CASCADE');
    await sequelize.query('DROP TYPE IF EXISTS enum_users_role CASCADE');
    
    console.log('✅ Tablas eliminadas');
    
    // Cerrar conexión antes de ejecutar comandos CLI
    await sequelize.close();
    
    console.log('🏗️ 2. Creando tablas nuevamente...');
    execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
    
    console.log('🌱 3. Insertando datos iniciales...');
    execSync('npx sequelize-cli db:seed:all', { stdio: 'inherit' });
    
    console.log('✅ ¡Base de datos reseteada completamente!');
    console.log('');
    console.log('Usuario administrador creado:');
    console.log('- Username: admin');
    console.log('- Password: admin123');
    console.log('');
    console.log('Ahora puedes ejecutar: npm start');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

resetAll();