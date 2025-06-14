'use strict';

module.exports = (sequelize, DataTypes) => {
  const LoanRequest = sequelize.define('LoanRequest', {
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
    requested_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 100,
        max: 50000
      }
    },
    purpose: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [10, 500],
        notEmpty: true
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
    total_weeks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 4,
        max: 144
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
    monthly_interest_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 50
      }
    },
    total_interest: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    approved_by: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    rejected_by: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    request_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    approval_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rejection_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    required_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    }
  }, {
    tableName: 'loan_requests',
    underscored: true,
    timestamps: false
  });

  LoanRequest.associate = function(models) {
    LoanRequest.belongsTo(models.Member, {
      foreignKey: 'member_id',
      as: 'member'
    });
    
    LoanRequest.hasOne(models.Loan, {
      foreignKey: 'loan_request_id',
      as: 'loan'
    });
  };

  return LoanRequest;
};