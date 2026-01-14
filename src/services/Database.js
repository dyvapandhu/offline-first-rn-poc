import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

const database_name = "PowerSyncPOC.db";
const database_version = "1.0";
const database_displayname = "PowerSync POC Database";
const database_size = 200000;

class Database {
    initDB() {
        return new Promise((resolve) => {
            console.log("Plugin integrity check ...");
            SQLite.echoTest()
                .then(() => {
                    console.log("Integrity check passed ...");
                    console.log("Opening database ...");
                    SQLite.openDatabase(
                        database_name,
                        database_version,
                        database_displayname,
                        database_size
                    )
                        .then(DB => {
                            this.db = DB;
                            console.log("Database OPEN");
                            this.createTables().then(() => resolve(DB));
                        })
                        .catch(error => {
                            console.log(error);
                        });
                })
                .catch(error => {
                    console.log("echoTest failed - plugin not functional");
                });
        });
    }

    createTables() {
        return new Promise((resolve, reject) => {
            this.db.transaction((tx) => {
                // Todos Table
                tx.executeSql(
                    `CREATE TABLE IF NOT EXISTS todos (
            id TEXT PRIMARY KEY,
            title TEXT,
            status TEXT
          );`
                );

                // Synced Todos Table (Snapshot from Server)
                // We compare this with 'todos' to detect changes or just store local ops.
                // For this POC, we will use a mutation queue.

                // Sync Queue Table
                tx.executeSql(
                    `CREATE TABLE IF NOT EXISTS sync_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            operation TEXT, -- INSERT, UPDATE, DELETE
            payload TEXT,   -- JSON string of the data
            status TEXT     -- PENDING, DONE
          );`
                );
            }).then(() => {
                console.log("Tables created successfully");
                resolve();
            }).catch(err => {
                console.log("Error creating tables", err);
                reject(err);
            });
        });
    }

    // --- DAO Methods ---

    addTodo(todo) {
        return new Promise((resolve) => {
            this.db.transaction((tx) => {
                // 1. Write to local DB (Offline First)
                tx.executeSql('INSERT INTO todos (id, title, status) VALUES (?, ?, ?)', [todo.id, todo.title, todo.status]);

                // 2. Add to Sync Queue
                tx.executeSql('INSERT INTO sync_queue (operation, payload, status) VALUES (?, ?, ?)', ['INSERT', JSON.stringify(todo), 'PENDING']);
            }).then(() => resolve(todo));
        });
    }

    getTodos() {
        return new Promise((resolve) => {
            this.db.transaction((tx) => {
                tx.executeSql('SELECT * FROM todos', []).then(([tx, results]) => {
                    let rows = results.rows.raw(); // react-native-sqlite-storage helper
                    resolve(rows);
                });
            });
        });
    }

    updateTodoStatus(id, status) {
        return new Promise((resolve) => {
            this.db.transaction((tx) => {
                tx.executeSql("UPDATE todos SET status = ? WHERE id = ?", [status, id]).then(() => {
                    resolve();
                });
            });
        });
    }

    // --- Sync Queue Methods ---

    getPendingSyncItems() {
        return new Promise((resolve) => {
            this.db.transaction((tx) => {
                tx.executeSql("SELECT * FROM sync_queue WHERE status = 'PENDING'", []).then(([tx, results]) => {
                    resolve(results.rows.raw());
                });
            });
        });
    }

    markSyncItemDone(id) {
        return this.db.transaction((tx) => {
            tx.executeSql("UPDATE sync_queue SET status = 'DONE' WHERE id = ?", [id]);
        });
    }

    deleteSyncItem(id) {
        return this.db.transaction((tx) => {
            tx.executeSql("DELETE FROM sync_queue WHERE id = ?", [id]);
        });
    }

    deleteAllItem() {
        return this.db.transaction((tx) => {
            tx.executeSql("DELETE FROM todos");
        });
    }
}

const db = new Database();
export default db;
