const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    logger.warn('Errores de validación:', { 
      path: req.path, 
      method: req.method, 
      body: req.body,
      errors: errorMessages 
    });
    
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errorMessages
    });
  }
  
  next();
};

module.exports = { handleValidationErrors };