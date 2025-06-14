const { Member, SavingsPlan, User, Loan, LoanRequest } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

class MembersController {
  async getMembers(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 50, 
        search = '', 
        creditRating = '',
        orderBy = 'name',
        orderDir = 'ASC'
      } = req.query;
      
      const whereClause = {};
      
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { dni: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      if (creditRating) {
        whereClause.credit_rating = creditRating;
      }
      
      const members = await Member.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: SavingsPlan,
            as: 'savingsPlan'
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'role']
          },
          {
            model: Loan,
            as: 'loans',
            where: { status: { [Op.ne]: 'paid' } },
            required: false,
            attributes: ['id', 'original_amount', 'remaining_amount', 'status']
          }
        ],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [[orderBy, orderDir.toUpperCase()]]
      });
      
      res.json({
        success: true,
        data: members.rows,
        pagination: {
          total: members.count,
          page: parseInt(page),
          pages: Math.ceil(members.count / parseInt(limit)),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Error obteniendo miembros:', error);
      next(error);
    }
  }
  
  async getMemberById(req, res, next) {
    try {
      const { id } = req.params;
      
      const member = await Member.findByPk(id, {
        include: [
          {
            model: SavingsPlan,
            as: 'savingsPlan'
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'role']
          },
          {
            model: Loan,
            as: 'loans',
            include: ['payments']
          },
          {
            model: LoanRequest,
            as: 'loanRequests'
          }
        ]
      });
      
      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Miembro no encontrado'
        });
      }
      
      res.json({
        success: true,
        data: member
      });
    } catch (error) {
      logger.error('Error obteniendo miembro por ID:', error);
      next(error);
    }
  }
  
  async createMember(req, res, next) {
    try {
      const {
        name,
        dni,
        shares = 0,
        guarantee = 0,
        credit_rating = 'yellow',
        credit_score = 50,
        phone,
        email,
        username,
        password,
        savingsPlan
      } = req.body;
      
      logger.info(`📥 Iniciando creación de miembro: ${name}`);
      logger.info(`📥 Datos recibidos - Username: ${username ? 'Sí' : 'No'}, Password: ${password ? 'Sí' : 'No'}`);
      logger.info(`📥 Body completo:`, JSON.stringify(req.body, null, 2));
      
      const existingMember = await Member.findOne({ where: { dni } });
      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un miembro con este DNI'
        });
      }
      
      const member = await Member.create({
        name,
        dni,
        shares,
        guarantee,
        credit_rating,
        credit_score,
        phone,
        email
      });
      
      logger.info(`✅ Miembro creado con ID: ${member.id}`);
      
      if (savingsPlan && savingsPlan.enabled) {
        await SavingsPlan.create({
          member_id: member.id,
          enabled: savingsPlan.enabled,
          plan_days: savingsPlan.planDays || 180,
          start_date: savingsPlan.startDate || new Date(),
          tea: savingsPlan.TEA || 0.02
        });
        logger.info(`✅ Plan de ahorro creado para miembro ${member.id}`);
      }
      
      const createdMember = await Member.findByPk(member.id, {
        include: ['savingsPlan']
      });
      
      // Crear usuario asociado si se proporcionaron credenciales
      if (username && password) {
        logger.info(`🔐 Iniciando creación de usuario para miembro ${name}`);
        logger.info(`🔐 Username a crear: ${username}`);
        
        try {
          // Verificar que el username no exista
          logger.info(`🔍 Verificando si existe el username: ${username}`);
          const existingUser = await User.findOne({ where: { username } });
          
          if (existingUser) {
            logger.error(`❌ El username ${username} ya existe`);
            // Si el usuario ya existe, eliminar el miembro creado
            await member.destroy();
            return res.status(400).json({
              success: false,
              message: 'El nombre de usuario ya existe'
            });
          }
          
          logger.info(`✅ Username ${username} disponible`);
          
          // Crear usuario
          const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
          logger.info(`🔐 Generando hash con ${saltRounds} rondas`);
          const hashedPassword = await bcrypt.hash(password, saltRounds);
          logger.info(`✅ Hash generado correctamente`);
          
          const userData = {
            username,
            password_hash: hashedPassword,
            role: 'member',
            member_id: member.id,
            name: member.name
          };
          
          logger.info(`📝 Datos del usuario a crear:`, JSON.stringify(userData, null, 2));
          
          const newUser = await User.create(userData);
          
          logger.info(`✅ Usuario creado exitosamente con ID: ${newUser.id}`);
          logger.info(`✅ Usuario ${username} creado para miembro ${name} (ID: ${member.id})`);
          
        } catch (userError) {
          // Si falla la creación del usuario, eliminar el miembro
          logger.error(`❌ Error detallado creando usuario para miembro ${name}:`, userError);
          logger.error(`❌ Stack trace:`, userError.stack);
          await member.destroy();
          throw userError;
        }
      } else {
        logger.info(`⚠️ No se proporcionaron credenciales para crear usuario`);
      }
      
      logger.info(`Miembro ${name} creado exitosamente por usuario ${req.user.username}`);
      
      res.status(201).json({
        success: true,
        data: createdMember,
        message: 'Miembro creado exitosamente'
      });
    } catch (error) {
      logger.error('Error creando miembro:', error);
      next(error);
    }
  }
  
  async updateMember(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      logger.info('📥 updateMember - Datos recibidos:', {
        memberId: id,
        updateData,
        user: req.user?.username
      });
      
      const member = await Member.findByPk(id);
      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Miembro no encontrado'
        });
      }
      
      logger.info('🔍 updateMember - Estado actual del miembro:', {
        currentCreditRating: member.credit_rating,
        currentCreditScore: member.credit_score,
        newCreditRating: updateData.credit_rating,
        newCreditScore: updateData.credit_score
      });
      
      if (updateData.dni && updateData.dni !== member.dni) {
        const existingMember = await Member.findOne({ 
          where: { 
            dni: updateData.dni,
            id: { [Op.ne]: id }
          } 
        });
        if (existingMember) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe un miembro con este DNI'
          });
        }
      }
      
      // Forzar actualización de todos los campos, incluso si no hay cambios
      await member.update(updateData, { 
        fields: Object.keys(updateData), // Especificar exactamente qué campos actualizar
        validate: true,
        silent: false, // Asegurar que se ejecute el UPDATE
        individualHooks: false // No ejecutar hooks individuales para mejor rendimiento
      });
      
      // También actualizar directamente los valores en la instancia
      Object.keys(updateData).forEach(key => {
        member[key] = updateData[key];
      });
      await member.save();
      
      logger.info('✅ updateMember - Actualización exitosa en BD:', {
        memberId: id,
        updatedFields: updateData
      });
      
      const updatedMember = await Member.findByPk(id, {
        include: ['savingsPlan', 'user']
      });
      
      logger.info(`Miembro ${member.name} actualizado por usuario ${req.user.username}`);
      
      res.json({
        success: true,
        data: updatedMember,
        message: 'Miembro actualizado exitosamente'
      });
    } catch (error) {
      logger.error('Error actualizando miembro:', error);
      next(error);
    }
  }
  
  async updateSavingsPlan(req, res, next) {
    try {
      const { id } = req.params;
      const { enabled, planDays, startDate, TEA } = req.body;
      
      const member = await Member.findByPk(id);
      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Miembro no encontrado'
        });
      }
      
      let savingsPlan = await SavingsPlan.findOne({ where: { member_id: id } });
      
      if (savingsPlan) {
        await savingsPlan.update({
          enabled,
          plan_days: planDays,
          start_date: startDate,
          tea: TEA
        });
      } else {
        savingsPlan = await SavingsPlan.create({
          member_id: id,
          enabled,
          plan_days: planDays,
          start_date: startDate,
          tea: TEA
        });
      }
      
      logger.info(`Plan de ahorro del miembro ${member.name} actualizado por usuario ${req.user.username}`);
      
      res.json({
        success: true,
        data: savingsPlan,
        message: 'Plan de ahorro actualizado exitosamente'
      });
    } catch (error) {
      logger.error('Error actualizando plan de ahorro:', error);
      next(error);
    }
  }
  
  async deleteMember(req, res, next) {
    try {
      const { id } = req.params;
      
      const member = await Member.findByPk(id, {
        include: ['loans', 'loanRequests']
      });
      
      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Miembro no encontrado'
        });
      }
      
      const activeLoans = member.loans?.filter(loan => loan.status !== 'paid') || [];
      const pendingRequests = member.loanRequests?.filter(req => req.status === 'pending') || [];
      
      if (activeLoans.length > 0 || pendingRequests.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar un miembro con préstamos activos o solicitudes pendientes'
        });
      }
      
      // Buscar y eliminar el usuario asociado al miembro
      const user = await User.findOne({ where: { member_id: id } });
      if (user) {
        await user.destroy();
        logger.info(`Usuario ${user.username} asociado al miembro ${member.name} eliminado`);
      }
      
      // Ahora eliminar el miembro
      await member.destroy();
      
      logger.info(`Miembro ${member.name} eliminado por usuario ${req.user.username}`);
      
      res.json({
        success: true,
        message: 'Miembro eliminado exitosamente'
      });
    } catch (error) {
      logger.error('Error eliminando miembro:', error);
      next(error);
    }
  }
}

module.exports = new MembersController();