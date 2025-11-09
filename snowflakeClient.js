const crypto = require("crypto");
let snowflake;

try {
  snowflake = require("snowflake-sdk");
} catch (err) {
  // Module may be missing if install failed; we will log later when used
}

const config = {
  account: process.env.SNOWFLAKE_ACCOUNT,
  username: process.env.SNOWFLAKE_USER,
  password: process.env.SNOWFLAKE_PASSWORD,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  database: process.env.SNOWFLAKE_DATABASE,
  schema: process.env.SNOWFLAKE_SCHEMA,
};

const isConfigured =
  snowflake &&
  config.account &&
  config.username &&
  config.password &&
  config.warehouse &&
  config.database &&
  config.schema;

let connectionPromise = null;

async function initConnection() {
  if (!isConfigured) {
    return null;
  }
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = new Promise((resolve) => {
    const connection = snowflake.createConnection(config);
    connection.connect(async (err, conn) => {
      if (err) {
        console.error("Snowflake connection failed:", err.message);
        resolve(null);
        return;
      }
      try {
        await run(
          conn,
          `CREATE TABLE IF NOT EXISTS FLYWISE_SEARCHES (
            ID STRING,
            ROUTE STRING,
            TRIP_TYPE STRING,
            DEPART_DATE DATE,
            RETURN_DATE DATE,
            CURRENCY STRING,
            TRAVELERS NUMBER,
            CREATED_AT TIMESTAMP_LTZ DEFAULT CURRENT_TIMESTAMP
          )`
        );
        resolve(conn);
      } catch (tableErr) {
        console.error("Snowflake table creation failed:", tableErr.message);
        resolve(conn);
      }
    });
  });

  return connectionPromise;
}

function run(conn, sqlText, binds = []) {
  return new Promise((resolve, reject) => {
    conn.execute({
      sqlText,
      binds,
      complete(err, stmt, rows) {
        if (err) {
          reject(err);
        } else if (rows) {
          resolve(rows);
        } else {
          // INSERT/UPDATE returns summary via stmt.getRowCount()
          resolve({ rowCount: stmt.getRowCount() });
        }
      },
    });
  });
}

async function execute(sqlText, binds = []) {
  const conn = await initConnection();
  if (!conn) return null;
  try {
    return await run(conn, sqlText, binds);
  } catch (err) {
    console.error("Snowflake query failed:", err.message);
    return null;
  }
}

async function logSearch({
  route,
  tripType,
  departDate,
  returnDate,
  currency,
  travelers,
}) {
  if (!isConfigured) return;
  await execute(
    `INSERT INTO FLYWISE_SEARCHES 
      (ID, ROUTE, TRIP_TYPE, DEPART_DATE, RETURN_DATE, CURRENCY, TRAVELERS) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      crypto.randomUUID(),
      route,
      tripType,
      departDate || null,
      returnDate || null,
      currency || null,
      travelers || 1,
    ]
  );
}

async function getTopRoutes(limit = 5) {
  if (!isConfigured) return [];
  const rows = await execute(
    `SELECT ROUTE, TRIP_TYPE, COUNT(*) AS SEARCHES
     FROM FLYWISE_SEARCHES
     GROUP BY ROUTE, TRIP_TYPE
     ORDER BY SEARCHES DESC
     LIMIT ?`,
    [limit]
  );
  return rows || [];
}

module.exports = {
  logSearch,
  getTopRoutes,
  isConfigured,
};
