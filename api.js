const http = require('http');
const url = require('url');

const hostname = '127.0.0.1';
const postport = 3000;
const getport = 3001;

var a = [];

const postserver = http.createServer((req, res) => {
  var q = url.parse(req.url, true).query;
  var ip = req.headers["x-real-ip"];
  if (ip) {
    ip = ip.split(".");
    ip[0] = "**";
    if (ip.length > 3) {
      ip[3] = "**";
    }
    ip = ip.join(".");
  }
  else {
    ip = "";
  }
  q.ip = ip;
  if (q.title || q.sid) {
    a.push(q);
  }
  if (a.length > 16) {
    a.shift();
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end("");
});

const getserver = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(a));
});

postserver.listen(postport, hostname, () => {
  console.log(`Server running at http://${hostname}:${postport}/`);
});
getserver.listen(getport, hostname, () => {
  console.log(`Server running at http://${hostname}:${getport}/`);
});

