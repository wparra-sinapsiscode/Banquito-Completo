const { Loan, Member, LoanRequest, PaymentHistory } = require('../models');
const calculationService = require('../services/calculation.service');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class LoansController {
  async getLoans(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 50, 
        status = '', 
        memberId = '',
        orderBy = 'created_at',
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
      
      const loans = await Loan.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Member,
            as: 'member',
            attributes: ['id', 'name', 'dni', 'credit_rating']
          },
          {
            model: PaymentHistory,
            as: 'payments',
            order: [['payment_date', 'DESC']]
          },
          {
            model: LoanRequest,
            as: 'loanRequest',
            attributes: ['id', 'purpose']
          }
        ],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [[orderBy, orderDir.toUpperCase()]]
      });
      
      res.json({
        success: true,
        data: loans.rows,
        pagination: {
          total: loans.count,
          page: parseInt(page),
          pages: Math.ceil(loans.count / parseInt(limit)),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Error obteniendo préstamos:', error);
      next(error);
    }
  }
  
  async getLoanById(req, res, next) {
    try {
      const { id } = req.params;
      
      const whereClause = { id };
      
      if (req.userRole === 'member' && req.user.member_id) {
        whereClause.member_id = req.user.member_id;
      }
      
      const loan = await Loan.findOne({
        where: whereClause,
        include: [
          {
            model: Member,
            as: 'member'
          },
          {
            model: PaymentHistory,
            as: 'payments',
            order: [['payment_date', 'DESC']]
          },
          {
            model: LoanRequest,
            as: 'loanRequest'
          }
        ]
      });
      
      if (!loan) {
        return res.status(404).json({
          success: false,
          message: 'Préstamo no encontrado'
        });
      }
      
      res.json({
        success: true,
        data: loan
      });
    } catch (error) {
      logger.error('Error obteniendo préstamo por ID:', error);
      next(error);
    }
  }
  
  async createLoanFromRequest(req, res, next) {
    try {
      const { loanRequestId, approvedBy } = req.body;
      
      const loanRequest = await LoanRequest.findByPk(loanRequestId, {
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
      
      const startDate = new Date();
      const nextWednesday = calculationService.getNextWednesday(startDate);
      
      // Calcular monto total con intereses
      const calculation = calculationService.calculateLoanPayment(
        loanRequest.requested_amount,
        loanRequest.monthly_interest_rate,
        loanRequest.total_weeks
      );
      
      const loan = await Loan.create({
        member_id: loanRequest.member_id,
        loan_request_id: loanRequestId,
        original_amount: loanRequest.requested_amount,
        remaining_amount: calculation.totalAmount, // Monto + intereses
        weekly_payment: loanRequest.weekly_payment,
        monthly_payment: loanRequest.monthly_payment,
        total_weeks: loanRequest.total_weeks,
        installments: loanRequest.installments,
        start_date: startDate,
        due_date: nextWednesday,
        monthly_interest_rate: loanRequest.monthly_interest_rate,
        status: 'active'
      });
      
      const createdLoan = await Loan.findByPk(loan.id, {
        include: ['member', 'loanRequest']
      });
      
      logger.info(`Préstamo creado desde solicitud ${loanRequestId} por ${approvedBy}`);
      
      res.status(201).json({
        success: true,
        data: createdLoan,
        message: 'Préstamo creado exitosamente'
      });
    } catch (error) {
      logger.error('Error creando préstamo desde solicitud:', error);
      next(error);
    }
  }
  
  async updateDueDate(req, res, next) {
    try {
      const { id } = req.params;
      const { newDueDate } = req.body;
      
      const loan = await Loan.findByPk(id, {
        include: ['member']
      });
      
      if (!loan) {
        return res.status(404).json({
          success: false,
          message: 'Préstamo no encontrado'
        });
      }
      
      if (loan.status === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'No se puede modificar la fecha de un préstamo pagado'
        });
      }
      
      await loan.update({ due_date: newDueDate });
      
      logger.info(`Fecha de vencimiento del préstamo ${id} actualizada por ${req.user.username}`);
      
      res.json({
        success: true,
        data: loan,
        message: 'Fecha de vencimiento actualizada exitosamente'
      });
    } catch (error) {
      logger.error('Error actualizando fecha de vencimiento:', error);
      next(error);
    }
  }
  
  async registerPayment(req, res, next) {
    try {
      const { id } = req.params;
      const { amount, paymentDate, lateFee = 0, notes = '' } = req.body;
      
      const loan = await Loan.findByPk(id, {
        include: ['payments']
      });
      
      if (!loan) {
        return res.status(404).json({
          success: false,
          message: 'Préstamo no encontrado'
        });
      }
      
      if (loan.status === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'El préstamo ya está pagado'
        });
      }
      
      const payment = await PaymentHistory.create({
        loan_id: id,
        amount: parseFloat(amount),
        payment_date: paymentDate,
        late_fee: parseFloat(lateFee),
        notes
      });
      
      // Calcular nuevo saldo pendiente
      const totalPaid = loan.payments.reduce((sum, payment) => sum + payment.amount, 0) + parseFloat(amount);
      const calculation = calculationService.calculateLoanPayment(
        loan.original_amount,
        loan.monthly_interest_rate,
        loan.total_weeks
      );
      const newRemainingAmount = Math.max(0, calculation.totalAmount - totalPaid);
      const newStatus = newRemainingAmount <= 0 ? 'paid' : 'active';
      
      await loan.update({
        remaining_amount: newRemainingAmount,
        status: newStatus
      });
      
      const updatedLoan = await Loan.findByPk(id, {
        include: ['member', 'payments']
      });
      
      logger.info(`Pago de ${amount} registrado para préstamo ${id} por ${req.user.username}`);
      
      res.json({
        success: true,
        data: {
          payment,
          loan: updatedLoan
        },
        message: 'Pago registrado exitosamente'
      });
    } catch (error) {
      logger.error('Error registrando pago:', error);
      next(error);
    }
  }
  
  async getPaymentSchedule(req, res, next) {
    try {
      const { id } = req.params;
      
      const whereClause = { id };
      
      if (req.userRole === 'member' && req.user.member_id) {
        whereClause.member_id = req.user.member_id;
      }
      
      const loan = await Loan.findOne({
        where: whereClause,
        include: ['payments']
      });
      
      if (!loan) {
        return res.status(404).json({
          success: false,
          message: 'Préstamo no encontrado'
        });
      }
      
      const schedule = calculationService.generatePaymentSchedule(
        loan.original_amount,
        loan.total_weeks,
        loan.monthly_interest_rate,
        loan.start_date
      );
      
      res.json({
        success: true,
        data: schedule
      });
    } catch (error) {
      logger.error('Error obteniendo cronograma de pagos:', error);
      next(error);
    }
  }
}

module.exports = new LoansController();