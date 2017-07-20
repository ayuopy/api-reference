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
			request('http://localhost:8000/token/000', (err, resp, body) => {
				expect(body.length).to.equal(32);
				done();
			})
		})
	});
});
