import logging
import sqlite3
from secrets import token_hex
from bottle import Bottle, request

app = Bottle()
logging.basicConfig(level=logging.INFO)


@app.get('/token/<user>')
def gen_token(user):
    sec = issue_auth(user)
    return sec


@app.post('/add')
def handle_request():
    params = request.json
    logging.info(params)
    if not params.get('auth'):
        return 'Error: no authorisation token present'
    else:
        res = db_add(params)
        return res


def issue_auth(user):
    db = sqlite3.connect('data.db')
    c = db.cursor()
    c.execute("SELECT auth FROM secret WHERE user = ?", [user])
    user_exists = c.fetchone()
    if user_exists:
        sec = 'User already exists'
    else:
        sec = token_hex(16)
        c.execute("INSERT INTO secret (user, auth) VALUES (?, ?)", (user, sec))
        db.commit()
    db.close()
    return sec


def authenticate(token):
    db = sqlite3.connect('data.db')
    c = db.cursor()
    c.execute('select * from secret where auth = ?', [token])
    if c.fetchone():
        return True
    else:
        return False


def db_add(data):
    if not authenticate(data['auth']):
        return 'Error: you are not authorised'
    db = sqlite3.connect('data.db')
    c = db.cursor()
    try:
        c.execute('INSERT INTO data (name, age, status) VALUES (?, ?, ?)',
                  (data['name'], data['age'], data['status']))
        db.commit()
    except Exception as err:
        status = 'Error: ' + err
    else:
        status = 'OK'
    finally:
        return status


if '__main__' in __name__:
    app.run()
