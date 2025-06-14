'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Crear tabla members
    await queryInterface.createTable('members', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      dni: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      shares: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      guarantee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      credit_rating: {
        type: Sequelize.ENUM('green', 'yellow', 'red'),
        allowNull: false,
        defaultValue: 'yellow'
      },
      credit_score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 50
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Crear tabla users
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('admin', 'member', 'external'),
        allowNull: false,
        defaultValue: 'member'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      member_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'members',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Crear tabla savings_plans
    await queryInterface.createTable('savings_plans', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      member_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'members',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      plan_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 180
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      tea: {
        type: Sequelize.DECIMAL(5, 4),
        allowNull: false,
        defaultValue: 0.02
      },
      initial_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      final_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'active'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Crear tabla loan_requests
    await queryInterface.createTable('loan_requests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      member_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'members',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      requested_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      purpose: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      installments: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      total_weeks: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      weekly_payment: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      monthly_payment: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      monthly_interest_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      total_interest: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      approved_by: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      rejected_by: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      request_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      approval_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      rejection_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      required_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      }
    });

    // Crear tabla loans
    await queryInterface.createTable('loans', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      member_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'members',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      loan_request_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'loan_requests',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      original_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      remaining_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      weekly_payment: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      monthly_payment: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      total_weeks: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      installments: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'paid', 'overdue'),
        allowNull: false,
        defaultValue: 'active'
      },
      monthly_interest_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Crear tabla payment_history
    await queryInterface.createTable('payment_history', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      loan_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'loans',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      payment_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      late_fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Crear tabla system_settings
    await queryInterface.createTable('system_settings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      key: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      value: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Crear índices
    await queryInterface.addIndex('loans', ['member_id']);
    await queryInterface.addIndex('loans', ['status']);
    await queryInterface.addIndex('payment_history', ['loan_id']);
    await queryInterface.addIndex('loan_requests', ['member_id']);
    await queryInterface.addIndex('loan_requests', ['status']);
    await queryInterface.addIndex('users', ['username']);
    await queryInterface.addIndex('members', ['dni']);
    await queryInterface.addIndex('members', ['credit_rating']);
  },

  async down(queryInterface, Sequelize) {
    // Eliminar tablas en orden inverso para evitar problemas de claves foráneas
    await queryInterface.dropTable('payment_history');
    await queryInterface.dropTable('loans');
    await queryInterface.dropTable('loan_requests');
    await queryInterface.dropTable('savings_plans');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('system_settings');
    await queryInterface.dropTable('members');
  }
};