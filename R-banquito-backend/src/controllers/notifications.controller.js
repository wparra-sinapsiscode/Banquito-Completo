const { Member, Loan, LoanRequest, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class NotificationsController {
  async getNotifications(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        type = 'all',
        read = 'all'
      } = req.query;

      const userId = req.user.id;
      const userRole = req.user.role;

      // Generar notificaciones dinámicamente basadas en el estado actual
      const notifications = await this.generateNotifications(userId, userRole);

      // Filtrar por tipo si se especifica
      let filteredNotifications = notifications;
      if (type !== 'all') {
        filteredNotifications = notifications.filter(notif => notif.type === type);
      }

      // Simular paginación (en una implementación real, las notificaciones se almacenarían en BD)
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedNotifications,
        pagination: {
          total: filteredNotifications.length,
          page: parseInt(page),
          pages: Math.ceil(filteredNotifications.length / parseInt(limit)),
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      logger.error('Error obteniendo notificaciones:', error);
      next(error);
    }
  }

  async generateNotifications(userId, userRole) {
    const notifications = [];
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

    try {
      // Notificaciones para administradores
      if (userRole === 'admin') {
        
        // 1. Solicitudes de préstamo pendientes
        const pendingRequests = await LoanRequest.findAll({
          where: { status: 'pending' },
          include: [{ model: Member, as: 'member', attributes: ['name'] }],
          order: [['created_at', 'ASC']]
        });

        pendingRequests.forEach(request => {
          const daysSinceRequest = Math.floor((today - new Date(request.created_at)) / (1000 * 60 * 60 * 24));
          notifications.push({
            id: `loan_request_${request.id}`,
            type: 'loan_request',
            priority: daysSinceRequest > 2 ? 'high' : 'medium',
            title: 'Solicitud de préstamo pendiente',
            message: `${request.member.name} solicita S/ ${request.amount}`,
            actionUrl: `/admin/loan-requests/${request.id}`,
            createdAt: request.created_at,
            read: false,
            data: {
              requestId: request.id,
              memberName: request.member.name,
              amount: request.amount,
              daysPending: daysSinceRequest
            }
          });
        });

        // 2. Préstamos vencidos
        const overdueLoans = await Loan.findAll({
          where: {
            next_payment_date: { [Op.lt]: today },
            status: 'overdue'
          },
          include: [{ model: Member, as: 'member', attributes: ['name', 'phone'] }]
        });

        overdueLoans.forEach(loan => {
          const daysOverdue = Math.floor((today - new Date(loan.next_payment_date)) / (1000 * 60 * 60 * 24));
          notifications.push({
            id: `overdue_${loan.id}`,
            type: 'overdue_payment',
            priority: daysOverdue > 7 ? 'critical' : 'high',
            title: 'Pago vencido',
            message: `${loan.member.name} tiene un pago vencido hace ${daysOverdue} días`,
            actionUrl: `/admin/loans/${loan.id}`,
            createdAt: loan.next_payment_date,
            read: false,
            data: {
              loanId: loan.id,
              memberName: loan.member.name,
              memberPhone: loan.member.phone,
              daysOverdue: daysOverdue,
              paymentAmount: loan.weekly_payment || loan.monthly_payment
            }
          });
        });

        // 3. Próximos vencimientos (3 días)
        const upcomingPayments = await Loan.findAll({
          where: {
            next_payment_date: { [Op.between]: [today, threeDaysFromNow] },
            status: 'current'
          },
          include: [{ model: Member, as: 'member', attributes: ['name', 'phone'] }]
        });

        upcomingPayments.forEach(loan => {
          const daysUntilDue = Math.ceil((new Date(loan.next_payment_date) - today) / (1000 * 60 * 60 * 24));
          notifications.push({
            id: `upcoming_${loan.id}`,
            type: 'upcoming_payment',
            priority: daysUntilDue <= 1 ? 'high' : 'medium',
            title: 'Pago próximo a vencer',
            message: `${loan.member.name} debe pagar en ${daysUntilDue} días`,
            actionUrl: `/admin/loans/${loan.id}`,
            createdAt: new Date(),
            read: false,
            data: {
              loanId: loan.id,
              memberName: loan.member.name,
              memberPhone: loan.member.phone,
              daysUntilDue: daysUntilDue,
              paymentAmount: loan.weekly_payment || loan.monthly_payment,
              dueDate: loan.next_payment_date
            }
          });
        });

        // 4. Miembros con calificación roja
        const redRatingMembers = await Member.findAll({
          where: { credit_rating: 'red' },
          include: [{ 
            model: Loan, 
            as: 'loans', 
            where: { status: { [Op.in]: ['current', 'overdue'] } },
            required: false 
          }]
        });

        redRatingMembers.forEach(member => {
          if (member.loans.length > 0) {
            notifications.push({
              id: `red_rating_${member.id}`,
              type: 'member_alert',
              priority: 'high',
              title: 'Miembro con calificación roja activo',
              message: `${member.name} tiene calificación roja y préstamos activos`,
              actionUrl: `/admin/members/${member.id}`,
              createdAt: new Date(),
              read: false,
              data: {
                memberId: member.id,
                memberName: member.name,
                creditRating: member.credit_rating,
                activeLoans: member.loans.length
              }
            });
          }
        });

      } else {
        // Notificaciones para miembros regulares
        const member = await Member.findOne({
          where: { user_id: userId },
          include: [
            { 
              model: Loan, 
              as: 'loans',
              where: { status: { [Op.in]: ['current', 'overdue'] } },
              required: false
            },
            {
              model: LoanRequest,
              as: 'loanRequests',
              where: { status: 'pending' },
              required: false
            }
          ]
        });

        if (member) {
          // Notificaciones de préstamos del miembro
          member.loans.forEach(loan => {
            const dueDate = new Date(loan.next_payment_date);
            const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

            if (loan.status === 'overdue') {
              const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
              notifications.push({
                id: `my_overdue_${loan.id}`,
                type: 'my_overdue_payment',
                priority: 'critical',
                title: 'Pago vencido',
                message: `Tienes un pago vencido hace ${daysOverdue} días por S/ ${loan.weekly_payment || loan.monthly_payment}`,
                actionUrl: `/my-loans/${loan.id}`,
                createdAt: loan.next_payment_date,
                read: false,
                data: {
                  loanId: loan.id,
                  daysOverdue: daysOverdue,
                  paymentAmount: loan.weekly_payment || loan.monthly_payment
                }
              });
            } else if (daysUntilDue <= 3) {
              notifications.push({
                id: `my_upcoming_${loan.id}`,
                type: 'my_upcoming_payment',
                priority: daysUntilDue <= 1 ? 'high' : 'medium',
                title: 'Próximo pago',
                message: `Tu próximo pago de S/ ${loan.weekly_payment || loan.monthly_payment} vence ${daysUntilDue === 0 ? 'hoy' : `en ${daysUntilDue} días`}`,
                actionUrl: `/my-loans/${loan.id}`,
                createdAt: new Date(),
                read: false,
                data: {
                  loanId: loan.id,
                  daysUntilDue: daysUntilDue,
                  paymentAmount: loan.weekly_payment || loan.monthly_payment,
                  dueDate: loan.next_payment_date
                }
              });
            }
          });

          // Notificaciones de solicitudes pendientes
          member.loanRequests.forEach(request => {
            const daysSinceRequest = Math.floor((today - new Date(request.created_at)) / (1000 * 60 * 60 * 24));
            notifications.push({
              id: `my_request_${request.id}`,
              type: 'my_loan_request',
              priority: 'medium',
              title: 'Solicitud en revisión',
              message: `Tu solicitud de S/ ${request.amount} está siendo revisada (${daysSinceRequest} días)`,
              actionUrl: `/my-requests/${request.id}`,
              createdAt: request.created_at,
              read: false,
              data: {
                requestId: request.id,
                amount: request.amount,
                daysPending: daysSinceRequest
              }
            });
          });
        }
      }

      // Ordenar por prioridad y fecha
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      
      return notifications.sort((a, b) => {
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

    } catch (error) {
      logger.error('Error generando notificaciones:', error);
      return [];
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;

      // En una implementación real, aquí actualizarías la base de datos
      // Por ahora, simplemente confirmamos la acción
      
      res.json({
        success: true,
        message: 'Notificación marcada como leída',
        data: { id, read: true }
      });

    } catch (error) {
      logger.error('Error marcando notificación como leída:', error);
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id;

      // En una implementación real, aquí actualizarías todas las notificaciones del usuario
      
      res.json({
        success: true,
        message: 'Todas las notificaciones marcadas como leídas'
      });

    } catch (error) {
      logger.error('Error marcando todas las notificaciones como leídas:', error);
      next(error);
    }
  }

  async getNotificationStats(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      const notifications = await this.generateNotifications(userId, userRole);

      const stats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.read).length,
        byPriority: {
          critical: notifications.filter(n => n.priority === 'critical').length,
          high: notifications.filter(n => n.priority === 'high').length,
          medium: notifications.filter(n => n.priority === 'medium').length,
          low: notifications.filter(n => n.priority === 'low').length
        },
        byType: {
          loan_request: notifications.filter(n => n.type === 'loan_request').length,
          overdue_payment: notifications.filter(n => n.type === 'overdue_payment').length,
          upcoming_payment: notifications.filter(n => n.type === 'upcoming_payment').length,
          member_alert: notifications.filter(n => n.type === 'member_alert').length,
          my_overdue_payment: notifications.filter(n => n.type === 'my_overdue_payment').length,
          my_upcoming_payment: notifications.filter(n => n.type === 'my_upcoming_payment').length,
          my_loan_request: notifications.filter(n => n.type === 'my_loan_request').length
        },
        lastUpdated: new Date().toISOString()
      };

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Error obteniendo estadísticas de notificaciones:', error);
      next(error);
    }
  }
}

module.exports = new NotificationsController();