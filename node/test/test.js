const expect = require('chai').expect;
const request = require('request');

describe('Token', () => {
	describe('userExists', () => {
		it('returns "User already exists"', () => {
			request('http://localhost:8000/token/test', (err, resp, body) => {
				expect(body).to.equal('User already exists');
			});
		});
	});
	describe('!userExists', () => {
		it('Is a string', () => {
			request('http://localhost:8000/token/duncan', (err, resp, body) => {
				assert.equal(typeof(body), string);
			});
		});
		it('Is 64 bytes', () => {
			request('http://localhost:8000/token/james', (err, resp, body) => {
				assert.equal(len(body), 64);
			})
		})
	});
});
