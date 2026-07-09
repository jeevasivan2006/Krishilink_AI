import logger from '../config/logger.js';

export default (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  
  // Log the error
  logger.error(`${req.method} ${req.url} - ${statusCode} - ${err.message}`, { stack: err.stack });

  const response = {
    status: 'error',
    message: statusCode >= 500 && process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
    response.stack = err.stack;
  }
  
  res.status(statusCode).json(response);
};
