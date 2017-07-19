const crypto = require('crypto');
const express = require('express');
const { Pool } = require('pg');

const app = express();
const host = '0.0.0.0';
const port = 8000

app.get('/token/:name', (req, res) => {
	const name = req.params.name;
	createToken(name, (token) => {
		res.send(token);
	});
});

function createToken(name, callback) {
	const pool = new Pool({database: "crud"});	// note that postgres will ordinarily require identity
	pool.connect();
	pool.query('SELECT * FROM auth WHERE name = $1', [name], (err, res) => {
		if (res.rowCount > 0) {
			callback('User already exists');
		} else {
			callback(newUser(name));
		}
		pool.end();
	});
}

function newUser(name) {
	const pool = new Pool({database: "crud"});
	pool.connect();
	const token = crypto.randomBytes(16).toString('hex');
	pool.query('INSERT INTO auth (name, token) VALUES ($1, $2)', [name, token], (err, res) => {
		err ? console.log(err) : console.log('User added');
		pool.end();
	});
	return token;
}

app.listen(port, host, () => {
	console.log(`listening on http://${host}:${port}`);
});
