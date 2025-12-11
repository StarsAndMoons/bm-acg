# ACG Community Backend

这是 ACG 社区项目的后端程序说明文档。本项目基于 Node.js (Express) 和 MySQL 开发。

## 🛠️ 环境准备

在运行本项目之前，请确保您的电脑上已经安装了：
1. **Node.js**: [下载地址](https://nodejs.org/)
2. **MySQL**: [下载地址](https://dev.mysql.com/downloads/mysql/)
3. **Apipost**: [下载地址](https://www.apipost.cn/) (用于接口测试)

## 🚀 快速开始

### 1. 配置数据库
确保您的 MySQL 服务正在运行。
1. 登录 MySQL。
2. 运行项目根目录下的 `schema.sql` 文件中的 SQL 语句，以创建数据库 `bm_acg` 及相关表结构。
   * 注意：默认数据库配置为 host: `localhost`, user: `root`, password: `root`, port: `3306`。如果您的配置不同，请修改 `server.js` 中的 `db` 连接配置。

### 2. 安装依赖
在项目根目录下打开终端（命令行），运行：
```bash
npm install
```

### 3. 启动服务
运行以下命令启动后端服务器：
```bash
node server.js
```
如果看到输出 `Server running at http://localhost:3000`，说明服务启动成功。

---

## 🧪 Apipost 接口测试指南

以下是使用 **Apipost** 软件测试各个 API 接口的详细步骤。

### 准备工作
1. 打开 Apipost 软件。
2. 新建一个项目或目录，命名为 "ACG Community"。
3. **全局变量设置** (可选，为了方便)：设置一个变量 `base_url` 值为 `http://localhost:3000`。

---

### 1. 管理员登录 (Login)

*   **功能**: 验证管理员账号密码。
*   **方法**: `POST`
*   **URL**: `http://localhost:3000/api/login`
*   **Apipost 设置**:
    1. 切换方法为 **POST**。
    2. URL栏输入: `http://localhost:3000/api/login`
    3. 点击 **Body** 标签 -> 选择 **json**。
    4. 输入以下 JSON 内容:
       ```json
       {
           "username": "admin",
           "password": "123456"
       }
       ```
    5. 点击 **发送**。
    6. **预期结果**: 返回状态码 `200`，JSON 中包含 `message: "Login successful"`。

---

### 2. 目录管理 (Categories)

#### 2.1 获取所有目录
*   **方法**: `GET`
*   **URL**: `http://localhost:3000/api/categories`
*   **Apipost 设置**:
    1. 方法选 **GET**。
    2. URL: `http://localhost:3000/api/categories`
    3. 点击 **发送**。

#### 2.2 新增目录
*   **方法**: `POST`
*   **URL**: `http://localhost:3000/api/categories`
*   **Apipost 设置**:
    1. 方法选 **POST**。
    2. URL: `http://localhost:3000/api/categories`
    3. Body (json):
       ```json
       {
           "name": "测试分区"
       }
       ```
    4. 点击 **发送**。

#### 2.3 修改目录
*   **方法**: `PUT`
*   **URL**: `http://localhost:3000/api/categories/{id}` (将 `{id}` 替换为实际 ID，如 `1`)
*   **Apipost 设置**:
    1. 方法选 **PUT**。
    2. URL: `http://localhost:3000/api/categories/1`
    3. Body (json):
       ```json
       {
           "name": "Game (修改版)"
       }
       ```
    4. 点击 **发送**。

#### 2.4 删除目录
*   **方法**: `DELETE`
*   **URL**: `http://localhost:3000/api/categories/{id}`
*   **Apipost 设置**:
    1. 方法选 **DELETE**。
    2. URL: `http://localhost:3000/api/categories/7` (假设要删除 ID 为 7 的目录)
    3. 点击 **发送**。

---

### 3. 文章管理 (Posts)

#### 3.1 获取文章列表
*   **方法**: `GET`
*   **URL**: `http://localhost:3000/api/posts`
*   **可选参数**: `categoryId` (筛选特定分类)
*   **Apipost 设置**:
    1. 方法选 **GET**。
    2. URL: `http://localhost:3000/api/posts`
    3. (可选) 点击 **Params**，添加参数名 `categoryId`，值 `1`。
    4. 点击 **发送**。

#### 3.2 获取单篇文章详情
*   **方法**: `GET`
*   **URL**: `http://localhost:3000/api/posts/{id}`
*   **Apipost 设置**:
    1. 方法选 **GET**。
    2. URL: `http://localhost:3000/api/posts/1`
    3. 点击 **发送**。

#### 3.3 新增文章
*   **方法**: `POST`
*   **URL**: `http://localhost:3000/api/posts`
*   **Apipost 设置**:
    1. 方法选 **POST**。
    2. URL: `http://localhost:3000/api/posts`
    3. Body (json):
       ```json
       {
           "title": "Apipost 测试文章",
           "cover": "https://example.com/image.jpg",
           "content": "<p>这是通过接口添加的文章内容。</p>",
           "categoryId": 1
       }
       ```
    4. 点击 **发送**。

#### 3.4 修改文章
*   **方法**: `PUT`
*   **URL**: `http://localhost:3000/api/posts/{id}`
*   **Apipost 设置**:
    1. 方法选 **PUT**。
    2. URL: `http://localhost:3000/api/posts/1`
    3. Body (json):
       ```json
       {
           "title": "文章标题被修改了",
           "cover": "https://example.com/new-image.jpg",
           "content": "<p>内容也修改了。</p>",
           "categoryId": 2
       }
       ```
    4. 点击 **发送**。

#### 3.5 删除文章
*   **方法**: `DELETE`
*   **URL**: `http://localhost:3000/api/posts/{id}`
*   **Apipost 设置**:
    1. 方法选 **DELETE**。
    2. URL: `http://localhost:3000/api/posts/1`
    3. 点击 **发送**。

---

## ⚠️ 注意事项
*   如果在测试 `POST` 或 `PUT` 请求时服务器报错，请检查 **Headers** 中是否自动添加了 `Content-Type: application/json` (选择 JSON Body 模式时 Apipost 通常会自动添加)。
*   数据库操作是不可逆的，特别是 `DELETE` 操作，请谨慎测试。
