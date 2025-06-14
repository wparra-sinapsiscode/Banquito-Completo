const { User, Member } = require('../models');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class UsersController {
  async getUsers(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 50, 
        search = '', 
        role = '',
        active = '',
        orderBy = 'username',
        orderDir = 'ASC'
      } = req.query;
      
      const whereClause = {};
      
      // Filtros de búsqueda
      if (search) {
        whereClause[Op.or] = [
          { username: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      if (role) {
        whereClause.role = role;
      }

      if (active !== '') {
        whereClause.active = active === 'true';
      }
      
      const users = await User.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Member,
            as: 'member',
            required: false,
            attributes: ['id', 'name', 'dni', 'shares']
          }
        ],
        attributes: { exclude: ['password'] }, // No devolver contraseñas
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [[orderBy, orderDir.toUpperCase()]]
      });
      
      res.json({
        success: true,
        data: users.rows,
        pagination: {
          total: users.count,
          page: parseInt(page),
          pages: Math.ceil(users.count / parseInt(limit)),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      logger.error('Error obteniendo usuarios:', error);
      next(error);
    }
  }
  
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      
      const user = await User.findByPk(id, {
        include: [
          {
            model: Member,
            as: 'member',
            required: false
          }
        ],
        attributes: { exclude: ['password'] }
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Error obteniendo usuario por ID:', error);
      next(error);
    }
  }
  
  async createUser(req, res, next) {
    try {
      const {
        username,
        email,
        password,
        role = 'member',
        active = true,
        member_id
      } = req.body;

      // Validaciones básicas
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email y password son requeridos'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
      }

      // Verificar si ya existe un usuario con ese username o email
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { username },
            { email }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un usuario con ese username o email'
        });
      }

      // Si se especifica member_id, verificar que existe y no tiene usuario
      if (member_id) {
        const member = await Member.findByPk(member_id);
        if (!member) {
          return res.status(400).json({
            success: false,
            message: 'El miembro especificado no existe'
          });
        }

        const memberHasUser = await User.findOne({ where: { member_id } });
        if (memberHasUser) {
          return res.status(400).json({
            success: false,
            message: 'El miembro ya tiene un usuario asociado'
          });
        }
      }

      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(password, 12);

      // Crear usuario
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        role,
        active,
        member_id: member_id || null
      });

      // Obtener usuario creado sin password
      const createdUser = await User.findByPk(user.id, {
        include: [
          {
            model: Member,
            as: 'member',
            required: false
          }
        ],
        attributes: { exclude: ['password'] }
      });

      logger.info(`Usuario ${username} creado exitosamente por admin ${req.user.username}`);

      res.status(201).json({
        success: true,
        data: createdUser,
        message: 'Usuario creado exitosamente'
      });
    } catch (error) {
      logger.error('Error creando usuario:', error);
      next(error);
    }
  }
  
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // No permitir actualizar contraseña por esta ruta
      delete updateData.password;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Si se cambia username o email, verificar unicidad
      if (updateData.username && updateData.username !== user.username) {
        const existingUser = await User.findOne({ 
          where: { 
            username: updateData.username,
            id: { [Op.ne]: id }
          } 
        });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe un usuario con ese username'
          });
        }
      }

      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findOne({ 
          where: { 
            email: updateData.email,
            id: { [Op.ne]: id }
          } 
        });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe un usuario con ese email'
          });
        }
      }

      // Verificar member_id si se está actualizando
      if (updateData.member_id && updateData.member_id !== user.member_id) {
        const member = await Member.findByPk(updateData.member_id);
        if (!member) {
          return res.status(400).json({
            success: false,
            message: 'El miembro especificado no existe'
          });
        }

        const memberHasUser = await User.findOne({ 
          where: { 
            member_id: updateData.member_id,
            id: { [Op.ne]: id }
          } 
        });
        if (memberHasUser) {
          return res.status(400).json({
            success: false,
            message: 'El miembro ya tiene otro usuario asociado'
          });
        }
      }

      await user.update(updateData);

      const updatedUser = await User.findByPk(id, {
        include: [
          {
            model: Member,
            as: 'member',
            required: false
          }
        ],
        attributes: { exclude: ['password'] }
      });

      logger.info(`Usuario ${user.username} actualizado por admin ${req.user.username}`);

      res.json({
        success: true,
        data: updatedUser,
        message: 'Usuario actualizado exitosamente'
      });
    } catch (error) {
      logger.error('Error actualizando usuario:', error);
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Solo admins pueden cambiar contraseñas de otros usuarios
      // Los usuarios solo pueden cambiar su propia contraseña
      if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para cambiar esta contraseña'
        });
      }

      // Si no es admin, verificar contraseña actual
      if (req.user.role !== 'admin' && currentPassword) {
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
          return res.status(400).json({
            success: false,
            message: 'La contraseña actual no es correcta'
          });
        }
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await user.update({ password: hashedPassword });

      logger.info(`Contraseña del usuario ${user.username} cambiada por ${req.user.username}`);

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      logger.error('Error cambiando contraseña:', error);
      next(error);
    }
  }
  
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      
      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // No permitir eliminar el propio usuario
      if (req.user.id === parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: 'No puedes eliminar tu propio usuario'
        });
      }

      await user.destroy();

      logger.info(`Usuario ${user.username} eliminado por admin ${req.user.username}`);

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      logger.error('Error eliminando usuario:', error);
      next(error);
    }
  }

  async toggleUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // No permitir desactivar el propio usuario
      if (req.user.id === parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: 'No puedes desactivar tu propio usuario'
        });
      }

      await user.update({ active: !user.active });

      const action = user.active ? 'activado' : 'desactivado';
      logger.info(`Usuario ${user.username} ${action} por admin ${req.user.username}`);

      res.json({
        success: true,
        message: `Usuario ${action} exitosamente`,
        data: { active: user.active }
      });
    } catch (error) {
      logger.error('Error cambiando estado del usuario:', error);
      next(error);
    }
  }
}

module.exports = new UsersController();