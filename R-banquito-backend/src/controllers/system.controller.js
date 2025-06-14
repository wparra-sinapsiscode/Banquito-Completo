const { SystemSettings, Member, Loan, PaymentHistory } = require('../models');
const calculationService = require('../services/calculation.service');
const logger = require('../utils/logger');

class SystemController {
  async getSettings(req, res, next) {
    try {
      logger.info('Fetching system settings from database...');
      const settingsData = await SystemSettings.findAll();
      logger.info(`Found ${settingsData.length} settings in database`);
      
      const settings = {};
      settingsData.forEach(setting => {
        try {
          let value = setting.value;
          
          // Handle double-quoted strings (like "wednesday" -> wednesday)
          if (typeof value === 'string') {
            // If it's a JSON object/array, parse it
            if (value.startsWith('{') || value.startsWith('[')) {
              value = JSON.parse(value);
            }
            // If it's a quoted string, remove quotes
            else if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1);
            }
            // Try to parse numbers
            else if (!isNaN(value) && !isNaN(parseFloat(value))) {
              value = parseFloat(value);
            }
          }
          
          settings[setting.key] = value;
          logger.info(`Parsed setting ${setting.key}:`, value);
        } catch (parseError) {
          logger.error(`Error parsing setting ${setting.key}:`, parseError);
          settings[setting.key] = setting.value;
        }
      });
      
      logger.info('Processed settings:', settings);
      
      if (Object.keys(settings).length === 0) {
        logger.info('No settings found in database, creating default settings...');
        const defaultSettings = {
          shareValue: 500,
          loanLimits: {
            individual: 8000,
            guaranteePercentage: 80
          },
          monthlyInterestRates: {
            high: 3,
            medium: 5,
            low: 10
          },
          operationDay: 'wednesday',
          delinquencyRate: 5.0
        };
        
        for (const [key, value] of Object.entries(defaultSettings)) {
          await SystemSettings.create({
            key: key,
            value: value
          });
          settings[key] = value;
        }
        logger.info('Default settings created successfully');
      }
      
