// Verificación de PostgreSQL y entrada para Vercel serverless
console.log('🔍 Verificando dependencias de PostgreSQL...');

// Verificar que pg esté instalado
try {
  const pg = require('pg');
  console.log('✅ pg está instalado correctamente');
  console.log('📦 Versión de pg:', require('pg/package.json').version);
} catch (e) {
  console.error('❌ pg NO está instalado:', e.message);
  process.exit(1);
}

// Verificar pg-hstore
try {
  require('pg-hstore');
  console.log('✅ pg-hstore está instalado correctamente');
} catch (e) {
  console.error('❌ pg-hstore NO está instalado:', e.message);
  process.exit(1);
}

console.log('🚀 Iniciando servidor principal...');

// Importar la aplicación Express
const app = require('../server.js');

// Exportar para Vercel serverless
module.exports = app;