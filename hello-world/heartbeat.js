const { Pool } = require('pg')

async function keepDatabaseAlive() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionTimeoutMillis: 5000,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('执行数据库心跳检测...')
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    console.log('数据库心跳检测成功:', result.rows[0])
    client.release()
  } catch (error) {
    console.error('数据库心跳检测失败:', {
      message: error.message,
      code: error.code
    })
    throw error
  } finally {
    await pool.end()
  }
}

exports.handler = async (event, context) => {
  try {
    await keepDatabaseAlive()
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: '数据库心跳检测成功'
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: '数据库心跳检测失败',
        error: error.message
      })
    }
  }
}
