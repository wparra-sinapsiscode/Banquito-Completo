const { Member, Loan, LoanRequest, PaymentHistory, SavingsPlan, SystemSettings } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class DashboardController {
  async getDashboardData(req, res, next) {
    try {
      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // 1. Estadísticas Generales
      const totalMembers = await Member.count();
      const totalLoans = await Loan.count();
      const activeLoans = await Loan.count({
        where: { status: { [Op.in]: ['current', 'overdue'] } }
      });

      const loanStats = await Loan.findAll({
        attributes: ['original_amount', 'remaining_amount', 'status'],
        raw: true
      });

      const totalLoanAmount = loanStats.reduce((sum, loan) => sum + parseFloat(loan.original_amount), 0);
      const totalPendingAmount = loanStats.reduce((sum, loan) => sum + parseFloat(loan.remaining_amount), 0);
      const totalPaidAmount = totalLoanAmount - totalPendingAmount;
      const collectionRate = totalLoanAmount > 0 ? ((totalPaidAmount / totalLoanAmount) * 100).toFixed(2) : 0;

      // 2. Préstamos por vencer (próximos 7 días)
      const upcomingPayments = await Loan.findAll({
        where: {
          next_payment_date: {
            [Op.between]: [today, weekFromNow]
          },
          status: { [Op.in]: ['current', 'overdue'] }
        },
        include: [
          {
            model: Member,
            as: 'member',
            attributes: ['id', 'name', 'phone']
          }
        ],
        order: [['next_payment_date', 'ASC']],
        limit: 10
      });

      // 3. Préstamos vencidos
      const overdueLoans = await Loan.findAll({
        where: {
          next_payment_date: { [Op.lt]: today },
          status: 'overdue'
        },
        include: [
          {
            model: Member,
            as: 'member',
            attributes: ['id', 'name', 'phone']
          }
        ],
        order: [['next_payment_date', 'ASC']],
        limit: 10
      });

      // 4. Actividad reciente (últimos pagos)
      const recentPayments = await PaymentHistory.findAll({
        where: {
          payment_date: { [Op.gte]: monthAgo }
        },
        include: [
          {
            model: Loan,
            as: 'loan',
            include: [
              {
                model: Member,
                as: 'member',
                attributes: ['id', 'name']
              }
            ]
          }
        ],
        order: [['payment_date', 'DESC']],
        limit: 5
      });

      // 5. Nuevas solicitudes pendientes
      const pendingRequests = await LoanRequest.findAll({
        where: { status: 'pending' },
        include: [
          {
            model: Member,
            as: 'member',
            attributes: ['id', 'name', 'credit_rating']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: 5
      });

      // 6. Miembros más activos (con más préstamos)
      const topBorrowers = await Member.findAll({
        include: [
          {
            model: Loan,
            as: 'loans',
            attributes: ['id', 'original_amount', 'status']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: 5
      });

      // 7. Configuraciones del sistema
      const systemSettings = await SystemSettings.findOne();

      // 8. Estadísticas de capital
      const shareValue = systemSettings?.share_value || 500;
      const totalShares = await Member.sum('shares') || 0;
      const baseCapital = totalShares * shareValue;
      
      // 9. Nuevos miembros este mes
      const newMembersThisMonth = await Member.count({
        where: {
          created_at: { [Op.gte]: monthAgo }
        }
      });

      // 10. Resumen de planes de ahorro
      const savingsPlans = await SavingsPlan.findAll({
        where: { enabled: true },
        include: [
          {
            model: Member,
            as: 'member',
            attributes: ['id', 'name']
          }
        ]
      });

      const response = {
        // Estadísticas generales
        stats: {
          totalMembers,
          newMembersThisMonth,
          totalLoans,
          activeLoans,
          totalLoanAmount: parseFloat(totalLoanAmount.toFixed(2)),
          totalPendingAmount: parseFloat(totalPendingAmount.toFixed(2)),
          totalPaidAmount: parseFloat(totalPaidAmount.toFixed(2)),
          collectionRate: parseFloat(collectionRate),
          baseCapital: parseFloat(baseCapital.toFixed(2)),
          availableCapital: parseFloat((baseCapital - totalPendingAmount).toFixed(2)),
          overdueCount: overdueLoans.length
        },

        // Próximos vencimientos
        upcomingPayments: upcomingPayments.map(loan => ({
          id: loan.id,
          memberName: loan.member.name,
          memberPhone: loan.member.phone,
          amount: parseFloat(loan.weekly_payment || loan.monthly_payment || 0),
          dueDate: loan.next_payment_date,
          daysUntilDue: Math.ceil((new Date(loan.next_payment_date) - today) / (1000 * 60 * 60 * 24)),
          loanAmount: parseFloat(loan.original_amount),
          remainingAmount: parseFloat(loan.remaining_amount)
        })),

        // Préstamos vencidos
        overdueLoans: overdueLoans.map(loan => ({
          id: loan.id,
          memberName: loan.member.name,
          memberPhone: loan.member.phone,
          amount: parseFloat(loan.weekly_payment || loan.monthly_payment || 0),
          dueDate: loan.next_payment_date,
          daysOverdue: Math.ceil((today - new Date(loan.next_payment_date)) / (1000 * 60 * 60 * 24)),
          loanAmount: parseFloat(loan.original_amount),
          remainingAmount: parseFloat(loan.remaining_amount)
        })),

        // Actividad reciente
        recentActivity: recentPayments.map(payment => ({
          id: payment.id,
          memberName: payment.loan.member.name,
          amount: parseFloat(payment.amount),
          paymentDate: payment.payment_date,
          type: 'payment',
          description: `Pago de ${payment.loan.member.name} por S/ ${payment.amount}`
        })),

        // Solicitudes pendientes
        pendingRequests: pendingRequests.map(request => ({
          id: request.id,
          memberName: request.member.name,
          amount: parseFloat(request.amount),
          creditRating: request.member.credit_rating,
          requestDate: request.created_at,
          purpose: request.purpose
        })),

        // Top deudores
        topBorrowers: topBorrowers.map(member => {
          const totalBorrowed = member.loans.reduce((sum, loan) => sum + parseFloat(loan.original_amount), 0);
          const activeLoansCount = member.loans.filter(loan => loan.status !== 'paid').length;
          
          return {
            id: member.id,
            name: member.name,
            totalLoans: member.loans.length,
            activeLoans: activeLoansCount,
            totalBorrowed: parseFloat(totalBorrowed.toFixed(2)),
            creditRating: member.credit_rating
          };
        }),

        // Planes de ahorro activos
        activeSavingsPlans: savingsPlans.length,
        
        // Metadatos
        lastUpdated: new Date().toISOString(),
        systemSettings: {
          shareValue: systemSettings?.share_value || 500,
          operationDay: systemSettings?.operation_day || 'wednesday'
        }
      };

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      logger.error('Error obteniendo datos del dashboard:', error);
      next(error);
    }
  }

  async getQuickStats(req, res, next) {
    try {
      const today = new Date();
      
      // Estadísticas rápidas para widgets
      const [totalMembers, activeLoans, pendingRequests, overdueCount] = await Promise.all([
        Member.count(),
        Loan.count({ where: { status: { [Op.in]: ['current', 'overdue'] } } }),
        LoanRequest.count({ where: { status: 'pending' } }),
        Loan.count({ where: { status: 'overdue' } })
      ]);

      res.json({
        success: true,
        data: {
          totalMembers,
          activeLoans,
          pendingRequests,
          overdueCount,
          lastUpdated: today.toISOString()
        }
      });

    } catch (error) {
      logger.error('Error obteniendo estadísticas rápidas:', error);
      next(error);
    }
  }
}

module.exports = new DashboardController();