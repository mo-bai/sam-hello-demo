import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const dns = require('dns')
const net = require('net')
const { promisify } = require('util')
const dnsLookup = promisify(dns.lookup)

const { query } = require('./db.js')

/**
 * 创建统一的响应格式
 */
function createResponse(statusCode, body, additionalHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
      ...additionalHeaders
    },
    body: JSON.stringify(body)
  }
}

/**
 * 创建blogs表
 */
async function createBlogTable() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS blogs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        author VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at);
      CREATE INDEX IF NOT EXISTS idx_blogs_author ON blogs(author);
    `

    await query(createTableQuery)

    return createResponse(200, {
      success: true,
      message: 'blogs表创建成功'
    })
  } catch (error) {
    console.error('创建blogs表失败:', error)
    return createResponse(500, {
      success: false,
      message: '创建blogs表失败',
      error: error.message
    })
  }
}

/**
 * 创建新的blog
 */
async function createBlog(body) {
  try {
    const { title, content, author } = JSON.parse(body)

    if (!title || !content || !author) {
      return createResponse(400, {
        success: false,
        message: '缺少必要参数: title, content, author'
      })
    }

    const insertQuery = `
      INSERT INTO blogs (title, content, author)
      VALUES ($1, $2, $3)
      RETURNING *
    `

    const result = await query(insertQuery, [title, content, author])

    return createResponse(201, {
      success: true,
      message: 'blog创建成功',
      data: result.rows[0]
    })
  } catch (error) {
    console.error('创建blog失败:', error)
    return createResponse(500, {
      success: false,
      message: '创建blog失败',
      error: error.message
    })
  }
}

/**
 * 获取所有blogs
 */
async function getAllBlogs() {
  try {
    const selectQuery = `
      SELECT id, title, content, author, created_at, updated_at
      FROM blogs
      ORDER BY created_at DESC
    `

    const result = await query(selectQuery)

    return createResponse(200, {
      success: true,
      message: '获取blogs成功',
      data: result.rows,
      total: result.rows.length
    })
  } catch (error) {
    console.error('获取blogs失败:', error)
    return createResponse(500, {
      success: false,
      message: '获取blogs失败',
      error: error.message
    })
  }
}

/**
 * 根据ID获取blog详情
 */
async function getBlogById(blogId) {
  try {
    // 验证blogId是否为有效的整数
    const id = parseInt(blogId)
    if (isNaN(id) || id <= 0) {
      return createResponse(400, {
        success: false,
        message: '无效的blog ID'
      })
    }

    const selectQuery = `
      SELECT id, title, content, author, created_at, updated_at
      FROM blogs
      WHERE id = $1
    `

    const result = await query(selectQuery, [id])

    if (result.rows.length === 0) {
      return createResponse(404, {
        success: false,
        message: 'blog不存在'
      })
    }

    return createResponse(200, {
      success: true,
      message: '获取blog详情成功',
      data: result.rows[0]
    })
  } catch (error) {
    console.error('获取blog详情失败:', error)
    return createResponse(500, {
      success: false,
      message: '获取blog详情失败',
      error: error.message
    })
  }
}

/**
 * 根据ID删除blog
 */
async function deleteBlog(blogId) {
  try {
    // 验证blogId是否为有效的整数
    const id = parseInt(blogId)
    if (isNaN(id) || id <= 0) {
      return createResponse(400, {
        success: false,
        message: '无效的blog ID'
      })
    }

    const deleteQuery = `
      DELETE FROM blogs
      WHERE id = $1
      RETURNING id
    `

    const result = await query(deleteQuery, [id])

    if (result.rows.length === 0) {
      return createResponse(404, {
        success: false,
        message: 'blog不存在'
      })
    }

    return createResponse(200, {
      success: true,
      message: 'blog删除成功',
      data: { id: result.rows[0].id }
    })
  } catch (error) {
    console.error('删除blog失败:', error)
    return createResponse(500, {
      success: false,
      message: '删除blog失败',
      error: error.message
    })
  }
}

/**
 * 网络诊断
 */
async function networkDiagnose() {
  try {
    const host = process.env.DB_HOST
    const port = parseInt(process.env.DB_PORT || '5432')
    console.log('开始网络诊断...')

    // DNS解析
    console.log('正在进行DNS解析...')
    const dnsResult = await dnsLookup(host)
    console.log('DNS解析结果:', dnsResult)

    // TCP连接测试
    console.log('正在测试TCP连接...')
    const socket = new net.Socket()

    const tcpResult = await new Promise((resolve, reject) => {
      // 设置连接超时时间为5秒
      socket.setTimeout(5000)

      socket.on('connect', () => {
        resolve('连接成功')
        socket.end()
      })

      socket.on('timeout', () => {
        socket.destroy()
        reject(new Error('连接超时'))
      })

      socket.on('error', (err) => {
        reject(err)
      })

      console.log(`尝试连接 ${host}:${port}...`)
      socket.connect(port, host)
    })

    return createResponse(200, {
      success: true,
      message: '网络诊断完成',
      data: {
        dns: {
          address: dnsResult.address,
          family: `IPv${dnsResult.family}`
        },
        tcp: tcpResult
      }
    })
  } catch (error) {
    console.error('网络诊断失败:', {
      errorMessage: error.message,
      errorCode: error.code,
      errorStack: error.stack
    })
    return createResponse(500, {
      success: false,
      message: '网络诊断失败',
      error: {
        message: error.message,
        code: error.code,
        type: error.constructor.name
      }
    })
  }
}

/**
 * 主Lambda处理函数
 */
export const lambdaHandler = async (event, context) => {
  console.log('收到请求:', JSON.stringify(event, null, 2))

  const httpMethod = event.httpMethod
  const path = event.path
  const pathParameters = event.pathParameters || {}

  try {
    // 处理CORS预检请求
    if (httpMethod === 'OPTIONS') {
      return createResponse(200, { message: 'CORS preflight successful' })
    }

    // 路由处理
    switch (true) {
      // 网络诊断
      case httpMethod === 'GET' && path === '/diagnose':
        return await networkDiagnose()

      // 创建blogs表
      case httpMethod === 'POST' && path === '/createBlogTable':
        return await createBlogTable()

      // 创建新blog
      case httpMethod === 'POST' && path === '/createBlog':
        return await createBlog(event.body)

      // 获取所有blogs
      case httpMethod === 'GET' && path === '/blogs':
        return await getAllBlogs()

      // 获取blog详情
      case httpMethod === 'GET' && path.startsWith('/blog/'):
        const blogId = pathParameters.id
        return await getBlogById(blogId)

      // 删除blog
      case httpMethod === 'POST' && path.startsWith('/delete/'):
        const deleteId = pathParameters.id
        return await deleteBlog(deleteId)

      // 原有的hello接口
      case httpMethod === 'GET' && path === '/hello':
        return createResponse(200, {
          message: 'hello world sam test'
        })

      default:
        return createResponse(404, {
          success: false,
          message: '接口不存在'
        })
    }
  } catch (error) {
    console.error('处理请求时发生错误:', error)
    return createResponse(500, {
      success: false,
      message: '服务器内部错误',
      error: error.message
    })
  }
}
