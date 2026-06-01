const isCI = process.env.CI === 'true';

const express = require('express');
const cors = require('cors');
/*const pool = require('./db');*/

const isCI = process.env.CI === 'true';

let pool = null;

if (!isCI) {
  pool = require('./db');
}

// Ajout Metrics

const {
  metrics,
  recordRequest,
  averageResponseTime,
  p95ResponseTime
} = require('./metrics');


const app = express();

app.use(cors());
app.use(express.json());

//Log des requêtes
// Logs + métriques des requêtes
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    // métriques
    //recordRequest(res.statusCode, duration);
    try {
  recordRequest(res.statusCode, duration);
} catch (e) {
  console.log('[METRICS ERROR]', e.message);
}

    // logs
    console.log(
      `[REQUEST] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    );
  });

  next();
});

app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur TrainShop Starter',
    endpoints: ['/health', '/products']
  });
});

//Ancien Health
/*app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');

    res.json({
      status: 'ok',
      service: 'trainshop-api',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      service: 'trainshop-api',
      database: 'unavailable',
      message: error.message
    });
  }
});*/
/*app.get('/health', async (req, res) => {
  const start = Date.now();

  try {
    await pool.query('SELECT 1');

    res.json({
      status: 'ok',
      service: 'trainshop-api',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'local',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      response_time_ms: Date.now() - start
    });

  } catch (error) {
    res.status(503).json({
      status: 'error',
      service: 'trainshop-api',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'local',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'unavailable',
      error: error.message,
      response_time_ms: Date.now() - start
    });
  }
});*/

/*app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'trainshop-api',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});*/

/*app.get('/health', async (req, res) => {
  try {
    // DB check uniquement hors CI
    if (process.env.CI !== 'true') {
      await pool.query('SELECT 1');
    }

    return res.status(200).json({
      status: 'ok',
      service: 'trainshop-api',
      version: '1.0.0',
      uptime: process.uptime(),
      ci_mode: process.env.CI === 'true',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // JAMAIS 503 en CI
    return res.status(200).json({
      status: 'ok-but-db-failed',
      error: error.message
    });
  }
});*/

/*app.get('/health', async (req, res) => {
  if (process.env.CI) {
    return res.status(200).json({
      status: 'ok',
      mode: 'ci-mock',
      database: 'skipped',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  }

  try {
    await pool.query('SELECT 1');

    return res.status(200).json({
      status: 'ok',
      database: 'connected'
    });

  } catch (error) {
    return res.status(503).json({
      status: 'error',
      database: 'unavailable',
      error: error.message
    });
  }
});*/
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    mode: isCI ? 'ci-mock' : 'real'
  });
});

//console.log(`[HEALTH] check database`);
/*app.get('/products', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, price_cents, stock FROM products ORDER BY id ASC'
    );

    metrics.productsViewed++;
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      error: 'Impossible de récupérer les produits',
      message: error.message
    });
  }
});*/

app.get('/products', async (req, res) => {
  if (isCI) {
    return res.json([
      { id: 1, name: "mock product", price_cents: 1000 }
    ]);
  }

  try {
    const result = await pool.query(
      'SELECT id, name, description, price_cents, stock FROM products ORDER BY id ASC'
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, price_cents, stock FROM products WHERE id = $1',
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'Produit introuvable'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: 'Impossible de récupérer le produit',
      message: error.message
    });
  }
});

app.post('/products', async (req, res) => {
  try {
    const { name, description, price_cents, stock } = req.body;

    if (!name || !description || !price_cents) {
      return res.status(400).json({
        error: 'name, description et price_cents sont obligatoires'
      });
    }

    const result = await pool.query(
      `INSERT INTO products (name, description, price_cents, stock)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, price_cents, stock`,
      [name, description, price_cents, stock || 0]
    );

    metrics.productsCreated++;
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      error: 'Impossible de créer le produit',
      message: error.message
    });
  }
});

//module.exports = app;

app.get('/about', (req, res) => {
  res.json({
    project: 'TrainShop Starter',
    module: 'DevOps',
    objective: 'Créer une CI GitHub Actions'
  });
});

/*app.get('/ready', async (req, res) => {
  try {
    // Vérifie base de données (dépendance critique)
    await pool.query('SELECT 1');

    res.json({
      status: 'ready',
      service: 'trainshop-api',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'local',
      database: 'connected',
      cache: 'not_used',
      payment_service: 'mock',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      service: 'trainshop-api',
      version: '1.0.0',
      database: 'unavailable',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
console.log(`[READY] dependency check started`);
*/

app.get('/ready', async (req, res) => {
  if (isCI) {
    return res.json({
      status: 'ready',
      mode: 'ci-mock'
    });
  }

  try {
    await pool.query('SELECT 1');

    res.json({ status: 'ready', database: 'connected' });

  } catch (error) {
    res.status(503).json({ status: 'not_ready' });
  }
});
app.get('/metrics', (req, res) => {
  res.json({
    service: 'trainshop-api',

    uptime: process.uptime(),

    technical: {
      total_requests: metrics.requests,
      errors_4xx: metrics.errors4xx,
      errors_5xx: metrics.errors5xx,
      average_response_time_ms: averageResponseTime(),
      p95_response_time_ms: p95ResponseTime()
    },

    business: {
      products_viewed: metrics.productsViewed,
      products_created: metrics.productsCreated
    },

    health_status: 'UP',

    timestamp: new Date().toISOString()
  });
});
module.exports = app;