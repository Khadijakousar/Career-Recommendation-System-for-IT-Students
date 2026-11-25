export class HttpError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

export function errorHandler(error, _request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  if (error instanceof HttpError) {
    return response.status(error.status).json({
      error: { message: error.message, fields: error.fields },
    });
  }

  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({ error: { message: 'Invalid JSON' } });
  }

  if (error.type === 'entity.too.large') {
    return response
      .status(413)
      .json({ error: { message: 'Request body is too large' } });
  }

  console.error('Request failed', error.name);
  return response
    .status(500)
    .json({ error: { message: 'Something went wrong' } });
}
