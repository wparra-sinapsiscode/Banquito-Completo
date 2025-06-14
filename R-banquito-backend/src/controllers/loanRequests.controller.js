const { LoanRequest, Member, SystemSettings } = require('../models');
const calculationService = require('../services/calculation.service');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class LoanRequestsController {
  async getLoanRequests(req, res, next) {
    try {
      logger.info('📥 getLoanRequests - Parámetros recibidos:', req.query);
      const { 
        page = 1, 
        limit = 50, 
        status = '', 
        memberId = '',
        orderBy = 'request_date',
        orderDir = 'DESC'
      } = req.query;
      
      const whereClause = {};
      
      if (status) {
        whereClause.status = status;
      }
      
      if (memberId) {
        whereClause.member_id = memberId;
      }
      
      if (req.userRole === 'member' && req.user.member_id) {
        whereClause.member_id = req.user.member_id;
      }
      
      logger.info('🔍 getLoanRequests - WhereClause construido:', whereClause);
      
      const loanRequests = await LoanRequest.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Member,
            as: 'member',
            attributes: ['id', 'name', 'dni', 'credit_rating', 'credit_score']
          }
        ],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [[orderBy, orderDir.toUpperCase()]]
      });
      
      logger.info('📊 getLoanRequests - Solicitudes encontradas:', {
        total: loanRequests.count,
        returned: loanRequests.rows.length,
        data: loanRequests.rows.map(req => ({
          id: req.id,
          member_name: req.member?.name,
          status: req.status,
          requested_amount: req.requested_amount
        }))
      });
      
      res.json({
        success: true,
        data: loanRequests.rows,
        pagination: {
          total: loanRequests.count,
          page: parseInt(page),
          pages: Math.ceil(loanRequests.count / parseInt(limit)),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Error obteniendo solicitudes de préstamo:', error);
      next(error);
    }
  }
  
  async createLoanRequest(req, res, next) {
    try {
      logger.info('📥 Datos recibidos en createLoanRequest:', req.body);
      const { memberId, requestedAmount, purpose, installments, requiredDate } = req.body;
      
      if (req.userRole === 'member' && req.user.member_id !== parseInt(memberId)) {
        return res.status(403).json({
          success: false,
          message: 'Solo puedes crear solicitudes para tu cuenta'
        });
      }
      
      const member = await Member.findByPk(memberId);
      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Miembro no encontrado'
        });
      }
      
      const settingsData = await SystemSettings.findAll();
      const settings = {};
      settingsData.forEach(setting => {
        settings[setting.key] = setting.value;
      });
      
      const monthlyInterestRate = calculationService.getMonthlyInterestRate(requestedAmount, settings);
      const totalWeeks = installments; // installments ya son semanas desde el frontend
      
      console.log('🔢 Backend - Parámetros para cálculo:', {
        requestedAmount,
        monthlyInterestRate,
        totalWeeks,
        installments
      });
      
      const calculation = calculationService.calculateLoanPayment(
        requestedAmount,
        monthlyInterestRate,
        totalWeeks
      );
      
      console.log('📊 Backend - Resultado del cálculo:', calculation);
      
      const guaranteeLimit = member.guarantee * (settings.loanLimits?.guaranteePercentage || 80) / 100;
      const individualLimit = settings.loanLimits?.individual || 8000;
      const maxLoanAmount = Math.min(guaranteeLimit, individualLimit);
      
      if (requestedAmount > maxLoanAmount) {
        return res.status(400).json({
          success: false,
          message: `El monto excede el límite permitido de S/${maxLoanAmount}`
        });
      }
      
      const loanRequest = await LoanRequest.create({
        member_id: memberId,
        requested_amount: requestedAmount,
        purpose,
        installments,
        total_weeks: totalWeeks,
        weekly_payment: calculation.weeklyPayment,
        monthly_payment: calculation.monthlyPayment,
        monthly_interest_rate: monthlyInterestRate,
        total_interest: calculation.totalInterest,
        total_amount: calculation.totalAmount,
        status: 'pending',
        required_date: requiredDate
      });
      
      const createdRequest = await LoanRequest.findByPk(loanRequest.id, {
        include: ['member']
      });
      
      logger.info(`Solicitud de préstamo creada por miembro ${member.name} - Monto: S/${requestedAmount}`);
      
      res.status(201).json({
        success: true,
        data: createdRequest,
        message: 'Solicitud de préstamo creada exitosamente'
      });
    } catch (error) {
      logger.error('Error creando solicitud de préstamo:', error);
      next(error);
    }
  }
  
  async approveLoanRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;
      
      const loanRequest = await LoanRequest.findByPk(id, {
        include: ['member']
      });
      
      if (!loanRequest) {
        return res.status(404).json({
          success: false,
          message: 'Solicitud de préstamo no encontrada'
        });
      }
      
      if (loanRequest.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'La solicitud ya ha sido procesada'
        });
      }
      
      await loanRequest.update({
        status: 'approved',
        approved_by: approvedBy,
        approval_date: new Date()
      });
      
      const updatedRequest = await LoanRequest.findByPk(id, {
        include: ['member']
      });
      
      logger.info(`Solicitud ${id} aprobada por ${approvedBy} para miembro ${loanRequest.member.name}`);
      
      res.json({
        success: true,
        data: updatedRequest,
        message: 'Solicitud aprobada exitosamente'
      });
    } catch (error) {
      logger.error('Error aprobando solicitud:', error);
      next(error);
    }
  }
  
  async rejectLoanRequest(req, res, next) {
    try {
      const { id } = req.params;
      const { rejectedBy, rejectionReason } = req.body;
      
      const loanRequest = await LoanRequest.findByPk(id, {
        include: ['member']
      });
      
      if (!loanRequest) {
        return res.status(404).json({
          success: false,
          message: 'Solicitud de préstamo no encontrada'
        });
      }
      
      if (loanRequest.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'La solicitud ya ha sido procesada'
        });
      }
      
      await loanRequest.update({
        status: 'rejected',
        rejected_by: rejectedBy,
        rejection_reason: rejectionReason,
        rejection_date: new Date()
      });
      
      const updatedRequest = await LoanRequest.findByPk(id, {
        include: ['member']
      });
      
      logger.info(`Solicitud ${id} rechazada por ${rejectedBy} para miembro ${loanRequest.member.name}`);
      
      res.json({
        success: true,
        data: updatedRequest,
        message: 'Solicitud rechazada exitosamente'
      });
    } catch (error) {
      logger.error('Error rechazando solicitud:', error);
      next(error);
    }
  }
}

module.exports = new LoanRequestsController();