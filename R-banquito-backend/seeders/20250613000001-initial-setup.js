'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Insertar configuraciones del sistema
    await queryInterface.bulkInsert('system_settings', [
      {
        key: 'shareValue',
        value: '500',
        updated_at: new Date()
      },
      {
        key: 'loanLimits',
        value: JSON.stringify({
          individual: 8000,
          guaranteePercentage: 80
        }),
        updated_at: new Date()
      },
      {
        key: 'monthlyInterestRates',
        value: JSON.stringify({
          high: 3,
          medium: 5,
          low: 10
        }),
        updated_at: new Date()
      },
      {
        key: 'operationDay',
        value: '"wednesday"',
        updated_at: new Date()
      },
      {
        key: 'delinquencyRate',
        value: '5',
        updated_at: new Date()
      }
    ], {});

    // Insertar usuario administrador
    const adminPassword = await bcrypt.hash('banquito2025', 10);
    
    await queryInterface.bulkInsert('users', [{
      username: 'admin',
      password_hash: adminPassword,
      role: 'admin',
      name: 'Administrador del Sistema',
      member_id: null,
      created_at: new Date(),
      updated_at: new Date()
    }], {});

    console.log('✅ Datos iniciales creados:');
    console.log('   - Usuario: admin');
    console.log('   - Contraseña: banquito2025');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('system_settings', null, {});
  }
};