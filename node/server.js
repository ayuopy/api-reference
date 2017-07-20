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


// CRUD
app.get('/score', (req, res) => {
	// no need for token - find score given home and away team parameters
	const data = req.query;
	findScore(data, (score) => {
		res.send(score);
	});
})

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
