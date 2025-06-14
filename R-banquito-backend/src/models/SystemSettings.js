'use strict';

module.exports = (sequelize, DataTypes) => {
  const SystemSettings = sequelize.define('SystemSettings', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    key: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [1, 50],
        notEmpty: true
      }
    },
    value: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    updated_at: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'system_settings',
    underscored: true,
    timestamps: true,
    createdAt: false,
    updatedAt: 'updated_at'
  });

  return SystemSettings;
};