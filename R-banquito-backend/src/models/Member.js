'use strict';

module.exports = (sequelize, DataTypes) => {
  const Member = sequelize.define('Member', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
        notEmpty: true
      }
    },
    dni: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        len: [8, 20],
        notEmpty: true
      }
    },
    shares: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    guarantee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    credit_rating: {
      type: DataTypes.ENUM('green', 'yellow', 'red'),
      allowNull: false,
      defaultValue: 'yellow'
    },
    credit_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50,
      validate: {
        min: 1,
        max: 90
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        len: [9, 20]
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true,
        len: [5, 100]
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
    tableName: 'members',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Member.associate = function(models) {
    Member.hasOne(models.User, {
      foreignKey: 'member_id',
      as: 'user'
    });
    
    Member.hasOne(models.SavingsPlan, {
      foreignKey: 'member_id',
      as: 'savingsPlan'
    });
    
    Member.hasMany(models.Loan, {
      foreignKey: 'member_id',
      as: 'loans'
    });
    
    Member.hasMany(models.LoanRequest, {
      foreignKey: 'member_id',
      as: 'loanRequests'
    });
  };

  return Member;
};