      logger.info('Sending settings response:', settings);
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      logger.error('Error obteniendo configuraciones:', error);
      next(error);
    }
  }
  
  async updateSettings(req, res, next) {
    try {
      const updates = req.body;
      
      logger.info('🔄 Datos recibidos en backend:', updates);
      logger.info('🔄 Tipo de datos:', typeof updates);
      logger.info('🔄 Keys recibidas:', Object.keys(updates));
      logger.info('🔄 Usuario autenticado:', req.user);
      
      for (const [key, value] of Object.entries(updates)) {
        const [setting, created] = await SystemSettings.findOrCreate({
          where: { key },
          defaults: { key, value }
        });
        
        if (!created) {
          await setting.update({ value });
        }
      }
      
      logger.info(`Configuraciones actualizadas por ${req.user?.username || 'usuario anónimo'}`);
      
      // Obtener configuraciones actualizadas usando la misma lógica que getSettings
      const settingsData = await SystemSettings.findAll();
      const updatedSettings = {};
      settingsData.forEach(setting => {
        try {
          let value = setting.value;
          
          // Handle double-quoted strings (like "wednesday" -> wednesday)
          if (typeof value === 'string') {
            // If it's a JSON object/array, parse it
            if (value.startsWith('{') || value.startsWith('[')) {
              value = JSON.parse(value);
            }
            // If it's a quoted string, remove quotes
            else if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1);
            }
            // Try to parse numbers
            else if (!isNaN(value) && !isNaN(parseFloat(value))) {
              value = parseFloat(value);
            }
          }
          
          updatedSettings[setting.key] = value;
        } catch (parseError) {
          logger.error(`Error parsing setting ${setting.key}:`, parseError);
          updatedSettings[setting.key] = setting.value;
        }
      });
      
      res.json({
        success: true,
        data: updatedSettings,
        message: 'Configuraciones actualizadas exitosamente'
      });
    } catch (error) {
      logger.error('Error actualizando configuraciones:', error);
      next(error);
    }
  }
  
  async getStatistics(req, res, next) {
    try {
      const members = await Member.findAll({
        include: ['savingsPlan']
      });
      
      const loans = await Loan.findAll({
        include: [
          {
            model: PaymentHistory,
            as: 'payments'
          },
          {
            model: Member,
            as: 'member'
          }
        ]
      });
      
      const settingsData = await SystemSettings.findAll();
      const settings = {};
      settingsData.forEach(setting => {
        settings[setting.key] = setting.value;
      });
      
      const statistics = calculationService.calculateBankingStatistics(members, loans, settings);
      
      const additionalStats = {
        loansByStatus: {
          active: loans.filter(loan => loan.status === 'active').length,
          paid: loans.filter(loan => loan.status === 'paid').length,
          overdue: loans.filter(loan => loan.status === 'overdue').length
        },
        membersByRating: {
          green: members.filter(member => member.credit_rating === 'green').length,
          yellow: members.filter(member => member.credit_rating === 'yellow').length,
          red: members.filter(member => member.credit_rating === 'red').length
        },
        averageScoreByRating: {
          green: this.calculateAverageScore(members.filter(m => m.credit_rating === 'green')),
          yellow: this.calculateAverageScore(members.filter(m => m.credit_rating === 'yellow')),
          red: this.calculateAverageScore(members.filter(m => m.credit_rating === 'red'))
        },
        monthlyPayments: this.calculateMonthlyPayments(loans),
        overdueLoans: this.getOverdueLoans(loans),
        topBorrowers: this.getTopBorrowers(members, loans).slice(0, 5)
      };
      
      res.json({
        success: true,
        data: {
          ...statistics,
          ...additionalStats,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      next(error);
    }
  }
  
  async getSettingsData() {
    const settingsData = await SystemSettings.findAll();
    const settings = {};
    settingsData.forEach(setting => {
      try {
        let value = setting.value;
        
        // Handle double-quoted strings (like "wednesday" -> wednesday)
        if (typeof value === 'string') {
          // If it's a JSON object/array, parse it
          if (value.startsWith('{') || value.startsWith('[')) {
            value = JSON.parse(value);
          }
          // If it's a quoted string, remove quotes
          else if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          // Try to parse numbers
          else if (!isNaN(value) && !isNaN(parseFloat(value))) {
            value = parseFloat(value);
          }
        }
        
        settings[setting.key] = value;
      } catch (parseError) {
        logger.error(`Error parsing setting ${setting.key}:`, parseError);
        settings[setting.key] = setting.value;
      }
    });
    return settings;
  }
  
  calculateAverageScore(members) {
    if (members.length === 0) return 0;
    const total = members.reduce((sum, member) => sum + member.credit_score, 0);
    return Math.round(total / members.length);
  }
  
  calculateMonthlyPayments(loans) {
    const activeLoans = loans.filter(loan => loan.status === 'active');
    return activeLoans.reduce((total, loan) => total + loan.monthly_payment, 0);
  }
  
  getOverdueLoans(loans) {
    const today = new Date();
    return loans.filter(loan => {
      if (loan.status !== 'active') return false;
      const dueDate = new Date(loan.due_date);
      return today > dueDate;
    }).map(loan => ({
      id: loan.id,
      memberName: loan.member?.name,
      amount: loan.remaining_amount,
      dueDate: loan.due_date,
      daysOverdue: Math.floor((today - new Date(loan.due_date)) / (1000 * 60 * 60 * 24))
    }));
  }
  
  getTopBorrowers(members, loans) {
    return members.map(member => {
      const memberLoans = loans.filter(loan => loan.member_id === member.id);
      const totalBorrowed = memberLoans.reduce((sum, loan) => sum + loan.original_amount, 0);
      const activeLoanCount = memberLoans.filter(loan => loan.status === 'active').length;
      
      return {
        id: member.id,
        name: member.name,
        totalBorrowed,
        activeLoanCount,
        creditRating: member.credit_rating,
        creditScore: member.credit_score
      };
    }).sort((a, b) => b.totalBorrowed - a.totalBorrowed);
  }
}

module.exports = new SystemController();