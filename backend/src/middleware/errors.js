export function notFound(req, res) { res.status(404).json({ error: 'not_found' }); }
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err.name === 'ZodError') return res.status(400).json({ error: 'invalid_request', details: err.issues });
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'already_exists' });
  console.error(err);
  res.status(500).json({ error: 'internal_server_error' });
}
