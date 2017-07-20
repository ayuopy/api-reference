const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const host = '0.0.0.0';
const port = 8000

function newPool() {
	const pool = new Pool({database: "crud"});
	pool.connect()
	return pool
}

app.get('/token/:name', (req, res) => {
	const name = req.params.name;
	checkUser(name, (token) => {
		res.send(token);
	});
});

function checkUser(name, callback) {
	const pool = newPool()
	pool.query('SELECT * FROM auth WHERE name = $1', [name], (err, res) => {
		res.rowCount > 0 ? callback('Token already issued') : callback(newToken(name));
		pool.end();
	});
}

function newToken(name) {
	const pool = newPool();
	const token = crypto.randomBytes(16).toString('hex');
	pool.query('INSERT INTO auth (name, token) VALUES ($1, $2)', [name, token], (err, res) => {
		err ? console.log(err) : console.log('User added');
		pool.end();
	});
	return token;
}

app.use(bodyParser.json());

app.post('/add', (req, res) => {
	const data = req.body;
	if (!data.token) {
		res.send('No token present');
	} else {
		addData(data, (status) => {
			res.send(status);
		});
	}
});

function addData(data, callback) {
	verifyToken(data.token, (verified) => {
		if (verified) {
			const values = [data.home, data.away, data.hscore, data.ascore];
			const pool = newPool();
			pool.query(`INSERT INTO scores (home, away, hscore, ascore) VALUES ($1, $2, $3, $4)`, values, 
				(err, res) => {
					err ? callback(err) : callback('success');
					pool.end()
			});
		} else {
			callback('Invalid token');
		}
	});
}

function verifyToken(token, callback) {
	const pool = newPool();
	pool.query('SELECT * FROM auth WHERE token = $1', [token], (err, res) => {
		res.rowCount > 0 ? callback(true) : callback(false);
		pool.end();
	});
}

app.listen(port, host, () => {
	console.log(`listening on http://${host}:${port}`);
});
