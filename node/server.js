const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');


// SETUP 
const app = express();
const host = '0.0.0.0';
const port = 8000

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

function newPool() {
	const pool = new Pool({database: "crud"});
	pool.connect()
	return pool
}


// TOKEN GENERATION
app.get('/token/:name', (req, res) => {
	const name = req.params.name;
	checkUser(name, (token) => res.send(token));
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


// CRUD
app.get('/scores', (req, res) => {
	// find score given home and away team url parameters
	const data = req.query;
	findScore(data, (score) => res.send(score));
});

function findScore(data, callback) {
	const values = [data.home, data.away];
	console.log(values);
	const pool = newPool();
	pool.query('SELECT hscore, ascore FROM scores WHERE home = $1 AND away = $2', values,
		(err, res) => {
			if (res.rowCount > 0) {
				const result = res.rows[0];
				callback(`${result.hscore}-${result.ascore}`);
			} else {
				callback('Match not found');
			}
			pool.end();
		})
}

app.post('/scores', (req, res) => {
	// receive json containing token, home, away, hscore, ascore
	const data = req.body;
	if (data.token) {
		checkData(data, (status) => {
			res.send(status);
		});
	} else {
		res.send('No token present');
	}
});

function checkData(data, callback) {
	verifyToken(data.token, (verified) => {
		if (verified) {
			const values = [data.home, data.away, data.hscore, data.ascore];
			const pool = newPool();
			pool.query('SELECT * FROM scores WHERE home = $1 AND away = $2', values.slice(0, 2),
				(err, res) => {
					res.rowCount > 0 ? callback('Entry already exists') : callback(addData(data));
				})
		} else {
			callback('Invalid token');
		}
	});
}

function addData(data) {
	const pool = newPool();
	return pool.query('INSERT INTO scores (home, away, hscore, ascore) VALUES ($1, $2, $3, $4)', values, 
		(err, res) => {
			return err ? err : 'success';
			pool.end()
	});
}

function verifyToken(token, callback) {
	const pool = newPool();
	pool.query('SELECT * FROM auth WHERE token = $1', [token], (err, res) => {
		res.rowCount > 0 ? callback(true) : callback(false);
		pool.end();
	});
}

app.put('/scores', (req, res) => {
	const data = req.body;
	if (data.token) {
		updateEntry(data, (status) => {
			res.send(status);
		})
	} else {
		res.send('No token present');
	}
});

function updateEntry(data, callback) {
	const values = [data.home, data.away, data.hscore, data.ascore];
	const pool = newPool();
	pool.query('UPDATE scores SET hscore = $3 AND ascore = $4 WHERE home = $1 AND away = $2', values,
		(err, res) => {
			err ? callback(err) : callback('success');
			pool.end();
	});
}

app.delete('/:table', (req, res) => {
	// receive token, name/token or home/away
	let data = req.body;
	if (data.token) {
		const validTable = ['auth', 'scores'].find((table) => table === req.params.table)
		if (validTable) {
			data.table = req.params.table;
			deleteEntry(data, (status) => res.send(status));
		} else {
			res.send('Invalid table');
		}
	} else {
		res.send('No token present');
	}
});

function deleteEntry(data, callback) {
	verifyToken(data.token, (verified) => {
		if (verified) {
			const pool = newPool();
			const isAuth = data.table === 'auth';
			const params = isAuth ? ['name', 'token'] : ['home', 'away'];
			const query = {
				text: `DELETE FROM ${data.table} WHERE ${params[0]} = $1 AND ${params[1]} = $2`,
				values: isAuth ? [data.name, data.token] : [data.home, data.away]
			}
			pool.query(query, (err, res) => {
				err ? callback(err) : callback('Item deleted');
				pool.end();
			});
		} else {
			callback('Invalid token');
		}
	});
}


app.listen(port, host, () => {
	console.log(`listening on http://${host}:${port}`);
});
