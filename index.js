/*require("express")().use(require("express").static(__dirname + "/public")).use((_, res, next) => {
  res.status(404).sendFile(__dirname + "/404.html");
}).listen(8080);*/

/*
Functions:
clearLog(); It clears the log.
deleteMap(name); It deletes a map.
*/

const express = require('express');
const app = express();
var cookieParser = require('cookie-parser');
app.use(cookieParser());
const router = express.Router();
const cors = require('cors');
app.use(cors({
  origin: function(origin, callback){
    return callback(null, true);
  },
  credentials: true, // <= Accept credentials (cookies) sent by the client
}))
const db = require('./db.js')

let log = []
async function Log(){
  var data = []
  for(var i=0; i<arguments.length; i++){
    data.push(arguments[i])
  }
  console.log(...data)
  //var log = await db.get("log")
  //log = log || []
  log.push(data)
  await db.set("log", log)
}

function clearLog(){
  db.delete("log").then(() => {
    console.clear()
    log = []
  })
}
console.clear()
db.get("log").then(r => {
  r.forEach(v => {
    console.log(...v)
  })
  log = r
}).catch(() => {})

async function deleteMap(name){
  await db.delete("map:"+name)
  Log("Map called "+name+" has been deleted.")
}

function getPostData(req){
  return new Promise(function(resolve){
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString(); // convert Buffer to string
    });
    req.on('end', () => {
      body = JSON.parse(body)
      req.body = body
      resolve(body)
    });
  })
}
function getPostText(req){
  return new Promise(function(resolve){
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString(); // convert Buffer to string
    });
    req.on('end', () => {
      req.body = body
      resolve(body)
    });
  })
}

app.use(express.static(__dirname + "/public"))

/*router.get("/", function(req,res){
  res.sendFile(__dirname + "/index.html")
})*/

router.get("/server/maps", async function(req,res){
  var maps = await db.list("map:",true)
  res.send(maps)
})
router.post("/server/map", async function(req, res){
  await getPostData(req)
  if(!req.body.name){
    return res.json({message:"It needs a name."})
  }
  var codeOrFile = (req.body.code ? 1 : 0) + (req.body.file ? 1 : 0)
  if(codeOrFile !== 1){
    return res.json({message:codeOrFile === 0 ? "It needs a code or a file." : "It can only have a code or a file."})
  }
  var map = await db.get("map:"+req.body.name)
  if(map){
    return res.json({message:"That name is already taken."})
  }
  if(req.body.name.match(/[^a-zA-Z0-9\-_]/)){
    return res.json({message:"Name can only contain: A-Z, a-z, 0-9, - and _"})
  }
  map = {
    name: req.body.name,
    user: req.body.user || null,
    description: req.body.description || null,
    code: req.body.code,
    category: req.body.category || null,
    created: Date.now(),
    file: req.body.file || null
  }
  await db.set("map:"+req.body.name, map).then(function(){
    res.send({success:true})
    Log("New map called",req.body.name)
  })
})
router.get("/server/map/*", async function(req,res){
  var name = req.url.split("/").pop()
  var map = await db.get("map:"+name)
  if(!map){
    return res.status(404).json(null)
  }
  res.json(map)
})

router.get("/play",function(req,res){
  res.redirect("https://minekhan.thingmaker.repl.co")
})

app.use(router)

//404
app.use(function(req, res, next) {
  res.status(404);
  res.sendFile(__dirname + '/404.html');
});

let serverPort = app.listen(3000, function(){
  console.log("App server is running on port 3000");
});

void 0