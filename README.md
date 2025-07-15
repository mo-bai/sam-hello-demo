# sam-hello-demo

这个项目包含了一个可以使用 SAM CLI 部署的无服务器应用程序的源代码和支持文件。它包括以下文件和文件夹：

- hello-world - 应用程序的 Lambda 函数代码
- events - 用于调用函数的事件文件
- hello-world/tests - 应用程序代码的单元测试
- template.yaml - 定义应用程序 AWS 资源的模板文件

该应用程序使用了多个 AWS 资源，包括 Lambda 函数和 API Gateway API。这些资源都在项目中的 `template.yaml` 文件中定义。你可以通过更新代码时使用的相同部署流程来更新模板以添加 AWS 资源。

## 部署示例应用

Serverless Application Model 命令行界面（SAM CLI）是 AWS CLI 的扩展，增加了用于构建和测试 Lambda 应用程序的功能。它使用 Docker 在与 Lambda 匹配的 Amazon Linux 环境中运行你的函数。它还可以模拟你的应用程序的构建环境和 API。

要使用 SAM CLI，你需要以下工具：

- SAM CLI - [安装 SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- Node.js - [安装 Node.js 20](https://nodejs.org/en/)，包括 NPM 包管理工具
- Docker - [安装 Docker 社区版](https://hub.docker.com/search/?type=edition&offering=community)

首次构建和部署应用程序时，在命令行中运行以下命令：

```bash
sam build
sam deploy --guided
```

第一个命令将构建应用程序的源代码。第二个命令将打包并部署你的应用程序到 AWS，期间会有一系列提示：

- **Stack Name**: 要部署到 CloudFormation 的堆栈名称。这应该在你的账户和区域中是唯一的，建议使用与项目名称匹配的名称。
- **AWS Region**: 你想要部署应用程序的 AWS 区域。
- **Confirm changes before deploy**: 如果设置为是，任何更改集都会在执行前显示给你进行手动审查。如果设置为否，AWS SAM CLI 将自动部署应用程序更改。
- **Allow SAM CLI IAM role creation**: 许多 AWS SAM 模板（包括此示例）都会创建 AWS Lambda 函数所需的 AWS IAM 角色。默认情况下，这些权限被限制在最小必需权限。要部署创建或修改 IAM 角色的 AWS CloudFormation 堆栈，必须提供 `CAPABILITY_IAM` 值作为 `capabilities`。如果没有通过此提示提供权限，要部署此示例，你必须显式传递 `--capabilities CAPABILITY_IAM` 到 `sam deploy` 命令。
- **Save arguments to samconfig.toml**: 如果设置为是，你的选择将保存到项目内的配置文件中，这样将来你只需要重新运行 `sam deploy` 而无需参数即可部署更改到应用程序。

部署完成后，你可以在显示的输出值中找到 API Gateway 端点 URL。

## 使用 SAM CLI 在本地构建和测试

使用 `sam build` 命令构建应用程序：

```bash
sam-hello-demo$ sam build
```

SAM CLI 会安装 `hello-world/package.json` 中定义的依赖项，创建部署包，并将其保存在 `.aws-sam/build` 文件夹中。

你可以通过直接调用函数并使用测试事件来测试单个函数。事件是一个 JSON 文档，表示函数从事件源接收的输入。测试事件包含在项目的 `events` 文件夹中。

在本地运行函数并使用 `sam local invoke` 命令调用它们：

```bash
sam-hello-demo$ sam local invoke HelloWorldFunction --event events/event.json
```

SAM CLI 还可以模拟你的应用程序的 API。使用 `sam local start-api` 在端口 3000 上本地运行 API：

```bash
sam-hello-demo$ sam local start-api
sam-hello-demo$ curl http://localhost:3000/
```

SAM CLI 会读取应用程序模板来确定 API 的路由和它们调用的函数。每个函数定义中的 `Events` 属性包括每个路径的路由和方法。

```yaml
Events:
  HelloWorld:
    Type: Api
    Properties:
      Path: /hello
      Method: get
```

## 向应用程序添加资源

应用程序模板使用 AWS Serverless Application Model (AWS SAM) 来定义应用程序资源。AWS SAM 是 AWS CloudFormation 的扩展，具有更简单的语法，用于配置常见的无服务器应用程序资源，如函数、触发器和 API。对于[SAM 规范](https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md)中未包含的资源，你可以使用标准的 [AWS CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html) 资源类型。

## 清理

要删除你创建的示例应用程序，请使用 AWS CLI。假设你使用项目名称作为堆栈名称，可以运行以下命令：

```bash
sam delete --stack-name sam-hello-demo
```

### 注意事项

1. 安装 aws cli
2. 在 IAM 控制台提前创建好用户和用户组，并配置好权限，否则会报错。
3. 用户创建完成后，配置[访问密钥](https://us-east-1.console.aws.amazon.com/iam/home?region=ap-southeast-1#/users/details/user-sanjiang?section=security_credentials)，使用 aws cli 配置好 aws 的凭证，后续 sam 部署会自动使用。

## 博客 API 功能介绍

本项目已扩展为一个完整的博客管理 API，支持以下功能：

### 功能特性

- ✅ 创建博客数据库表
- ✅ 新增博客文章
- ✅ 查询所有博客
- ✅ 查询博客详情
- ✅ 删除博客文章
- ✅ 使用 PostgreSQL 数据库
- ✅ 通过 AWS SSM 管理数据库连接信息
- ✅ 支持 CORS 跨域请求

### API 接口列表

| 方法   | 路径               | 功能          | 说明                             |
| ------ | ------------------ | ------------- | -------------------------------- |
| POST   | `/createBlogTable` | 创建 blogs 表 | 初次部署时调用                   |
| POST   | `/createBlog`      | 创建博客      | 需要 title, content, author 参数 |
| GET    | `/blogs`           | 获取所有博客  | 按创建时间降序排列               |
| GET    | `/blog/{id}`       | 获取博客详情  | 根据 ID 查询                     |
| DELETE | `/delete/{id}`     | 删除博客      | 根据 ID 删除                     |
| GET    | `/hello`           | 测试接口      | 原有的 hello world 接口          |

### 数据库表结构

```sql
CREATE TABLE blogs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 部署前准备

1. **准备 PostgreSQL 数据库**

   - 可以使用 AWS RDS PostgreSQL 实例
   - 确保数据库可以从 Lambda 函数访问（VPC 配置）

2. **配置 SSM 参数**

   ```bash
   # 运行SSM参数配置脚本
   ./setup-ssm-parameters.sh
   ```

   脚本会提示你输入以下信息：

   - 数据库主机地址
   - 数据库端口（默认 5432）
   - 数据库名称
   - 数据库用户名
   - 数据库密码

3. **构建和部署**
   ```bash
   sam build
   sam deploy --guided
   ```

### 测试 API

部署完成后，使用提供的测试脚本：

```bash
# 修改test-api.sh中的API_BASE_URL
# 然后运行测试
./test-api.sh
```

或者手动测试：

```bash
# 设置API地址（从部署输出获取）
API_URL="https://your-api-id.execute-api.region.amazonaws.com/Prod"

# 1. 创建表
curl -X POST "$API_URL/createBlogTable"

# 2. 创建博客
curl -X POST "$API_URL/createBlog" \
  -H "Content-Type: application/json" \
  -d '{"title":"测试博客","content":"这是测试内容","author":"测试作者"}'

# 3. 获取所有博客
curl "$API_URL/blogs"

# 4. 获取博客详情
curl "$API_URL/blog/{blog-id}"

# 5. 删除博客
curl -X DELETE "$API_URL/delete/{blog-id}"
```

### 项目文件说明

- `hello-world/app.mjs` - 主 Lambda 函数，包含所有 API 路由处理
- `hello-world/db.js` - 数据库连接和查询工具
- `setup-ssm-parameters.sh` - SSM 参数配置脚本
- `test-api.sh` - API 测试脚本
- `template.yaml` - SAM 模板，定义所有 AWS 资源

### 环境变量和权限

应用程序需要以下 AWS 权限：

- `ssm:GetParameter` - 读取 SSM 参数
- Lambda 执行基本权限
- VPC 访问权限（如果数据库在 VPC 中）

### 故障排除

1. **数据库连接失败**

   - 检查 SSM 参数是否正确设置
   - 确认数据库安全组允许 Lambda 访问
   - 验证 VPC 配置

2. **权限错误**

   - 确认 Lambda 有 SSM 读取权限
   - 检查 IAM 角色配置

3. **部署失败**
   - 检查 AWS CLI 配置
   - 确认有足够的 IAM 权限创建资源

### 生产环境建议

1. **安全性**

   - 使用 VPC 隔离数据库
   - 启用 RDS 加密
   - 定期轮换数据库密码

2. **性能优化**

   - 配置适当的 Lambda 内存和超时
   - 使用连接池管理数据库连接
   - 考虑使用 RDS Proxy

3. **监控**
   - 启用 CloudWatch 日志
   - 设置性能监控和告警
   - 监控 API Gateway 指标

<!-- 部署命令：传入数据库密码 -->

sam deploy --parameter-overrides DBPassword=您的实际数据库密码

## 问题

1. 冷启动初期，无法正常访问到数据库，需要预热
2. 隐秘的数据可以通过 ssm 存储，但同样存在连接问题，初期无法访问到；更适合用 lambda 环境变量存储
