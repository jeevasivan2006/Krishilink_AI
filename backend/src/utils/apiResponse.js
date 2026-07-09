export const success = (res, data = null, message = 'Success') => {
  res.status(200).json({
    status: 'success',
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

export const created = (res, data = null, message = 'Created') => {
  res.status(201).json({
    status: 'success',
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

export const clientError = (res, message = 'Bad Request', statusCode = 400) => {
  res.status(statusCode).json({
    status: 'error',
    message,
    timestamp: new Date().toISOString(),
  });
};

export const unauthorized = (res, message = 'Unauthorized') => {
  res.status(401).json({
    status: 'error',
    message,
    timestamp: new Date().toISOString(),
  });
};

export const forbidden = (res, message = 'Forbidden') => {
  res.status(403).json({
    status: 'error',
    message,
    timestamp: new Date().toISOString(),
  });
};

export const notFound = (res, message = 'Not Found') => {
  res.status(404).json({
    status: 'error',
    message,
    timestamp: new Date().toISOString(),
  });
};

export const serverError = (res, message = 'Internal Server Error') => {
  res.status(500).json({
    status: 'error',
    message,
    timestamp: new Date().toISOString(),
  });
};

export const conflict = (res, message = 'Conflict') => {
  res.status(409).json({
    status: 'error',
    message,
    timestamp: new Date().toISOString(),
  });
};

export const unprocessable = (res, message = 'Unprocessable Entity') => {
  res.status(422).json({
    status: 'error',
    message,
    timestamp: new Date().toISOString(),
  });
};

/** @deprecated Use success() or created() instead */
export const successResponse = (res, data = null, statusCode = 200) => {
  const message = statusCode === 201 ? 'Created' : 'Success';
  if (statusCode === 201) return created(res, data, message);
  return success(res, data, message);
};

/** @deprecated Use clientError() or let errorHandler handle errors */
export const errorResponse = (res, err, statusCode = 500) => {
  const code = err?.status || err?.statusCode || statusCode;
  const message = err?.message || 'Internal Server Error';
  return clientError(res, message, code);
};
