from flask import Flask, jsonify, request, Response, redirect, url_for, send_file
from functools import wraps
from http.cookiejar import CookieJar

import os
import json
import requests
import io

user = os.environ.get('OSU_USERNAME')
password = os.environ.get('OSU_PASSWORD')
api_key = os.environ.get('OSU_API_KEY')

session = requests.Session()

def login():
    r = session.post("https://osu.ppy.sh/forum/ucp.php?mode=login", {
        "username": user,
        "password": password,
        "sid": "",
        "login": "login",
        "redirect": "/forum/",
        "autologin": "on"
    })
    print(r.status_code)

login()

app = Flask(__name__)

def json_output(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        def jsonify_wrap(obj):
            jsonification = json.dumps(obj)
            return Response(jsonification, mimetype='application/json')
        result = f(*args, **kwargs)
        if isinstance(result, tuple):
            return jsonify_wrap(result[0]), result[1]
        if isinstance(result, dict):
            return jsonify_wrap(result)
        if isinstance(result, list):
            return jsonify_wrap(result)
        return result
    return wrapper

@app.route("/api/beatmaps")
@json_output
def beatmaps():
    url = "https://osu.ppy.sh/api/get_beatmaps?k={}".format(api_key)
    r = requests.get(url)
    return r.json()

@app.route("/api/beatmap/<id>")
def beatmap(id):
    url = "https://osu.ppy.sh/d/{}".format(id)
    r = session.get(url)
    print(r.headers)
    print(r.status_code)
    resp = send_file(io.BytesIO(r.content))
    resp.headers["Content-Disposition"] = r.headers.get("Content-Disposition")
    return resp

if __name__ == '__main__':
    app.run(host="127.0.0.1", port=5001, debug=True)
