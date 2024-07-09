const crypto = require('crypto');

const express = require("express");

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const url = process.env["db"];
let dataobj = {clicks:0,users:{}};
let connections = {}; //to track and update clients
let devlog = "Cowtube devlog";
app.use(express.json());
app.get("/*", (req, res) => {
  switch (req.url) {
    case "/":
      if(Date.now()<1720763299552){
        res.send("listen in class")
      }else{

        res.sendFile(__dirname + "/cow/index.html");
      }
      break;
    case "/script.js":
      res.sendFile(__dirname + "/cow/script.js");
      break;
    case "/leaderboard":
      res.sendFile(__dirname + "/cowlb/index.html");
      break;
    case "/leaderboard/script.js":
      res.sendFile(__dirname + "/cowlb/script.js");
      break;

    case "/cow.png":
      res.sendFile(__dirname + `/cow/cow0.png`);
      break;
    case "/cow1.png":
      res.sendFile(__dirname + `/cow/cow1.png`);

      break;
    case "/cow2.png":
      res.sendFile(__dirname + `/cow/cow2.png`);

      break;
    case "/cow3.png":
      res.sendFile(__dirname + `/cow/cow3.png`);

      break;
    case "/rollcow":
      let rolls = [];
      for (let i = 0; i < 10; i++) {
        rolls.push(rollcow());
      }
      res.send(rolls);
      break;

    case "/cowcur.png":
      res.sendFile(__dirname + "/cowcur.png");
      break;

    case "/cronjob":
      //keeping server alive + saving data to Db
      saveData();
      res.send("croned");
      break;
    case "/404/style.css":
      res.sendFile(__dirname + "/404page/style.css");
      break;
    case "/404/bg.jpg":
      res.sendFile(__dirname + "/404page/cowbg.jpg");
      break;
    case "/getnews":
      getnews(res)
      break;
    case "/home":
      res.sendFile(__dirname + "/home/index.html");
      break;
    case "/home/script.js":
      res.sendFile(__dirname+"/home/script.js")
      break;
    default:
      res.sendFile(__dirname + "/404page/index.html");
  }
});

app.post("/*", (req, res) => {
  switch (req.url) {
    case "/cowtubeapi":
      ytapi(req, res);
      break;
    case "/console":
      admin(req,res)
      break;
    default:
      res.send("404");
  }
});

function admin(req,res){
  if(req.body.pass == process.env["pass"]){
    switch(req.body.cmd){
      case "changecow":
        dataobj.users[req.body.id].cows += parseInt(req.body.value);
        dataobj.clicks += parseInt(req.body.value)
        for(let i=0;i<connections[req.body.id].length;i++){
          let total = dataobj.clicks;
          let self = dataobj.users[req.body.id].cows;
          io.to(connections[req.body.id][i]).emit("number", {
            total: total,
            self: self,
            id: req.body.id,
            name: dataobj.users[req.body.id].name,
          });

          
        }
        res.send(`incremented ${req.body.id} cows by ${req.body.value}`)
        
        break ;
      case "changename":
        dataobj.users[req.body.id].name = req.body.value;
        res.send(`changed ${req.body.id} name to ${req.body.value}`)
        for(let i=0;i<connections[req.body.id].length;i++){
          io.to(connections[req.body.id][i]).emit("newusername", { name: dataobj.users[req.body.id].name });
        }
        break;
      case "setcow":
        dataobj.clicks += parseInt(req.body.value)-dataobj.users[req.body.id].cows;
        dataobj.users[req.body.id].cows = parseInt(req.body.value);
        for(let i=0;i<connections[req.body.id].length;i++){
          let total = dataobj.clicks;
          let self = dataobj.users[req.body.id].cows;
          io.to(connections[req.body.id][i]).emit("number", {
            total: total,
            self: self,
            id: req.body.id,
            name: dataobj.users[req.body.id].name,
          });


        }
        res.send(`set ${req.body.id} cows to ${req.body.value}`)
        break;
      case "sendmsg":
        if(connections[req.body.id]){
          for(let i=0;i<connections[req.body.id].length;i++){
            io.to(connections[req.body.id][i]).emit("msg", req.body.value);
          }

        }
        res.send(`sent ${req.body.id}: ${req.body.value}`)
        break;
      default:
        res.send("?");
    }
  }else{
    res.send("wrong pass")
  }
}

async function getnews(res){
  var url = 'https://newsapi.org/v2/top-headlines?' +
    'country=sg&' +
    'apiKey='+
    process.env['newsapi'];
  var req = new Request(url);
  let response =await fetch(req)
  let json = await response.json()
  res.send(json);
  return

}

//Function that gets and returns a array of objects, sorted from top to bottom (leaderboard)
function getLb() {
  const obj = dataobj.users
  let sortable = [];
  for (const userarray in obj) {
    //console.log(obj[userarray])
    let userob = {
      id: userarray,
      cows: obj[userarray].cows,
      name: obj[userarray].name,
    };
    userob["online"] = Object.keys(connections).includes(userarray);
    sortable.push(userob);
  }

  sortable.sort(function (a, b) {
    return b["cows"] - a["cows"];
  });
  //console.log(sortable)
  return sortable;
}

