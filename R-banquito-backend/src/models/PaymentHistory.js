'use strict';

module.exports = (sequelize, DataTypes) => {
  const PaymentHistory = sequelize.define('PaymentHistory', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    loan_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Loans',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    payment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    late_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'payment_history',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  PaymentHistory.associate = function(models) {
    PaymentHistory.belongsTo(models.Loan, {
      foreignKey: 'loan_id',
      as: 'loan'
    });
  };

  return PaymentHistory;
};