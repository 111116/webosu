const http = require('http');
const url = require('url');
const fs = require('fs');

const hostname = '127.0.0.1';
const postport = 3000;
const getport = 3001;
const dataFilePath = './userdata/data.json'; // 定义保存数据的文件路径

var a = [];

// 读取之前保存的数据
function loadData() {
  if (fs.existsSync(dataFilePath)) {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    a = JSON.parse(data);
    console.log(`加载记录...`);
  }
}

// 保存数据到文件
function saveData() {
  fs.writeFileSync(dataFilePath, JSON.stringify(a), 'utf8');
  console.log(`收到记录...`);
}

// 加载之前的数据
loadData();

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

  // 保存到json
  saveData();
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

