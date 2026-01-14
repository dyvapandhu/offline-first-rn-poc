const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Pull endpoint
app.get('/todos', async (req, res) => {
    try {
        const todos = await db.getTodos();
        res.json(todos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Sync endpoint (Push)
app.post('/sync', async (req, res) => {
    const { operation, payload } = req.body;
    console.log(`[Server] Received sync op: ${operation}`, payload);

    try {
        if (operation === 'INSERT' || operation === 'UPDATE') {
            await db.upsertTodo(payload);
        } else if (operation === 'DELETE') {
            await db.deleteTodo(payload.id);
        }
        res.json({ success: true });
    } catch (err) {
        console.error("Sync error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
