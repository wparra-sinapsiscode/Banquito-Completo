'use strict';

module.exports = (sequelize, DataTypes) => {
  const SavingsPlan = sequelize.define('SavingsPlan', {
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
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    plan_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 180,
      validate: {
        min: 30,
        max: 365
      }
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    tea: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0.02,
      validate: {
        min: 0,
        max: 1
      }
    },
    initial_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    final_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'active'
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
    tableName: 'savings_plans',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  SavingsPlan.associate = function(models) {
    SavingsPlan.belongsTo(models.Member, {
      foreignKey: 'member_id',
      as: 'member'
    });
  };

  // Métodos de instancia
  SavingsPlan.prototype.calculateFinalAmount = function() {
    const amount = parseFloat(this.initial_amount);
    const days = this.plan_days;
    const tea = parseFloat(this.tea);
    
    // Convertir TEA a TEM (Tasa Efectiva Mensual)
    const tem = Math.pow(1 + tea, 1/12) - 1;
    const months = days / 30;
    
    return amount * Math.pow(1 + tem, months);
  };

  SavingsPlan.prototype.isMatured = function() {
    const startDate = new Date(this.start_date);
    const maturityDate = new Date(startDate.getTime() + (this.plan_days * 24 * 60 * 60 * 1000));
    return new Date() >= maturityDate;
  };

  return SavingsPlan;
};