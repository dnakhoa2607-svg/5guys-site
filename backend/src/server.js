import app from './app.js';
import env from './config.js';
import db, { ensureSchemaReady } from './db.js';

try {
  await db.query('SELECT 1');
  await ensureSchemaReady();
  const server=app.listen(env.PORT,()=>console.log(`5GUYS API listening on port ${env.PORT}`));
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(async()=>{await db.end();process.exit(0);}));
} catch(error) {
  console.error('Database connection failed:',error.message);
  process.exit(1);
}
