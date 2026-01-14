const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'backend.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        title TEXT,
        status TEXT,
        created_at INTEGER,
        updated_at INTEGER
    )`);
});

const getTodos = () => {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM todos", [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

const upsertTodo = (todo) => {
    return new Promise((resolve, reject) => {
        const query = `INSERT INTO todos (id, title, status, created_at, updated_at) 
                       VALUES (?, ?, ?, ?, ?)
                       ON CONFLICT(id) DO UPDATE SET
                       title=excluded.title,
                       status=excluded.status,
                       updated_at=excluded.updated_at`;
        db.run(query, [todo.id, todo.title, todo.status, todo.created_at, todo.updated_at], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
};

const deleteTodo = (id) => {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM todos WHERE id = ?", [id], function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

module.exports = { getTodos, upsertTodo, deleteTodo };
