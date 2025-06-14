'use strict';

module.exports = (sequelize, DataTypes) => {
  const Loan = sequelize.define('Loan', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    member_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Members',
        key: 'id'
      }
    },
    loan_request_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'LoanRequests',
        key: 'id'
      }
    },
    original_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 100,
        max: 50000
      }
    },
    remaining_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    weekly_payment: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    monthly_payment: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    total_weeks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 4,
        max: 144
      }
    },
    installments: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 36
      }
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'paid', 'overdue'),
      allowNull: false,
      defaultValue: 'active'
    },
    monthly_interest_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 50
      }
    },
    created_at: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'loans',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Loan.associate = function(models) {
    Loan.belongsTo(models.Member, {
      foreignKey: 'member_id',
      as: 'member'
    });
    
    Loan.belongsTo(models.LoanRequest, {
      foreignKey: 'loan_request_id',
      as: 'loanRequest'
    });
    
    Loan.hasMany(models.PaymentHistory, {
      foreignKey: 'loan_id',
      as: 'payments'
    });
  };

  return Loan;
};