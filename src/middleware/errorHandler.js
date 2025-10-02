export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details
    });
  }

  if (err.name === 'UnauthorizedError' || err.message === 'Unauthorized') {
    return res.status(401).json({
      error: 'Unauthorized'
    });
  }

  if (err.name === 'ForbiddenError' || err.message === 'Forbidden') {
    return res.status(403).json({
      error: 'Forbidden'
    });
  }

  if (err.name === 'NotFoundError' || err.message === 'Not Found') {
    return res.status(404).json({
      error: 'Not Found'
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
};