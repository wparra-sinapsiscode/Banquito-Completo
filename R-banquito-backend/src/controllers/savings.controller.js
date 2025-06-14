const { SavingsPlan, Member } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class SavingsController {
  // Obtener todos los planes de ahorro
  async getSavingsPlans(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 50, 
        memberId,
        enabled,
        orderBy = 'created_at',
        orderDir = 'DESC'
      } = req.query;
      
      const whereClause = {};
      
      if (memberId) {
        whereClause.member_id = memberId;
      }
      
      if (enabled !== undefined) {
        whereClause.enabled = enabled === 'true';
      }
      
      const offset = (page - 1) * limit;
      
      const savingsPlans = await SavingsPlan.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Member,
            as: 'member',
            attributes: ['id', 'name', 'dni', 'email']
          }
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [[orderBy, orderDir]]
      });
      
      res.json({
        success: true,
        data: savingsPlans.rows,
        pagination: {
          total: savingsPlans.count,
          page: parseInt(page),
          pages: Math.ceil(savingsPlans.count / limit),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Error obteniendo planes de ahorro:', error);
      next(error);
    }
  }

  // Obtener plan de ahorro por ID
  async getSavingsPlanById(req, res, next) {
    try {
      const { id } = req.params;
      
      const savingsPlan = await SavingsPlan.findByPk(id, {
        include: [
          {
            model: Member,
            as: 'member',
            attributes: ['id', 'name', 'dni', 'email', 'shares']
          }
        ]
      });
      
      if (!savingsPlan) {
        return res.status(404).json({
          success: false,
          message: 'Plan de ahorro no encontrado'
        });
      }
      
      res.json({
        success: true,
        data: savingsPlan
      });
    } catch (error) {
      logger.error('Error obteniendo plan de ahorro:', error);
      next(error);
    }
  }

  // Obtener plan de ahorro por ID de miembro
  async getSavingsPlanByMemberId(req, res, next) {
    try {
      const { memberId } = req.params;
      
      const savingsPlan = await SavingsPlan.findOne({
        where: { member_id: memberId },
        include: [
          {
            model: Member,
            as: 'member',
            attributes: ['id', 'name', 'dni', 'email', 'shares']
          }
        ]
      });
      
      if (!savingsPlan) {
        return res.status(404).json({
          success: false,
          message: 'Plan de ahorro no encontrado para este miembro'
        });
      }
      
      res.json({
        success: true,
        data: savingsPlan
      });
    } catch (error) {
      logger.error('Error obteniendo plan de ahorro por miembro:', error);
      next(error);
    }
  }

  // Crear nuevo plan de ahorro
  async createSavingsPlan(req, res, next) {
    try {
      const { member_id, enabled, plan_days, start_date, tea, initial_amount } = req.body;
      
      // Verificar si el miembro existe
      const member = await Member.findByPk(member_id);
      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Miembro no encontrado'
        });
      }
      
      // Verificar si ya existe un plan activo para este miembro
      const existingPlan = await SavingsPlan.findOne({
        where: { 
          member_id,
          enabled: true
        }
      });
      
      if (existingPlan) {
        return res.status(400).json({
          success: false,
          message: 'El miembro ya tiene un plan de ahorro activo'
        });
      }
      
      // Crear el plan de ahorro
      const savingsPlan = await SavingsPlan.create({
        member_id,
        enabled: enabled !== undefined ? enabled : true,
        plan_days: plan_days || 180,
        start_date: start_date || new Date(),
        tea: tea || 0.02,
        initial_amount: initial_amount || 0
      });
      
      // Recargar con asociaciones
      const createdPlan = await SavingsPlan.findByPk(savingsPlan.id, {
        include: [
          {
            model: Member,
            as: 'member',
            attributes: ['id', 'name', 'dni', 'email', 'shares']
          }
        ]
      });
      
      logger.info(`Plan de ahorro creado - ID: ${savingsPlan.id}, Miembro: ${member_id}`);
      
      res.status(201).json({
        success: true,
        message: 'Plan de ahorro creado exitosamente',
        data: createdPlan
      });
    } catch (error) {
      logger.error('Error creando plan de ahorro:', error);
      next(error);
    }
  }

  // Actualizar plan de ahorro
  async updateSavingsPlan(req, res, next) {
    try {
      const { id } = req.params;
      const { enabled, plan_days, start_date, tea, initial_amount } = req.body;
      
      const savingsPlan = await SavingsPlan.findByPk(id);
      
      if (!savingsPlan) {
        return res.status(404).json({
          success: false,
          message: 'Plan de ahorro no encontrado'
        });
      }
      
      // Actualizar campos permitidos
      if (enabled !== undefined) savingsPlan.enabled = enabled;
      if (plan_days !== undefined) savingsPlan.plan_days = plan_days;
      if (start_date !== undefined) savingsPlan.start_date = start_date;
      if (tea !== undefined) savingsPlan.tea = tea;
      if (initial_amount !== undefined) {
        logger.info(`🔍 Actualizando initial_amount: ${initial_amount} (tipo: ${typeof initial_amount})`);
        savingsPlan.initial_amount = initial_amount;
      }
      
      logger.info(`🔍 Valores antes de guardar:`, {
        enabled: savingsPlan.enabled,
        plan_days: savingsPlan.plan_days,
        start_date: savingsPlan.start_date,
        tea: savingsPlan.tea,
        initial_amount: savingsPlan.initial_amount
      });
      
      await savingsPlan.save();
      
      logger.info(`🔍 Valores después de guardar:`, {
        enabled: savingsPlan.enabled,
        plan_days: savingsPlan.plan_days,
        start_date: savingsPlan.start_date,
        tea: savingsPlan.tea,
        initial_amount: savingsPlan.initial_amount
      });
      
      // Recargar con asociaciones
      const updatedPlan = await SavingsPlan.findByPk(id, {
        include: [
          {
            model: Member,
            as: 'member',
            attributes: ['id', 'name', 'dni', 'email', 'shares']
          }
        ]
      });
      
      logger.info(`Plan de ahorro actualizado - ID: ${id}`);
      
      res.json({
        success: true,
        message: 'Plan de ahorro actualizado exitosamente',
        data: updatedPlan
      });
    } catch (error) {
      logger.error('Error actualizando plan de ahorro:', error);
      next(error);
    }
  }

  // Eliminar plan de ahorro (soft delete - solo desactivar)
  async deleteSavingsPlan(req, res, next) {
    try {
      const { id } = req.params;
      const user = req.user;
      const role = user.role;
      const memberId = user.member_id;
      
      logger.info(`🔍 Usuario intentando cancelar plan - ID: ${id}, Usuario: ${user.username}, Rol: ${role}, MemberId: ${memberId}`);
      
      const savingsPlan = await SavingsPlan.findByPk(id);
      
      if (savingsPlan) {
        logger.info(`🔍 Plan encontrado - member_id del plan: ${savingsPlan.member_id}, member_id del usuario: ${memberId}`);
      }
      
      if (!savingsPlan) {
        return res.status(404).json({
          success: false,
          message: 'Plan de ahorro no encontrado'
        });
      }
      
      // Verificar permisos: admin puede cancelar cualquier plan, member solo su propio plan
      if (role === 'member' && savingsPlan.member_id !== memberId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para cancelar este plan de ahorro'
        });
      }
      
      // Soft delete - solo desactivar
      savingsPlan.enabled = false;
      await savingsPlan.save();
      
      logger.info(`Plan de ahorro desactivado - ID: ${id}, Usuario: ${req.user.username}`);
      
      res.json({
        success: true,
        message: 'Plan de ahorro desactivado exitosamente'
      });
    } catch (error) {
      logger.error('Error eliminando plan de ahorro:', error);
      next(error);
    }
  }

  // Calcular interés para un plan
  async calculateInterest(req, res, next) {
    try {
      const { amount, days, tea = 0.02 } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El monto debe ser mayor a 0'
        });
      }
      
      if (!days || days <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Los días deben ser mayor a 0'
        });
      }
      
      // Convertir TEA a TEM (Tasa Efectiva Mensual)
      const TEM = Math.pow(1 + tea, 1/12) - 1;
      
      // Calcular el número de meses
      const months = days / 30;
      
      // Calcular el interés compuesto
      const finalAmount = amount * Math.pow(1 + TEM, months);
      const interest = finalAmount - amount;
      
      res.json({
        success: true,
        data: {
          amount,
          days,
          tea,
          tem: TEM,
          interest: parseFloat(interest.toFixed(2)),
          finalAmount: parseFloat(finalAmount.toFixed(2))
        }
      });
    } catch (error) {
      logger.error('Error calculando interés:', error);
      next(error);
    }
  }
}

module.exports = new SavingsController();