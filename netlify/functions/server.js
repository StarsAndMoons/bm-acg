// const express = require('express');
import express from 'express';
import mysql from 'mysql2';
import bodyParser from 'body-parser';
import cors from 'cors';
import { generateJWT, verifyJWT, hash } from '../utils/gen-jwt.js';
import dotenv from 'dotenv';
import serverless from 'serverless-http';

dotenv.config();

const config = {
  secretSalt: process.env.SECRETSALT || '',
  dbHost: process.env.DBHOST || 'localhost',
  dbUser: process.env.DBUSER || 'root',
  dbPassword: process.env.DBPASSWORD || 'root',
  dbName: process.env.DBNAME || 'bm_acg',
  dbPort: process.env.DBPORT || 3306,
  openPort: process.env.OPENPORT || 3000
};

const app = express();
const port = config.openPort;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Connection
const db = mysql.createPool({
    host: config.dbHost,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName,
    port: config.dbPort,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test DB Connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Successfully connected to database');
        connection.release();
    }
});

// Function: generate a JWT token
function genJWT(user, secretSalt) {
    // Implement JWT generation logic here
    var iat = new Date().getTime();
    var exp = iat + 2*60*60*1000; // 2 小时
    console.log(exp-iat);
    let payload =JSON.stringify({
        "userId": user.id,
        "username": user.username,
        "iat": iat,
        "exp": exp,
    });
    return generateJWT(payload, secretSalt);
}

// Function: verify a JWT token, 验证 Token 的中间件
function verifyJWTMid(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const verifyRes = verifyJWT(token, config.secretSalt);
        if (verifyRes.valid) {
            req.userId = verifyRes.payload.userId; // 将解码后的用户信息存入请求对象
            next();
        } else {
            if (verifyRes.message) {
                res.status(401).json({ message: verifyRes.message });
            } else {
                res.status(401).json({ message: '无效的 Token' });
            }
        }
    } else {
        res.status(401).json({ message: '缺少认证令牌' });
    }
}

// --- API Routes ---

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM admins WHERE username = ? AND password = ?';
    const hashedPassword = hash(password, 'qrbwrxo1ot');
    db.query(query, [username, hashedPassword], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            // In a real app, generate a JWT token here
            const token = genJWT(results[0], config.secretSalt);
            res.json({ message: 'Login successful', token: token });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    });
});

// --- Categories ---

// Get All Categories
app.get('/api/categories', (req, res) => {
    db.query('SELECT * FROM categories', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

async function getCategoriesMaxNum(col) {
    return new Promise((resolve, reject) => {
        const query = `SELECT MAX(${col}) AS max_num FROM categories`;
        db.query(query, (err, results) => {
            if (err) return reject(err);
            resolve(results[0].max_num);
        });
    });
}

// Add Category
app.post('/api/categories', verifyJWTMid, (req, res) => {
    let sort_order = 0;
    const { name, order } = req.body;
    if (order) {
        sort_order = order;
        const createdAt = new Date();
        db.query('INSERT INTO categories (name, sort_order, created_at) VALUES (?, ?, ?)', [name, sort_order, createdAt], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: result.insertId, name, userId: req.userId });
        });
    }
    else {
        getCategoriesMaxNum('sort_order').then(count => {
            sort_order = count + 1;
            const createdAt = new Date();
            db.query('INSERT INTO categories (name, sort_order, created_at) VALUES (?, ?, ?)', [name, sort_order, createdAt], (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: result.insertId, name, userId: req.userId });
            });
        });
    }
});

// Update Category
app.put('/api/categories/:id', verifyJWTMid, (req, res) => {
    const { name, order } = req.body;
    const { id } = req.params;
    let query = 'UPDATE categories SET name = ? WHERE id = ?';
    let values = [name, id];
    if (order) {
        query = 'UPDATE categories SET name = ?, sort_order = ? WHERE id = ?';
        values = [name, order, id];
    }
    db.query(query, values, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Category updated', userId: req.userId });
    });
});

// Delete Category
app.delete('/api/categories/:id', verifyJWTMid, (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM categories WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        getCategoriesMaxNum('id').then(count => {
            db.query('ALTER TABLE categories AUTO_INCREMENT=?', [count + 1], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Category deleted', userId: req.userId });
            });
        });
    });
});

// --- Posts ---

// Get All Posts
app.get('/api/posts', (req, res) => {
    const { categoryId } = req.query;
    let query = 'SELECT id, title, cover, view_count, category_id, created_at FROM posts';
    let params = [];
    if (categoryId) {
        query += ' WHERE category_id = ?';
        params.push(categoryId);
    }
    query += ' ORDER BY created_at DESC';
    
    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Get Single Post
app.get('/api/posts/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM posts WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Post not found' });
        res.json(results[0]);
    });
});

// Create Post
app.post('/api/posts', verifyJWTMid, (req, res) => {
    const { title, cover, content, categoryId } = req.body;
    const now = new Date();
    const viewCount = 0, createdAt = now, updatedAt = now;
    const query = 'INSERT INTO posts (title, cover, content, category_id, view_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [title, cover, content, categoryId, viewCount, createdAt, updatedAt], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, message: 'Post created', userId: req.userId });
    });
});

// Update Post
app.put('/api/posts/:id', verifyJWTMid, (req, res) => {
    const { title, cover, content, categoryId } = req.body;
    const { id } = req.params;
    const updatedAt = new Date();
    const query = 'UPDATE posts SET title = ?, cover = ?, content = ?, category_id = ?, updated_at = ? WHERE id = ?';
    db.query(query, [title, cover, content, categoryId, updatedAt, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Post updated', userId: req.userId });
    });
});

// Delete Post
app.delete('/api/posts/:id', verifyJWTMid, (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM posts WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Post deleted', userId: req.userId });
    });
});

// Start Server
export const handler = serverless(app);
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`host: ${config.dbHost}, user: ${config.dbUser}`);
});
