const { Member, Loan, LoanRequest, PaymentHistory, SavingsPlan, SystemSettings } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class ReportsController {
  async getLoansReport(req, res, next) {
    try {
      const {
        startDate,
        endDate,
        status = 'all',
        memberId,
        minAmount,
        maxAmount,
        format = 'json'
      } = req.query;

      let whereClause = {};
      let dateRange = {};

      // Filtros de fecha
      if (startDate || endDate) {
        if (startDate) dateRange[Op.gte] = new Date(startDate);
        if (endDate) dateRange[Op.lte] = new Date(endDate);
        whereClause.created_at = dateRange;
      }

      // Filtros adicionales
      if (status !== 'all') {
        whereClause.status = status;
      }

      if (memberId) {
        whereClause.member_id = memberId;
      }

      if (minAmount || maxAmount) {
        const amountRange = {};
        if (minAmount) amountRange[Op.gte] = parseFloat(minAmount);
        if (maxAmount) amountRange[Op.lte] = parseFloat(maxAmount);
        whereClause.original_amount = amountRange;
      }

      const loans = await Loan.findAll({
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
            attributes: ['id', 'amount', 'payment_date', 'payment_type']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      // Calcular estadísticas del reporte
      const stats = {
        totalLoans: loans.length,
        totalAmount: loans.reduce((sum, loan) => sum + parseFloat(loan.original_amount), 0),
        totalPending: loans.reduce((sum, loan) => sum + parseFloat(loan.remaining_amount), 0),
        totalPaid: loans.reduce((sum, loan) => {
          return sum + loan.payments.reduce((paidSum, payment) => paidSum + parseFloat(payment.amount), 0);
        }, 0),
        byStatus: {
          current: loans.filter(l => l.status === 'current').length,
          overdue: loans.filter(l => l.status === 'overdue').length,
          paid: loans.filter(l => l.status === 'paid').length
        },
        byRating: {
          green: loans.filter(l => l.member.credit_rating === 'green').length,
          yellow: loans.filter(l => l.member.credit_rating === 'yellow').length,
          red: loans.filter(l => l.member.credit_rating === 'red').length
        }
      };

      const reportData = {
        filters: {
          startDate,
          endDate,
          status,
          memberId,
          minAmount,
          maxAmount
        },
        statistics: stats,
        loans: loans.map(loan => ({
          id: loan.id,
          member: {
            id: loan.member.id,
            name: loan.member.name,
            dni: loan.member.dni,
            creditRating: loan.member.credit_rating
          },
          originalAmount: parseFloat(loan.original_amount),
          remainingAmount: parseFloat(loan.remaining_amount),
          interestRate: parseFloat(loan.interest_rate),
          weeklyPayment: parseFloat(loan.weekly_payment || 0),
          monthlyPayment: parseFloat(loan.monthly_payment || 0),
          status: loan.status,
          startDate: loan.start_date,
          nextPaymentDate: loan.next_payment_date,
          createdAt: loan.created_at,
          totalPaid: loan.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0),
          paymentsCount: loan.payments.length,
          lastPayment: loan.payments.length > 0 ? loan.payments[loan.payments.length - 1].payment_date : null
        })),
        generatedAt: new Date().toISOString()
      };

      if (format === 'csv') {
        return this.exportToCsv(res, reportData, 'loans_report');
      }

      res.json({
        success: true,
        data: reportData
      });

    } catch (error) {
      logger.error('Error generando reporte de préstamos:', error);
      next(error);
    }
  }

  async getMembersReport(req, res, next) {
    try {
      const {
        creditRating = 'all',
        hasLoans = 'all',
        hasSavings = 'all',
        format = 'json'
      } = req.query;

      let whereClause = {};

      if (creditRating !== 'all') {
        whereClause.credit_rating = creditRating;
      }

      const members = await Member.findAll({
        where: whereClause,
        include: [
          {
            model: Loan,
            as: 'loans',
            attributes: ['id', 'original_amount', 'remaining_amount', 'status']
          },
          {
            model: SavingsPlan,
            as: 'savingsPlan',
            required: false
          }
        ]
      });

      let filteredMembers = members;

      // Filtrar por préstamos
      if (hasLoans === 'true') {
        filteredMembers = filteredMembers.filter(member => member.loans.length > 0);
      } else if (hasLoans === 'false') {
        filteredMembers = filteredMembers.filter(member => member.loans.length === 0);
      }

      // Filtrar por plan de ahorro
      if (hasSavings === 'true') {
        filteredMembers = filteredMembers.filter(member => member.savingsPlan && member.savingsPlan.enabled);
      } else if (hasSavings === 'false') {
        filteredMembers = filteredMembers.filter(member => !member.savingsPlan || !member.savingsPlan.enabled);
      }

      // Calcular estadísticas
      const stats = {
        totalMembers: filteredMembers.length,
        totalShares: filteredMembers.reduce((sum, member) => sum + member.shares, 0),
        byRating: {
          green: filteredMembers.filter(m => m.credit_rating === 'green').length,
          yellow: filteredMembers.filter(m => m.credit_rating === 'yellow').length,
          red: filteredMembers.filter(m => m.credit_rating === 'red').length
        },
        withActiveLoans: filteredMembers.filter(m => m.loans.some(l => l.status !== 'paid')).length,
        withSavingsPlans: filteredMembers.filter(m => m.savingsPlan && m.savingsPlan.enabled).length,
        averageShares: filteredMembers.length > 0 ? 
          (filteredMembers.reduce((sum, member) => sum + member.shares, 0) / filteredMembers.length).toFixed(2) : 0
      };

      const reportData = {
        filters: {
          creditRating,
          hasLoans,
          hasSavings
        },
        statistics: stats,
        members: filteredMembers.map(member => {
          const activeLoans = member.loans.filter(loan => loan.status !== 'paid');
          const totalBorrowed = member.loans.reduce((sum, loan) => sum + parseFloat(loan.original_amount), 0);
          const totalPending = member.loans.reduce((sum, loan) => sum + parseFloat(loan.remaining_amount), 0);

          return {
            id: member.id,
            name: member.name,
            dni: member.dni,
            shares: member.shares,
            guarantee: parseFloat(member.guarantee),
            creditRating: member.credit_rating,
            creditScore: member.credit_score,
            phone: member.phone,
            email: member.email,
            totalLoans: member.loans.length,
            activeLoans: activeLoans.length,
            totalBorrowed: parseFloat(totalBorrowed.toFixed(2)),
            totalPending: parseFloat(totalPending.toFixed(2)),
            hasSavingsPlan: !!(member.savingsPlan && member.savingsPlan.enabled),
            savingsPlanDays: member.savingsPlan?.plan_days || null,
            joinDate: member.created_at
          };
        }),
        generatedAt: new Date().toISOString()
      };

      if (format === 'csv') {
        return this.exportToCsv(res, reportData, 'members_report');
      }

      res.json({
        success: true,
        data: reportData
      });

    } catch (error) {
      logger.error('Error generando reporte de miembros:', error);
      next(error);
    }
  }

  async getPaymentsReport(req, res, next) {
    try {
      const {
        startDate,
        endDate,
        memberId,
        paymentType = 'all',
        format = 'json'
      } = req.query;

      let whereClause = {};
      let dateRange = {};

      // Filtros de fecha
      if (startDate || endDate) {
        if (startDate) dateRange[Op.gte] = new Date(startDate);
        if (endDate) dateRange[Op.lte] = new Date(endDate);
        whereClause.payment_date = dateRange;
      }

      if (paymentType !== 'all') {
        whereClause.payment_type = paymentType;
      }

      const payments = await PaymentHistory.findAll({
        where: whereClause,
        include: [
          {
            model: Loan,
            as: 'loan',
            include: [
              {
                model: Member,
                as: 'member',
                attributes: ['id', 'name', 'dni']
              }
            ]
          }
        ],
        order: [['payment_date', 'DESC']]
      });

      // Filtrar por miembro si se especifica
      let filteredPayments = payments;
      if (memberId) {
        filteredPayments = payments.filter(payment => 
          payment.loan.member.id === parseInt(memberId)
        );
      }

      // Estadísticas
      const stats = {
        totalPayments: filteredPayments.length,
        totalAmount: filteredPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0),
        byType: {
          regular: filteredPayments.filter(p => p.payment_type === 'regular').length,
          late: filteredPayments.filter(p => p.payment_type === 'late').length,
          advance: filteredPayments.filter(p => p.payment_type === 'advance').length
        },
        averagePayment: filteredPayments.length > 0 ? 
          (filteredPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) / filteredPayments.length).toFixed(2) : 0
      };

      const reportData = {
        filters: {
          startDate,
          endDate,
          memberId,
          paymentType
        },
        statistics: stats,
        payments: filteredPayments.map(payment => ({
          id: payment.id,
          member: {
            id: payment.loan.member.id,
            name: payment.loan.member.name,
            dni: payment.loan.member.dni
          },
          loan: {
            id: payment.loan.id,
            originalAmount: parseFloat(payment.loan.original_amount)
          },
          amount: parseFloat(payment.amount),
          paymentDate: payment.payment_date,
          paymentType: payment.payment_type,
          lateFee: parseFloat(payment.late_fee || 0),
          notes: payment.notes
        })),
        generatedAt: new Date().toISOString()
      };

      if (format === 'csv') {
        return this.exportToCsv(res, reportData, 'payments_report');
      }

      res.json({
        success: true,
        data: reportData
      });

    } catch (error) {
      logger.error('Error generando reporte de pagos:', error);
      next(error);
    }
  }

  async getFinancialSummary(req, res, next) {
    try {
      const { year, month } = req.query;
      const currentDate = new Date();
      
      let startDate, endDate;
      
      if (year && month) {
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0);
      } else if (year) {
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
      } else {
        // Por defecto, último mes
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
      }

      // Datos base
      const [
        systemSettings,
        totalMembers,
        totalShares,
        totalLoans,
        activeLoans,
        paymentsInPeriod,
        loansInPeriod
      ] = await Promise.all([
        SystemSettings.findOne(),
        Member.count(),
        Member.sum('shares'),
        Loan.count(),
        Loan.count({ where: { status: { [Op.in]: ['current', 'overdue'] } } }),
        PaymentHistory.findAll({
          where: {
            payment_date: { [Op.between]: [startDate, endDate] }
          },
          include: [{ model: Loan, as: 'loan' }]
        }),
        Loan.findAll({
          where: {
            created_at: { [Op.between]: [startDate, endDate] }
          }
        })
      ]);

      const shareValue = systemSettings?.share_value || 500;
      const baseCapital = (totalShares || 0) * shareValue;

      // Cálculos financieros
      const totalLoanAmount = await Loan.sum('original_amount') || 0;
      const totalPendingAmount = await Loan.sum('remaining_amount') || 0;
      const totalPaidAmount = totalLoanAmount - totalPendingAmount;

      const paymentsAmount = paymentsInPeriod.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      const newLoansAmount = loansInPeriod.reduce((sum, loan) => sum + parseFloat(loan.original_amount), 0);

      const interestEarned = paymentsInPeriod.reduce((sum, payment) => {
        const principal = parseFloat(payment.loan.original_amount);
        const monthlyRate = parseFloat(payment.loan.interest_rate) / 100;
        const interest = principal * monthlyRate;
        return sum + interest;
      }, 0);

      const summary = {
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          year: parseInt(year) || startDate.getFullYear(),
          month: parseInt(month) || startDate.getMonth() + 1
        },
        capital: {
          baseCapital: parseFloat(baseCapital.toFixed(2)),
          totalShares: totalShares || 0,
          shareValue: shareValue,
          availableCapital: parseFloat((baseCapital - totalPendingAmount).toFixed(2)),
          capitalUtilization: baseCapital > 0 ? ((totalPendingAmount / baseCapital) * 100).toFixed(2) : 0
        },
        loans: {
          total: totalLoans,
          active: activeLoans,
          totalAmount: parseFloat(totalLoanAmount.toFixed(2)),
          pendingAmount: parseFloat(totalPendingAmount.toFixed(2)),
          paidAmount: parseFloat(totalPaidAmount.toFixed(2)),
          newLoansInPeriod: loansInPeriod.length,
          newLoansAmountInPeriod: parseFloat(newLoansAmount.toFixed(2))
        },
        payments: {
          countInPeriod: paymentsInPeriod.length,
          amountInPeriod: parseFloat(paymentsAmount.toFixed(2)),
          averagePayment: paymentsInPeriod.length > 0 ? 
            parseFloat((paymentsAmount / paymentsInPeriod.length).toFixed(2)) : 0
        },
        financial: {
          interestEarnedInPeriod: parseFloat(interestEarned.toFixed(2)),
          collectionRate: totalLoanAmount > 0 ? 
            ((totalPaidAmount / totalLoanAmount) * 100).toFixed(2) : 0,
          profitability: baseCapital > 0 ? 
            ((interestEarned / baseCapital) * 100).toFixed(2) : 0
        },
        members: {
          total: totalMembers,
          averageShares: totalMembers > 0 ? 
            parseFloat(((totalShares || 0) / totalMembers).toFixed(2)) : 0
        },
        generatedAt: new Date().toISOString()
      };

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      logger.error('Error generando resumen financiero:', error);
      next(error);
    }
  }

  // Función auxiliar para exportar a CSV
  exportToCsv(res, data, filename) {
    try {
      let csvContent = '';
      
      if (data.loans) {
        // CSV para préstamos
        csvContent = 'ID,Miembro,DNI,Monto Original,Monto Pendiente,Tasa Interes,Estado,Fecha Inicio,Proximo Pago\n';
        data.loans.forEach(loan => {
          csvContent += `${loan.id},"${loan.member.name}",${loan.member.dni},${loan.originalAmount},${loan.remainingAmount},${loan.interestRate},${loan.status},${loan.startDate},${loan.nextPaymentDate}\n`;
        });
      } else if (data.members) {
        // CSV para miembros
        csvContent = 'ID,Nombre,DNI,Acciones,Garantia,Calificacion,Telefono,Total Prestamos,Prestamos Activos,Total Prestado,Total Pendiente\n';
        data.members.forEach(member => {
          csvContent += `${member.id},"${member.name}",${member.dni},${member.shares},${member.guarantee},${member.creditRating},${member.phone},${member.totalLoans},${member.activeLoans},${member.totalBorrowed},${member.totalPending}\n`;
        });
      } else if (data.payments) {
        // CSV para pagos
        csvContent = 'ID,Miembro,DNI,Monto,Fecha Pago,Tipo Pago,Recargo Mora\n';
        data.payments.forEach(payment => {
          csvContent += `${payment.id},"${payment.member.name}",${payment.member.dni},${payment.amount},${payment.paymentDate},${payment.paymentType},${payment.lateFee}\n`;
        });
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);

    } catch (error) {
      logger.error('Error exportando CSV:', error);
      res.status(500).json({ success: false, message: 'Error al exportar CSV' });
    }
  }
}

module.exports = new ReportsController();