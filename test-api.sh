#!/bin/bash

# 博客API测试脚本
# 请先设置API_BASE_URL变量为你的API Gateway端点
API_BASE_URL="https://your-api-id.execute-api.region.amazonaws.com/Prod"

echo "博客API测试脚本"
echo "API地址: $API_BASE_URL"
echo "================================"

# 检查curl是否可用
if ! command -v curl &> /dev/null; then
    echo "错误: curl未安装。请先安装curl。"
    exit 1
fi

# 提示用户设置API地址
if [[ $API_BASE_URL == *"your-api-id"* ]]; then
    echo "请先修改脚本中的API_BASE_URL为你的实际API Gateway端点"
    echo "可以在SAM部署完成后从输出中获取"
    exit 1
fi

# 测试函数
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo "测试: $description"
    echo "请求: $method $endpoint"
    
    if [ -n "$data" ]; then
        echo "数据: $data"
        response=$(curl -s -X $method \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_BASE_URL$endpoint")
    else
        response=$(curl -s -X $method "$API_BASE_URL$endpoint")
    fi
    
    echo "响应: $response"
    echo "================================"
    echo
}

# 1. 测试Hello接口（确保基本功能正常）
test_endpoint "GET" "/hello" "" "Hello World接口"

# 2. 创建blogs表
test_endpoint "POST" "/createBlogTable" "" "创建blogs表"

# 3. 创建第一条blog
blog_data1='{"title":"我的第一篇博客","content":"这是我的第一篇博客内容，介绍了如何使用SAM构建无服务器应用。","author":"张三"}'
test_endpoint "POST" "/createBlog" "$blog_data1" "创建第一条blog"

# 4. 创建第二条blog
blog_data2='{"title":"PostgreSQL使用指南","content":"本文介绍了PostgreSQL数据库的基本使用方法和最佳实践。","author":"李四"}'
test_endpoint "POST" "/createBlog" "$blog_data2" "创建第二条blog"

# 5. 获取所有blogs
test_endpoint "GET" "/blogs" "" "获取所有blogs"

echo "请记录上面返回的blog ID（现在是整数ID），用于后续测试"
read -p "请输入一个blog ID用于测试详情和删除功能（例如: 1, 2, 3...）: " BLOG_ID

# 验证输入的ID是否为有效的整数
if [[ $BLOG_ID =~ ^[0-9]+$ ]] && [ "$BLOG_ID" -gt 0 ]; then
    # 6. 获取blog详情
    test_endpoint "GET" "/blog/$BLOG_ID" "" "获取blog详情"
    
    # 7. 删除blog
    echo "是否要删除这条blog？(y/n)"
    read -r confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        test_endpoint "DELETE" "/delete/$BLOG_ID" "" "删除blog"
        
        # 8. 再次获取所有blogs确认删除
        test_endpoint "GET" "/blogs" "" "确认删除后获取所有blogs"
    fi
else
    echo "无效的ID格式。ID应该是正整数（如: 1, 2, 3...）"
fi

echo "测试完成！" 