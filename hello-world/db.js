const { Pool } = require('pg')
const net = require('net')

// 数据库连接池
let pool = null

/**
 * 诊断数据库连接问题
 */
async function diagnoseDatabaseConnection(host, port) {
  try {
    console.log('开始数据库连接诊断...')

    // 1. 测试TCP连接
    console.log('1. 测试TCP连接...')
    const socket = new net.Socket()

    try {
      await new Promise((resolve, reject) => {
        socket.setTimeout(5000)

        socket.on('connect', () => {
          console.log('TCP连接成功 - 说明网络和安全组配置正常')
          socket.end()
          resolve()
        })

        socket.on('timeout', () => {
          socket.destroy()
          reject(new Error('TCP连接超时 - 可能是Lambda冷启动或网络问题'))
        })

        socket.on('error', (err) => {
          if (err.code === 'ECONNREFUSED') {
            reject(new Error('连接被拒绝 - 可能是数据库未启动或正在休眠中'))
          } else if (err.code === 'EHOSTUNREACH') {
            reject(new Error('主机不可达 - 可能是Lambda VPC配置问题'))
          } else {
            reject(err)
          }
        })

        socket.connect(port, host)
      })
    } catch (error) {
      console.error('TCP连接测试失败:', error.message)
      throw error
    }

    // 2. 尝试PostgreSQL连接
    console.log('2. 尝试PostgreSQL连接...')
    const testPool = new Pool({
      host,
      port,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectionTimeoutMillis: 5000,
      ssl: {
        rejectUnauthorized: false
      }
    })

    try {
      const client = await testPool.connect()
      const result = await client.query('SELECT 1')
      console.log('PostgreSQL连接成功 - 数据库正常运行')
      client.release()
      await testPool.end()
    } catch (error) {
      if (error.code === '57P03') {
        console.error('数据库正在启动中')
      } else {
        console.error('PostgreSQL连接失败:', {
          code: error.code,
          message: error.message
        })
      }
      await testPool.end()
      throw error
    }
  } catch (error) {
    throw error
  }
}

/**
 * 获取数据库连接
 */
async function getDbConnection() {
  if (!pool) {
    try {
      console.log('开始创建数据库连接池...')

      const host = process.env.DB_PROXY_ENDPOINT || process.env.DB_HOST
      const port = parseInt(process.env.DB_PORT || '5432')

      // 先进行诊断
      try {
        await diagnoseDatabaseConnection(host, port)
      } catch (error) {
        console.log('诊断结果:', error.message)
      }

      // 使用环境变量
      const config = {
        host,
        port,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        max: 10, // 最大连接数
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ssl: {
          rejectUnauthorized: false
        }
      }

      console.log('数据库配置:', {
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        max: config.max,
        idleTimeoutMillis: config.idleTimeoutMillis,
        connectionTimeoutMillis: config.connectionTimeoutMillis,
        ssl: config.ssl
      })

      pool = new Pool(config)

      // 添加池错误处理
      pool.on('error', (err, client) => {
        console.error('意外的数据库连接池错误:', {
          message: err.message,
          code: err.code,
          stack: err.stack
        })
      })

      // 测试连接
      console.log('尝试测试数据库连接...')
      const client = await pool.connect()
      console.log('数据库连接测试成功！')
      client.release()

      console.log('数据库连接池创建成功')
    } catch (error) {
      console.error('创建数据库连接失败，详细错误:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        cause: error.cause
      })
      throw error
    }
  }
  return pool
}

/**
 * 执行查询
 */
async function query(text, params = []) {
  const pool = await getDbConnection()
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}

/**
 * 关闭数据库连接
 */
async function closeConnection() {
  if (pool) {
    await pool.end()
    pool = null
    console.log('数据库连接已关闭')
  }
}

module.exports = {
  query,
  getDbConnection,
  closeConnection
}
