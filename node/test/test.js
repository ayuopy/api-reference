const expect = require('chai').expect;
const request = require('request');

describe('Token', () => {
	describe('userExists', () => {
		it('returns "User already exists"', (done) => {
			request('http://localhost:8000/token/test', (err, resp, body) => {
				expect(body).to.equal('Token already issued');
				done();
			});
		});
	});
	describe('!userExists', () => {
		it('is 16 bytes', (done) => {
			const randomuser = Math.floor(Math.random() * 100000000);
			request(`http://localhost:8000/token/${randomuser}`, (err, resp, body) => {
				expect(body.length).to.equal(32);
				done();
			})
		})
	});
});
