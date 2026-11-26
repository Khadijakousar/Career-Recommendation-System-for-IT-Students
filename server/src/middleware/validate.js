import { HttpError } from './errorHandler.js';

export function validate(schema) {
  return (request, _response, next) => {
    const result = schema.safeParse({
      body: request.body,
      params: request.params,
      query: request.query,
    });

    if (result.success) {
      request.validated = result.data;
      return next();
    }

    const fields = {};
    for (const issue of result.error.issues) {
      const field = issue.path.slice(1).join('.') || String(issue.path[0]);
      fields[field] ??= issue.message;
    }

    return next(new HttpError(400, 'Invalid request', fields));
  };
}
