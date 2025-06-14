// Forzar verificación e instalación de pg antes de iniciar servidor
console.log('🔍 Verificando dependencias de PostgreSQL...');
console.log('🚀 NUCLEAR FIX - FORCE COMMIT TIMESTAMP:', new Date().toISOString());

// Verificar que pg esté instalado
try {
  const pg = require('pg');
  console.log('✅ pg está instalado correctamente');
  console.log('📦 Versión de pg:', require('pg/package.json').version);
} catch (e) {
  console.error('❌ pg NO está instalado:', e.message);
  console.error('🚨 Instalando pg manualmente...');
  
  // Intentar instalación manual
  try {
    require('child_process').execSync('npm install pg pg-hstore --save', { stdio: 'inherit' });
    console.log('✅ pg instalado exitosamente');
  } catch (installError) {
    console.error('💥 Error instalando pg:', installError.message);
    process.exit(1);
  }
}

// Verificar pg-hstore
try {
  require('pg-hstore');
  console.log('✅ pg-hstore está instalado correctamente');
} catch (e) {
  console.error('❌ pg-hstore NO está instalado:', e.message);
  try {
    require('child_process').execSync('npm install pg-hstore --save', { stdio: 'inherit' });
    console.log('✅ pg-hstore instalado exitosamente');
  } catch (installError) {
    console.error('💥 Error instalando pg-hstore:', installError.message);
    process.exit(1);
  }
}

console.log('🚀 Iniciando servidor principal...');

// Exportar el servidor principal
module.exports = require('../server.js');