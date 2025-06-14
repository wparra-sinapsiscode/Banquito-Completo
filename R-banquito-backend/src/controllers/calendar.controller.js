const { Member, Loan, LoanRequest, PaymentHistory, SystemSettings } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class CalendarController {
  async getCalendarEvents(req, res, next) {
    try {
      const { 
        startDate, 
        endDate, 
        type = 'all',
        memberId 
      } = req.query;

      // Fechas por defecto: mes actual
      const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

      const events = [];

      // 1. Eventos de vencimientos de préstamos
      if (type === 'all' || type === 'payments') {
        const loanPayments = await this.getLoanPaymentEvents(start, end, memberId);
        events.push(...loanPayments);
      }

      // 2. Eventos del sistema (día de operaciones)
      if (type === 'all' || type === 'system') {
        const systemEvents = await this.getSystemEvents(start, end);
        events.push(...systemEvents);
      }

      // 3. Eventos de solicitudes y aprobaciones
      if (type === 'all' || type === 'requests') {
        const requestEvents = await this.getRequestEvents(start, end, memberId);
        events.push(...requestEvents);
      }

      // 4. Eventos de pagos realizados
      if (type === 'all' || type === 'payments_made') {
        const paymentEvents = await this.getPaymentEvents(start, end, memberId);
        events.push(...paymentEvents);
      }

      // Ordenar eventos por fecha
      events.sort((a, b) => new Date(a.start) - new Date(b.start));

      res.json({
        success: true,
        data: {
          events,
          period: {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
          },
          filters: {
            type,
            memberId
          },
          totalEvents: events.length
        }
      });

    } catch (error) {
      logger.error('Error obteniendo eventos del calendario:', error);
      next(error);
    }
  }

  async getLoanPaymentEvents(startDate, endDate, memberId = null) {
    try {
      let whereClause = {
        next_payment_date: {
          [Op.between]: [startDate, endDate]
        },
        status: { [Op.in]: ['current', 'overdue'] }
      };

      if (memberId) {
        whereClause.member_id = memberId;
      }

      const loans = await Loan.findAll({
        where: whereClause,
        include: [
          {
            model: Member,
            as: 'member',
            attributes: ['id', 'name', 'phone', 'credit_rating']
          }
        ]
      });

      return loans.map(loan => {
        const dueDate = new Date(loan.next_payment_date);
        const today = new Date();
        const isOverdue = dueDate < today;
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        let eventColor = '#28a745'; // Verde por defecto
        let title = 'Pago programado';

        if (isOverdue) {
          eventColor = '#dc3545'; // Rojo para vencidos
          title = 'Pago vencido';
        } else if (daysUntilDue <= 1) {
          eventColor = '#ffc107'; // Amarillo para próximos a vencer
          title = 'Pago próximo';
        }

        return {
          id: `payment_${loan.id}`,
          title: `${title} - ${loan.member.name}`,
          start: loan.next_payment_date,
          end: loan.next_payment_date,
          allDay: true,
          type: 'payment_due',
          color: eventColor,
          extendedProps: {
            loanId: loan.id,
            memberId: loan.member.id,
            memberName: loan.member.name,
            memberPhone: loan.member.phone,
            creditRating: loan.member.credit_rating,
            paymentAmount: parseFloat(loan.weekly_payment || loan.monthly_payment || 0),
            originalAmount: parseFloat(loan.original_amount),
            remainingAmount: parseFloat(loan.remaining_amount),
            status: loan.status,
            isOverdue,
            daysUntilDue: isOverdue ? Math.abs(daysUntilDue) : daysUntilDue,
            description: isOverdue 
              ? `Pago vencido hace ${Math.abs(daysUntilDue)} días`
              : `Vence en ${daysUntilDue} días`
          }
        };
      });

    } catch (error) {
      logger.error('Error obteniendo eventos de pagos:', error);
      return [];
    }
  }

  async getSystemEvents(startDate, endDate) {
    try {
      const systemSettings = await SystemSettings.findOne();
      const operationDay = systemSettings?.operation_day || 'wednesday';

      // Mapeo de días
      const dayMap = {
        'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
        'thursday': 4, 'friday': 5, 'saturday': 6
      };

      const targetDay = dayMap[operationDay];
      const events = [];

      // Generar eventos para cada día de operación en el rango
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        if (currentDate.getDay() === targetDay) {
          events.push({
            id: `operation_${currentDate.toISOString().split('T')[0]}`,
            title: 'Día de Operaciones',
            start: currentDate.toISOString().split('T')[0],
            end: currentDate.toISOString().split('T')[0],
            allDay: true,
            type: 'system_operation',
            color: '#17a2b8',
            extendedProps: {
              description: 'Día designado para pagos y desembolsos',
              operationDay: operationDay
            }
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return events;

    } catch (error) {
      logger.error('Error obteniendo eventos del sistema:', error);
      return [];
    }
  }

  async getRequestEvents(startDate, endDate, memberId = null) {
    try {
      let whereClause = {
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      };

      if (memberId) {
        whereClause.member_id = memberId;
      }

      const requests = await LoanRequest.findAll({
        where: whereClause,
        include: [
          {
            model: Member,
            as: 'member',
            attributes: ['id', 'name', 'credit_rating']
          }
        ]
      });

      return requests.map(request => {
        let eventColor = '#6c757d'; // Gris por defecto
        let title = 'Solicitud';

        switch (request.status) {
          case 'pending':
            eventColor = '#ffc107'; // Amarillo para pendientes
            title = 'Solicitud pendiente';
            break;
          case 'approved':
            eventColor = '#28a745'; // Verde para aprobadas
            title = 'Solicitud aprobada';
            break;
          case 'rejected':
            eventColor = '#dc3545'; // Rojo para rechazadas
            title = 'Solicitud rechazada';
            break;
        }

        return {
          id: `request_${request.id}`,
          title: `${title} - ${request.member.name}`,
          start: request.created_at.toISOString().split('T')[0],
          end: request.created_at.toISOString().split('T')[0],
          allDay: true,
          type: 'loan_request',
          color: eventColor,
          extendedProps: {
            requestId: request.id,
            memberId: request.member.id,
            memberName: request.member.name,
            creditRating: request.member.credit_rating,
            amount: parseFloat(request.amount),
            purpose: request.purpose,
            status: request.status,
            description: `Solicitud de S/ ${request.amount} - ${request.status}`
          }
        };
      });

    } catch (error) {
      logger.error('Error obteniendo eventos de solicitudes:', error);
      return [];
    }
  }

  async getPaymentEvents(startDate, endDate, memberId = null) {
    try {
      let whereClause = {
        payment_date: {
          [Op.between]: [startDate, endDate]
        }
      };

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
                attributes: ['id', 'name']
              }
            ]
          }
        ]
      });

      // Filtrar por miembro si se especifica
      let filteredPayments = payments;
      if (memberId) {
        filteredPayments = payments.filter(payment => 
          payment.loan.member.id === parseInt(memberId)
        );
      }

      return filteredPayments.map(payment => {
        let eventColor = '#28a745'; // Verde para pagos

        // Cambiar color según tipo de pago
        switch (payment.payment_type) {
          case 'late':
            eventColor = '#fd7e14'; // Naranja para pagos tardíos
            break;
          case 'advance':
            eventColor = '#20c997'; // Verde claro para pagos adelantados
            break;
          default:
            eventColor = '#28a745'; // Verde para pagos regulares
        }

        return {
          id: `payment_made_${payment.id}`,
          title: `Pago realizado - ${payment.loan.member.name}`,
          start: payment.payment_date.toISOString().split('T')[0],
          end: payment.payment_date.toISOString().split('T')[0],
          allDay: true,
          type: 'payment_made',
          color: eventColor,
          extendedProps: {
            paymentId: payment.id,
            loanId: payment.loan.id,
            memberId: payment.loan.member.id,
            memberName: payment.loan.member.name,
            amount: parseFloat(payment.amount),
            paymentType: payment.payment_type,
            lateFee: parseFloat(payment.late_fee || 0),
            notes: payment.notes,
            description: `Pago de S/ ${payment.amount} ${payment.payment_type === 'late' ? '(con recargo)' : ''}`
          }
        };
      });

    } catch (error) {
      logger.error('Error obteniendo eventos de pagos realizados:', error);
      return [];
    }
  }

  async getUpcomingEvents(req, res, next) {
    try {
      const { days = 7 } = req.query;
      const today = new Date();
      const futureDate = new Date(today.getTime() + parseInt(days) * 24 * 60 * 60 * 1000);

      // Solo eventos futuros
      const events = [];

      // Próximos vencimientos
      const upcomingPayments = await this.getLoanPaymentEvents(today, futureDate);
      events.push(...upcomingPayments.filter(event => new Date(event.start) >= today));

      // Eventos del sistema
      const systemEvents = await this.getSystemEvents(today, futureDate);
      events.push(...systemEvents);

      // Ordenar por fecha más próxima
      events.sort((a, b) => new Date(a.start) - new Date(b.start));

      res.json({
        success: true,
        data: {
          events: events.slice(0, 10), // Máximo 10 eventos próximos
          period: {
            start: today.toISOString().split('T')[0],
            end: futureDate.toISOString().split('T')[0]
          },
          totalEvents: events.length
        }
      });

    } catch (error) {
      logger.error('Error obteniendo próximos eventos:', error);
      next(error);
    }
  }

  async getEventsByDate(req, res, next) {
    try {
      const { date } = req.params;
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000);

      const events = [];

      // Todos los tipos de eventos para esa fecha específica
      const [paymentEvents, systemEvents, requestEvents, paymentMadeEvents] = await Promise.all([
        this.getLoanPaymentEvents(targetDate, targetDate),
        this.getSystemEvents(targetDate, targetDate),
        this.getRequestEvents(targetDate, nextDay),
        this.getPaymentEvents(targetDate, nextDay)
      ]);

      events.push(...paymentEvents, ...systemEvents, ...requestEvents, ...paymentMadeEvents);

      // Ordenar por tipo y prioridad
      events.sort((a, b) => {
        const typeOrder = { 'payment_due': 1, 'system_operation': 2, 'loan_request': 3, 'payment_made': 4 };
        return typeOrder[a.type] - typeOrder[b.type];
      });

      res.json({
        success: true,
        data: {
          date: date,
          events,
          totalEvents: events.length
        }
      });

    } catch (error) {
      logger.error('Error obteniendo eventos por fecha:', error);
      next(error);
    }
  }
}

module.exports = new CalendarController();