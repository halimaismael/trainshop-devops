/*const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

module.exports = pool;
*/
/*DB FAKE */
if (process.env.CI === 'true' || process.env.NODE_ENV === 'test') {
  console.log('[DB MOCK] CI MODE ACTIVATED');

  module.exports = {
    query: async () => {
      return {
        rows: [],
        rowCount: 0
      };
    }
  };

} else {
  const { Pool } = require('pg');

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'trainshop',
    port: 5432
  });

  module.exports = pool;
}