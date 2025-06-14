// Logger simple sin Winston para evitar problemas con filesystem en Vercel
const logger = {
  info: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp,
      service: 'banquito-backend',
      ...meta
    }));
  },
  
  error: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.error(JSON.stringify({
      level: 'error',
      message,
      timestamp,
      service: 'banquito-backend',
      ...meta
    }));
  },
  
  warn: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      timestamp,
      service: 'banquito-backend',
      ...meta
    }));
  },
  
  debug: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify({
        level: 'debug',
        message,
        timestamp,
        service: 'banquito-backend',
        ...meta
      }));
    }
  }
};

module.exports = logger;