//Function to POST clicks data to a url endpoint:
function saveData() {
  let data = dataobj
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      // Handle the API response here
      //console.log("Server Data Backed up.")
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
}

//setup socket.io server
function socketSetup() {
  io.on("connection", (socket) => {
    let socket_client_id = socket.id;
    // Send initial content to the client when connected
    let connection_client_id;
    socket.on("changeusername", (data) => {
      let newuser = data.name;
      if (newuser) {
        if (connection_client_id) {
          dataobj.users[connection_client_id].name = newuser;
          
          socket.emit("newusername", { name: newuser });
        }
      }
    });
    socket.on("getlb", () => {
      io.to(socket_client_id).emit("lb", getLb());
    });
    socket.on("disconnect", (reason) => {
      // ...
      //console.log(reason)
      /*
      console.log(connection_client_id)
      console.log(connections)
      console.log(connections[connection_client_id])
      console.log(socket_client_id)
      */
      if (!connection_client_id) {
        //console.log("no id");
        return;
      }
      if (connections[connection_client_id].includes(socket_client_id)) {
        connections[connection_client_id].splice(
          connections[connection_client_id].indexOf(socket_client_id),
          1,
        );
        //console.log(`client ${connection_client_id} disconnected`);

        if (connections[connection_client_id].length == 0) {
          delete connections[connection_client_id];
        }
        let totalclients = 0;
        for (const id in connections) {
          totalclients += connections[id].length;
          if (connections[id].length == 0) {
            delete connections[id];
          }
        }
        console.log(`clients connected: ${totalclients}`);
      }
    });

    socket.on("id", (data) => {
      //console.log("ided:"+data);
      let id = data;
      if (!id || dataobj.users[id]=== undefined) {
        let isdupe = true;
        while (isdupe) {
          id = Math.floor(10000000 + random() * 90000000).toString();
          if (!Object.keys(dataobj.users).includes(id)) {
            isdupe = false;
          }
        }
        dataobj.users[id] = { name: "cowcontributer", cows: 0 };
        //console.log("created: "+id)
      }
      let total = dataobj.clicks;
      let self = dataobj.users[id].cows;
      io.to(socket_client_id).emit("number", {
        total: total,
        self: self,
        id: id,
        name: dataobj.users[id].name,
      });
      let leaderboardpos = getPlacement(id, dataobj.users);
      io.to(socket_client_id).emit("leaderboard", {
        lb: leaderboardpos,
      });
      io.to(socket_client_id).emit("devlog", 
        devlog,
      );
      if (connections[id]) {
        if (!connections[id].includes(socket_client_id)) {
          connections[id].push(socket_client_id);
        }
      } else {
        connections[id] = [socket_client_id];
      }
      connection_client_id = id;
      console.log(`connections: ${JSON.stringify(connections, null, 2)}`);
      
    });
    socket.on("autoclicker",(data)=>{
      console.log("Autoclicker detected: "+JSON.stringify(data))
    })
    socket.on("claimdrop",(data)=>{
      let id = data.id;
      let toclaim = data.toclaim;
      if(dataobj.users[id]&&typeof(data.toclaim)=="number"){
        //console.log(data)
        dataobj.users[id].cows += data.toclaim
        dataobj.clicks += data.toclaim
      }

      let total = dataobj.clicks;
      let self = dataobj.users[id].cows;
      io.to(socket_client_id).emit("number", {
        total: total,
        self: self,
        id: id,
        name: dataobj.users[id].name,
      });
    })
    socket.on("clicked", (data) => {

      if(data.vers){
        if(data.vers!=vers)
        {
          io.to(socket_client_id).emit("refresh", "Outdated client, refreshing");
        }
      }else{
      io.to(socket_client_id).emit("refresh", "Outdated client, refreshing");
      }
      //console.log("clicked: "+JSON.stringify(data));
      let id = data.id;
      let clicks = data.clicks;

      if (!Object.keys(dataobj.users).includes(id)) {
        let isdupe = true;
        while (isdupe) {
          id = Math.floor(10000000 + random() * 90000000).toString();
          if (!Object.keys(dataobj.users).includes(id)) {
            isdupe = false;
          }
        }
          dataobj.users[id] = { name: "cowcontributer", cows: 0 };
      }
      dataobj.clicks += clicks;
      dataobj.users[id].cows += clicks;


      let total = dataobj.clicks;
      let self = dataobj.users[id].cows;
      for (let i = 0; i < connections[id].length; i++) {
        io.to(connections[id][i]).emit("number", {
          total: total,
          self: self,
          id: id,
        });
      }

      for (let i = 0; i < connections[id].length; i++) {
        io.to(connections[id][i]).emit("leaderboard", {
          lb: getPlacement(id, dataobj.users),
        });
      }

      connection_client_id = id;
      for(let i = 0; i < clicks; i++){
        rollcowsite(socket_client_id)
      }
    });
  });
}

