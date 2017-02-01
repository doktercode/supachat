const mysql = require('mysql');
const config = require('../config/config');

function Connection() {
    this.pool = null;

    this.init = () => {
        this.pool = mysql.createPool({
            connectionLimit: 10,
            host: config.host,
            user: config.user,
            password: config.password,
            database: config.database,
            charset: 'utf8mb4'
        });
    };

    this.acquire = (callback) => {
        this.pool.getConnection((err, connection) => {
            callback(err, connection);
        });
    };
}

module.exports = new Connection();
