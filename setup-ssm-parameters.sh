#!/bin/bash

# 博客应用数据库连接 SSM 参数设置脚本
echo "正在设置博客应用的SSM参数..."

# 检查AWS CLI是否已安装
if ! command -v aws &> /dev/null; then
    echo "错误: AWS CLI未安装。请先安装AWS CLI。"
    exit 1
fi

# 提示用户输入数据库连接信息
echo "请输入PostgreSQL数据库连接信息:"

read -p "数据库主机地址 (例如: your-rds-endpoint.amazonaws.com): " DB_HOST
read -p "数据库端口 (默认5432): " DB_PORT
read -p "数据库名称: " DB_NAME
read -p "数据库用户名: " DB_USERNAME
read -s -p "数据库密码: " DB_PASSWORD
echo

# 设置默认端口
DB_PORT=${DB_PORT:-5432}

# 获取当前AWS区域
AWS_REGION=$(aws configure get region)
if [ -z "$AWS_REGION" ]; then
    read -p "请输入AWS区域 (例如: us-east-1): " AWS_REGION
fi

echo "正在创建SSM参数..."

# 创建SSM参数
aws ssm put-parameter \
    --region "$AWS_REGION" \
    --name "/blog-app/db/host" \
    --value "$DB_HOST" \
    --type "String" \
    --description "博客应用数据库主机地址" \
    --overwrite

aws ssm put-parameter \
    --region "$AWS_REGION" \
    --name "/blog-app/db/port" \
    --value "$DB_PORT" \
    --type "String" \
    --description "博客应用数据库端口" \
    --overwrite

aws ssm put-parameter \
    --region "$AWS_REGION" \
    --name "/blog-app/db/database" \
    --value "$DB_NAME" \
    --type "String" \
    --description "博客应用数据库名称" \
    --overwrite

aws ssm put-parameter \
    --region "$AWS_REGION" \
    --name "/blog-app/db/username" \
    --value "$DB_USERNAME" \
    --type "String" \
    --description "博客应用数据库用户名" \
    --overwrite

aws ssm put-parameter \
    --region "$AWS_REGION" \
    --name "/blog-app/db/password" \
    --value "$DB_PASSWORD" \
    --type "SecureString" \
    --description "博客应用数据库密码" \
    --overwrite

echo "SSM参数设置完成！"
echo "已创建以下参数:"
echo "- /blog-app/db/host"
echo "- /blog-app/db/port"
echo "- /blog-app/db/database"
echo "- /blog-app/db/username"
echo "- /blog-app/db/password"
echo ""
echo "现在可以运行 'sam deploy --guided' 来部署应用。" 