function random(){
  return crypto.randomBytes(4).readUInt32LE() / 0xffffffff
}

function rollcowsite(socketid){
  let valuelist = {"epic cow":200,"legendary cow":500,"mythic cow":1000,"miniso cow":5000}

  let multilist = {"epic cow":null,"legendary cow":{multi:5,time:10},"mythic cow":{multi:10,time:10},"miniso cow":{multi:50,time:10}}
  let data = [
      {
        "name": "NONE",
        "weight": 10000,
      },
      {
        "name": "epic cow",
        "weight": 50
      },
      {
        "name": "legendary cow",
        "weight": 10
      },
      {
        "name": "mythic cow",
        "weight": 5
      },
      {
        "name": "miniso cow",
        "weight": 1
      }
    ]
  let totalsiterollweight = 10066

  let roll = Math.floor(random()*totalsiterollweight)
  
  let cow = data[0];
  for (let indexofdata = 0; indexofdata < data.length; indexofdata++) {
    if (roll < data[indexofdata].weight) {
      cow = data[indexofdata];
      break;
    }
    roll -= data[indexofdata].weight;
  }
  //console.log(cow.name)
  if(cow.name!="NONE"){
    io.to(socketid).emit("drop", {msg:cow.name,value: valuelist[cow.name],multi:multilist[cow.name]})
  }
}

//Function to get placement of user by id
function getPlacement(id, users) {
  const obj = users;
  let sortable = [];
  for (const userarray in obj) {
    sortable.push([userarray, obj[userarray]]);
  }

  sortable.sort(function (a, b) {
    return b[1].cows - a[1].cows;
  });

  //console.log(sortable)
  for (let i = 0; i < sortable.length; i++) {
    if (sortable[i][0] == id) {
      return i + 1;
    }
  }
  return null;
}

//Function to update Total cow count globally (setInterval(this))
function updateTotalGlobal() {
  clearEmpt();
  if (Object.keys(connections).length == 0) {
    return;
  }

  const totalclicks = dataobj.clicks;
  io.emit("total", { total: totalclicks });
  
  //also update devlog

  fetch(process.env.devlog).then((r)=>r.text()).then((text)=>{
    if(devlog!=text){
        devlog = text;
        io.emit("devlog", 
        devlog,
      );  
    }
  })
}

function clearEmpt() {
  let data= dataobj.users
  let tobedeleted = {};
  for (const id in data) {

    if (data[id].cows == 0 && !Object.keys(connections).includes(id)) {
      tobedeleted[id] = data[id];
    }
  }
  for (const id in tobedeleted) {
    delete dataobj.users[id]
  }

}

//Function to roll a cow drop. Deps: getTotalWeight()
function rollcow() {
  //Function to get weight to randomize cow drops:
  function getTotalWeight() {
    const data = require("./rolls.json");
    let total = 0;
    for (let indexofdata = 0; indexofdata < data.length; indexofdata++) {
      total += data[indexofdata].weight;
    }
    return total;
  }

  let totalweight = getTotalWeight();
  let roll = Math.floor(random() * totalweight);
  let data = require("./rolls.json");
  let cow = data[0];
  for (let indexofdata = 0; indexofdata < data.length; indexofdata++) {
    if (roll < data[indexofdata].weight) {
      cow = data[indexofdata];
      break;
    }
    roll -= data[indexofdata].weight;
  }
  return cow.name;
}

//Function to randomize a youtube video based on a search query, uses "cow" if input is undefined:
function ytapi(req, res) {
  let q = req.body.q;
  if (!q) {
    q = "cow";
  }
  //variable for your API_KEY
  const YOUTUBE_API_KEY = process.env.ytapi;
  //url from YouTube docs modified for my random term and API key,
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=100&q=${encodeURIComponent(q)}&key=${YOUTUBE_API_KEY}`;
  //fetch function following the aforementioned process
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      let i = 0;
      let item = data.items[Math.floor(random() * data.items.length)];
      while (
        item.snippet.title.includes("#shorts") ||
        item.snippet.description.includes("#shorts")
      ) {
        item = data.items[Math.floor(random() * data.items.length)];
        i++;
        if (i > 100) {
          break;
        }
      }
      res.send(JSON.stringify({ id: item.id.videoId, data: item }));
    });
}

//---------------------------------------------------------------------------------//
//main entrypoint:
function main() {
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      dataobj = JSON.parse(data)
      console.log("got data");
      http.listen(process.env.PORT || 3001, () => {
        console.log("Server listening on port " + process.env.PORT || 3001);
        setInterval(updateTotalGlobal, 1000); // updating total cow count every second
        socketSetup();
      });
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
}
fetch("https://cowtube.onrender.com/cronjob")
setTimeout(main, 10000)
let vers = "1.0.6"
