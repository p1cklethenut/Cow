const crypto = require("crypto");

const express = require("express");

const fs = require("fs");

let vers = "1.2";

let updating = false;

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const url = process.env["db"];
let timeblock = process.env.time;
let dataobj = { clicks: 0, users: {} };
let connections = {}; //to track and update clients
let devlog = "Cowtube devlog";

//setup socket.io server
let duels = {};
let onlinetoduel = {}; //{online:true,socketid:socketid}}
let duelids = {};

//lowest to highest rarity skins
//hex color:
//Farm Animal               E9F985
//Farm Ruler
//City Dweller            6bfc03
//Accomplished Cow
//Distingushed Cow
//Ruler of Cows            E20EF7
//Miniso Cow

let skins = {
  skin0: {
    src: "/cowskins/0.png",
    name: "King Cow",
    cost: 20000,
    rarity: "Ruler of Cows",
    color: "#E20EF7",
  },
  skin1: {
    src: "/cowskins/1.png",
    name: "Angy Cow",
    cost: 10000,
    rarity: "Farm Animal",
    color: "#E9F985",
  },
  skin2: {
    src: "/cowskins/2.png",
    name: "Tomato Cow",
    cost: 20000,
    rarity: "Farm Animal",
    color: "#E9F985",
  },
  skin3: {
    src: "/cowskins/3.png",
    name: "Angel Cow",
    cost: 20000,
    rarity: "City Dweller",
    color: "#6bfc03",
  },
  skin4: {
    src: "/cowskins/4.png",
    name: "Strong Cow",
    cost: 20000,
    rarity: "City Dweller",
    color: "#6bfc03",
  },
  skin5: {
    src: "/cowskins/5.png",
    name: "Parachute Cow",
    cost: 20000,
    rarity: "City Dweller",
    color: "#6bfc03",
  },
  skin6: {
    src: "/cowskins/6.png",
    name: "Crocowdile",
    cost: 15000,
    rarity: "Farm Animal",
    color: "#E9F985",
  },
  skin7: {
    src: "/cowskins/7.png",
    name: "Dairyhea",
    cost: 1000,
    rarity: "City Dweller",
    color: "#6bfc03",
  },
  skin8: {
    src: "/cowskins/8.png",
    name: "Cowcumber",
    cost: 5000,
    rarity: "Farm Animal",
    color: "#E9F985",
  },
  skin9: {
    src: "/cowskins/9.png",
    name: "Air Cowditioner",
    cost: 35000,
    rarity: "City Dweller",
    color: "#6bfc03",
  },
  skin10: {
    src: "/cowskins/10.png",
    name: "Thermoo Nuclear Cowerplant",
    cost: 50000,
    rarity: "City Dweller",
    color: "#6bfc03",
  },
  skin11: {
    src: "/cowskins/11.png",
    name: "Cooked Cow",
    cost: 20000,
    rarity: "City Dweller",
    color: "#6bfc03",
  },
  skin12: {
    src: "/cowskins/12.png",
    name: "Watermelon Cow",
    cost: 20000,
    rarity: "Farm Animal",
    color: "#E9F985",
  },

  skin13: {
    src: "/cowskins/13.png",
    name: "Vietnamese Cow",
    cost: 20000,
    rarity: "City Dweller",
    color: "#6bfc03",
  },
};

//handle express.js get/post
app.use(express.json());
app.get("/*", (req, res) => {
  if (updating) {
    res.send("CowTube is updating, please wait.");
    return;
  }
  if (timeblock) {
    if (Date.now() < timeblock) {
      res.send(`listen in class, timeblock lifting in ${Math.ceil((timeblock - Date.now()) / 1000 / 60)} minutes`);
      return;
    }
  }
  if (req.url.startsWith("/cowskins/")) {
    res.sendFile(
      __dirname + "/cowskins/cowskin_" + req.url.slice(10).toString(),
    );
    return;
  }
  if (req.url.startsWith("/profile/")) {
    if (!Object.keys(dataobj.users).includes(req.url.slice(9))) {
      res.sendFile(__dirname + "/404page/index.html");

      return;
    }

    let id = req.url.slice(9);
    let htmlfile = String(fs.readFileSync(__dirname + "/profile/index.html"));
    if (!Object.keys(dataobj.users[id]).includes("skins")) {
      dataobj.users[id].skins = {};
    }
    let tcv = getskinsvalue(dataobj.users[id].skins);

    res.send(
      htmlfile
        .replace("{skinsowned}", displayskins(dataobj.users[id].skins))
        .replaceAll("{uuid}", id)
        .replaceAll("{username}", dataobj.users[id].name)
        .replaceAll("{tc}", dataobj.users[id].cows)
        .replaceAll("{lp}", getPlacement(id, dataobj.users))
        .replaceAll("{sv}", tcv)
        .replaceAll("{tcv}", dataobj.users[id].cows + tcv),
    );
    return;
  }
  switch (req.url) {
    case "/":
      res.sendFile(__dirname + "/cow/index.html");
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
      getnews(res);
      break;
    case "/home":
      res.sendFile(__dirname + "/home/index.html");
      break;
    case "/home/script.js":
      res.sendFile(__dirname + "/home/script.js");
      break;
    case "/admin":
      let htmlfile = String(
        fs.readFileSync(__dirname + "/admin_page/index.html"),
      );
      res.send(htmlfile.replaceAll("{ENVP}", process.env.pass));
      break;
    case "/duels":
      res.sendFile(__dirname + "/duels/index.html");
      break;
    case "/duels/script.js":
      res.sendFile(__dirname + "/duels/script.js");
      break;
    case "/offlinescript.js":
      res.sendFile(__dirname + "/offline.js");
      break;
    case "/rv":
      res.sendFile(__dirname + "/rv/index.html");
      break;
    case "/rv/script.js":
      res.sendFile(__dirname + "/rv/script.js");
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
      admin(req, res);
      break;
    case "/console/login":
      if(req.body.pass == process.env.pass){
        res.send({value:process.env.pass,correct:true})
      }else{
        res.send({correct:false})

      }
      break;
    case "/update":
      if (req.body.pass != process.env.pass) {
        break;
      }
      updating = true;
      setTimeout(
        () => {
          timeout = false;
        },
        1000 * 60 * 2,
      );
      saveData();
      //send msg
      for (const onlineid in connections) {
        for (let i = 0; i < connections[onlineid].length; i++) {
          io.to(connections[onlineid][i]).emit(
            "msg",
            "Updating cowtube, please wait a few seconds...",
          );
        }
      }
      break;
    default:
      res.send("404");
  }
});

//putting together html to render skins for static profile pages
function displayskins(selfskins) {
  let html = "";
  for (const skinhave in selfskins) {
    //console.log(skinhave)
    html += `<div class="card d-inline-flex m-2 p-3" style="width: 18em;">
<img style="height:15em;object-fit: contain" src="${skins[skinhave].src}" class="card-img-top">
  <div class="card-body">
    <p class="card-text">${skins[skinhave].name}<br>rarity: ${skins[skinhave].rarity}<br>cost: ${skins[skinhave].cost}</p>
  </div>
</div>`;
  }
  return html;
}

//admin console stuff
function admin(req, res) {
  console.log(req.body)
  if (req.body.pass == process.env["pass"]) {
    
    switch (req.body.cmd) {
      case "chat":
        if (req.body.value) {
          io.emit("chatmsg", {
            msg: req.body.value,
            id: "system",
            name: "admin",
          });
          res.send(`Sent chat message: ${req.body.value}`);
        } else {
          res.send("no value");
        }
        break;
      case "changecow":
        if (!Object.keys(dataobj.users).includes(req.body.id)) {
          res.send("ID invalid");
          return;
        }
        dataobj.users[req.body.id].cows += parseInt(req.body.value);
        dataobj.clicks += parseInt(req.body.value);
        if (!connections[req.body.id]) {
          res.send(`incremented ${req.body.id} cows by ${req.body.value}`);
          return;
        }
        for (let i = 0; i < connections[req.body.id].length; i++) {
          let total = dataobj.clicks;
          let self = dataobj.users[req.body.id].cows;
          io.to(connections[req.body.id][i]).emit("number", {
            total: total,
            self: self,
            id: req.body.id,
            name: dataobj.users[req.body.id].name,
          });
        }
        res.send(`incremented ${req.body.id} cows by ${req.body.value}`);

        break;
      case "changename":
        if (!Object.keys(dataobj.users).includes(req.body.id)) {
          res.send("ID invalid");
          return;
        }
        dataobj.users[req.body.id].name = req.body.value;
        res.send(`changed ${req.body.id} name to ${req.body.value}`);
        if (!connections[req.body.id]) {
          return;
        }
        for (let i = 0; i < connections[req.body.id].length; i++) {
          io.to(connections[req.body.id][i]).emit("newusername", {
            name: dataobj.users[req.body.id].name,
          });
        }
        break;
      case "setcow":
        if (!Object.keys(dataobj.users).includes(req.body.id)) {
          res.send("ID invalid");
          return;
        }
        dataobj.clicks +=
          parseInt(req.body.value) - dataobj.users[req.body.id].cows;
        dataobj.users[req.body.id].cows = parseInt(req.body.value);
        if (!connections[req.body.id]) {
          res.send(`set ${req.body.id} cows to ${req.body.value}`);
          return;
        }

        for (let i = 0; i < connections[req.body.id].length; i++) {
          let total = dataobj.clicks;
          let self = dataobj.users[req.body.id].cows;
          io.to(connections[req.body.id][i]).emit("number", {
            total: total,
            self: self,
            id: req.body.id,
            name: dataobj.users[req.body.id].name,
          });
        }
        res.send(`set ${req.body.id} cows to ${req.body.value}`);
        break;
      case "sendmsg":
        
        if (req.body.id == "all") {
          io.emit("msg", req.body.value);
          res.send(`sent ${req.body.value} to all online clients`);
          break;
        }
        if (!Object.keys(dataobj.users).includes(req.body.id)) {
          res.send("ID invalid");
          return;
        }
        if (connections[req.body.id]) {
          for (let i = 0; i < connections[req.body.id].length; i++) {
            io.to(connections[req.body.id][i]).emit("msg", req.body.value);
          }
          res.send(`sent ${req.body.id}: ${req.body.value}`);
        } else {
          res.send("notonline");
        }
        break;
      case "timeblock":
        if(Number.isNaN(req.body.value)){
          res.send("invalid value, value must be int for timeblock");
          break;
        }
        let timeblockingfromnow = Date.now() + 1000 * 60 * parseInt(req.body.value);
        timeblock = timeblockingfromnow;
        res.send(`timeblock set to till ${timeblockingfromnow} or ${new Date(timeblock).toISOString()}`);
        
        break;
      default:
        res.send("?");
    }
  } else {
    res.send("wrong pass");
  }
}

//unused
async function getnews(res) {
  var url =
    "https://newsapi.org/v2/top-headlines?" +
    "country=sg&" +
    "apiKey=" +
    process.env["newsapi"];
  var req = new Request(url);
  let response = await fetch(req);
  let json = await response.json();
  res.send(json);
  return;
}

//Function that gets and returns a array of objects, sorted from top to bottom (leaderboard)
function getLb(inc) {
  const obj = dataobj.users;
  let sortable = [];
  for (const userarray in obj) {
    //console.log(obj[userarray])
    let userob = {
      id: userarray,
      cows: obj[userarray].cows,
      name: obj[userarray].name,
    };
    if (inc) {
      userob.cows += getskinsvalue(obj[userarray].skins);
    }
    userob["online"] = Object.keys(connections).includes(userarray);
    sortable.push(userob);
  }

  sortable.sort(function (a, b) {
    return b["cows"] - a["cows"];
  });
  //console.log(sortable)
  return sortable;
}

//getting total value based on inputted skins
function getskinsvalue(userskins) {
  let value = 0;
  for (const skinid in userskins) {
    if (userskins[skinid]) {
      value += skins[skinid].cost;
    }
  }
  return value;
}

//Function to POST clicks data to a url endpoint:
function saveData() {
  let data = dataobj;
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

//setting up socket connection
function socketSetup() {
  io.on("connection", (socket) => {
    let socket_client_id = socket.id;
    // Send initial content to the client when connected
    let connection_client_id;
    let duelpage = false;
    socket.on("duelrequest", (data) => {
      let idtobereq = data.id;
      //console.log(data);
      //console.log(JSON.stringify(onlinetoduel));
      if (onlinetoduel[idtobereq]) {
        io.to(onlinetoduel[idtobereq].socketid).emit("duelrequest", {
          id: connection_client_id,
          stakes: data.stakes,
          acac: data.acac,
          reqskin: data.reqskin,
        });
      }
    });
    let ided = false;
    socket.on("duelid", (data) => {
      if (ided) {
        return;
      }
      if (!dataobj.users[data.id]) {
        io.to(socket_client_id).emit(
          "terminate",
          "Id invalid, please contribute at least one cow before dueling",
        );
      } else {
        if (
          dataobj.users[data.id].cows == 0 &&
          Object.keys(dataobj.users[data.id].skins).length == 0
        ) {
          io.to(socket_client_id).emit(
            "terminate",
            "Id invalid, please contribute at least one cow before dueling",
          );
        }
      }
      //console.log(onlinetoduel[data.id]);
      if (onlinetoduel[data.id]) {
        //console.log("new ided, but there is a current window; terminating window.");
        io.to(onlinetoduel[data.id].socketid).emit(
          "terminate",
          "duelpage was opened on new tab, only one tab per user is allowed for consistancy",
        );
      } else {
        //console.log("no current window")
      }
      connection_client_id = data.id;
      duelpage = true;
      onlinetoduel[data.id] = { online: true, socketid: socket_client_id };
      ided = true;
      //console.log("testing next:"+onlinetoduel[data.id])
    });
    socket.on("acceptd", (data) => {
      let requesterid = data.requesterid;
      if (
        !onlinetoduel[requesterid] ||
        !onlinetoduel[connection_client_id] ||
        duelids[connection_client_id] ||
        duelids[requesterid]
      ) {
        return;
      }
      let conskin = "/cow.png";
      let reqskin = "/cow.png";

      if (data.conskin) {
        if (data.conskin.includes("/cowskins/")) {
          conskin = data.conskin;
          //console.log(1)
        }
      }

      if (data.reqskin) {
        if (data.reqskin.includes("/cowskins/")) {
          reqskin = data.reqskin;
          //console.log(1)
        }
      }

      if (
        onlinetoduel[requesterid]?.online &&
        onlinetoduel[connection_client_id]?.online
      ) {
        onlinetoduel[requesterid].online = false;
        onlinetoduel[connection_client_id].online = false;
        let starton = Date.now() + 3000;
        let endon = starton + 10 * 1000;
        io.to(onlinetoduel[requesterid].socketid).emit("startduel", {
          enemyname: dataobj.users[connection_client_id].name,
          enemyid: connection_client_id,
          starton: starton,
          endon: endon,
          time: Date.now(),
          acac: data.acac,
          skin: reqskin,
          enemyskin: conskin,
        });
        io.to(onlinetoduel[connection_client_id].socketid).emit("startduel", {
          enemyname: dataobj.users[requesterid].name,
          enemyid: requesterid,
          starton: starton,
          endon: endon,
          time: Date.now(),
          acac: data.acac,
          skin: conskin,
          enemyskin: reqskin,
        });
        duelids[connection_client_id] =
          requesterid.toString() + connection_client_id.toString();
        duelids[requesterid] =
          requesterid.toString() + connection_client_id.toString();
        duels[duelids[connection_client_id]] = {
          player1: { clicks: 0, socketid: socket_client_id },
          player2: { clicks: 0, socketid: onlinetoduel[requesterid].socketid },
        };
        setTimeout(() => {
          let reward;
          let player1reward;
          let player2reward;
          if (
            dataobj.users[requesterid].cows >
            dataobj.users[connection_client_id].cows
          ) {
            reward = Math.floor(
              data.stakes * dataobj.users[connection_client_id].cows,
            );
          } else {
            reward = Math.floor(data.stakes * dataobj.users[requesterid].cows);
          }
          if (
            duels[duelids[connection_client_id]]?.player1.clicks ==
            duels[duelids[connection_client_id]]?.player2.clicks
          ) {
            reward = 0;
          }

          if (
            duels[duelids[connection_client_id]]?.player1.clicks >
            duels[duelids[connection_client_id]]?.player2.clicks
          ) {
            //console.log("player1 has more")
            player1reward = reward;
            player2reward = -1 * reward;
          } else {
            player2reward = reward;
            player1reward = -1 * reward;
            //console.log("player1 has more")
          }

          dataobj.users[connection_client_id].cows += player1reward;
          dataobj.users[requesterid].cows += player2reward;
          //console.log(player2reward)
          //console.log(player1reward)
          if (onlinetoduel[requesterid]) {
            io.to(onlinetoduel[requesterid].socketid).emit("duelend", {
              win:
                duels[duelids[connection_client_id]]?.player1.clicks <
                duels[duelids[connection_client_id]]?.player2.clicks,
              youclick: duels[duelids[connection_client_id]]?.player2.clicks,
              enemyclick: duels[duelids[connection_client_id]]?.player1.clicks,
              reward: player2reward,
            });
          }

          if (onlinetoduel[connection_client_id]) {
            io.to(onlinetoduel[connection_client_id].socketid).emit("duelend", {
              win:
                duels[duelids[connection_client_id]]?.player1.clicks >
                duels[duelids[connection_client_id]]?.player2.clicks,
              youclick: duels[duelids[connection_client_id]]?.player1.clicks,
              enemyclick: duels[duelids[connection_client_id]]?.player2.clicks,
              reward: player1reward,
            });
          }

          if (
            duels[duelids[connection_client_id]]?.player1.clicks >
            duels[duelids[connection_client_id]]?.player2.clicks
          ) {
            for (const id in onlinetoduel) {
              io.to(onlinetoduel[id].socketid).emit(
                "duelannounce",
                `User ${connection_client_id} won User ${requesterid} in a duel!`,
              );
            }

            io.emit("chatmsg", {
              msg: `User ${connection_client_id} won User ${requesterid} in a duel!`,
              id: "duels",
              name: "system",
            });
          } else if (
            duels[duelids[connection_client_id]]?.player1.clicks <
            duels[duelids[connection_client_id]]?.player2.clicks
          ) {
            for (const id in onlinetoduel) {
              io.to(onlinetoduel[id].socketid).emit(
                "duelannounce",
                `User ${requesterid} won User ${connection_client_id} in a duel!`,
              );
            }

            io.emit("chatmsg", {
              msg: `User ${requesterid} won User ${connection_client_id} in a duel!`,

              id: "duels",
              name: "system",
            });
          } else {
            for (const id in onlinetoduel) {
              io.to(onlinetoduel[id].socketid).emit(
                "duelannounce",
                `User ${requesterid} and User ${connection_client_id} tied in a duel!`,
              );
            }

            io.emit("chatmsg", {
              msg: `User ${requesterid} and User ${connection_client_id} tied in a duel!`,
              id: "duels",
              name: "system",
            });
          }
          delete duels[duelids[connection_client_id]];

          delete duelids[connection_client_id];
          delete duelids[requesterid];
          if(onlinetoduel[requesterid]){
            onlinetoduel[requesterid].online = true;

          }
          if(onlinetoduel[connection_client_id]){
            onlinetoduel[connection_client_id].online = true;

          }
        }, endon - Date.now());
      }
    });
    socket.on("duelclick", () => {
      if (!duelpage) {
        return;
      }

      if (!duels[duelids[connection_client_id]]) {
        return;
      }

      if (
        duels[duelids[connection_client_id]]?.player1.socketid ==
        onlinetoduel[connection_client_id]?.socketid
      ) {
        duels[duelids[connection_client_id]].player1.clicks += 1;
        io.to(duels[duelids[connection_client_id]].player2.socketid).emit(
          "enemyduelclick",
        );
      } else {
        duels[duelids[connection_client_id]].player2.clicks += 1;
        io.to(duels[duelids[connection_client_id]].player1.socketid).emit(
          "enemyduelclick",
        );
      }
    });
    socket.on("buyskin", (skinid) => {
      //console.log(skinid);
      if (!Object.keys(skins).includes(skinid)) {
        //console.log("skin does not exist");
        //console.log(skinid);
        //console.log(skins);
        return;
      }

      if (!Object.keys(dataobj.users[connection_client_id]).includes("skins")) {
        //undef
        dataobj.users[connection_client_id].skins = {};
      }
      if (!dataobj.users[connection_client_id].skins[skinid]) {
        //should be false?
        if (dataobj.users[connection_client_id].cows >= skins[skinid].cost) {
          dataobj.users[connection_client_id].skins[skinid] = true;
          dataobj.users[connection_client_id].cows -= skins[skinid].cost;
          dataobj.clicks -= skins[skinid].cost;
          io.to(socket_client_id).emit("skinupdate", {
            skins: dataobj.users[connection_client_id].skins,
            allskins: skins,
          });
          let total = dataobj.clicks;
          let self = dataobj.users[connection_client_id].cows;
          io.to(socket_client_id).emit("number", {
            total: total,
            self: self,
            id: connection_client_id,
            name: dataobj.users[connection_client_id].name,
          });
        } else {
        }
      }
    });
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
      io.to(socket_client_id).emit("lb", {
        lb: getLb(false),
        inc: getLb(true),
      });
    });
    socket.on("disconnect", (reason) => {
      if (duelpage) {
        if (onlinetoduel[connection_client_id].socketid == socket_client_id) {
          delete onlinetoduel[connection_client_id];
        }
        return;
      }
      // ...
      //console.log(reason)
      /*
      //console.log(connection_client_id)
      //console.log(connections)
      //console.log(connections[connection_client_id])
      //console.log(socket_client_id)
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
      if (!id || dataobj.users[id] === undefined) {
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
      io.to(socket_client_id).emit("devlog", devlog);
      if (connections[id]) {
        if (!connections[id].includes(socket_client_id)) {
          connections[id].push(socket_client_id);
        }
      } else {
        connections[id] = [socket_client_id];
      }
      connection_client_id = id;
      if (!Object.keys(dataobj.users[connection_client_id]).includes("skins")) {
        dataobj.users[connection_client_id].skins = {};
      }
      io.to(socket_client_id).emit("skinupdate", {
        skins: dataobj.users[connection_client_id].skins,
        allskins: skins,
      });
      console.log(`connections: ${JSON.stringify(connections, null, 2)}`);
    });
    socket.on("autoclicker", (data) => {
      console.log("Autoclicker detected: " + JSON.stringify(data));
    });
    socket.on("claimdrop", (data) => {
      let id = data.id;
      let toclaim = data.toclaim;
      if (dataobj.users[id] && typeof data.toclaim == "number") {
        //console.log(data)
        dataobj.users[id].cows += data.toclaim;
        dataobj.clicks += data.toclaim;
      }

      let total = dataobj.clicks;
      let self = dataobj.users[id].cows;
      io.to(socket_client_id).emit("number", {
        total: total,
        self: self,
        id: id,
        name: dataobj.users[id].name,
      });
    });
    socket.on("clicked", (data) => {
      if (data.vers) {
        if (data.vers != vers) {
          io.to(socket_client_id).emit(
            "refresh",
            "Outdated client, refreshing",
          );
        }
      } else {
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
      if (!connections[id]) {
        return;
      }
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
      for (let i = 0; i < clicks; i++) {
        rollcowsite(socket_client_id);
      }
    });
    socket.on("chat", (value) => {
      io.emit("chatmsg", {
        msg: value,
        id: connection_client_id,
        name: dataobj.users[connection_client_id].name,
      });
    });
  });
}

//using node-crypto to ensure no time specific rng abnormalities
function random() {
  return crypto.randomBytes(4).readUInt32LE() / 0xffffffff;
}

//rolling, intergrated soon...
function rollcowsite(socketid) {
  let valuelist = {
    "epic cow": 200,
    "legendary cow": 500,
    "mythic cow": 1000,
    "miniso cow": 5000,
  };

  let multilist = {
    "epic cow": null,
    "legendary cow": { multi: 5, time: 10 },
    "mythic cow": { multi: 50, time: 5 },
    "miniso cow": { multi: 200, time: 5 },
  };
  let data = [
    {
      name: "NONE",
      weight: 50000,
    },
    {
      name: "epic cow",
      weight: 50,
    },
    {
      name: "legendary cow",
      weight: 10,
    },
    {
      name: "mythic cow",
      weight: 5,
    },
    {
      name: "miniso cow",
      weight: 1,
    },
  ];
  let totalsiterollweight = 0;

  // calculate sum using forEach() method
  data.forEach((obj) => {
    totalsiterollweight += obj.weight;
  });
  //console.log(totalsiterollweight)
  let roll = Math.floor(random() * totalsiterollweight);

  let cow = data[0];
  for (let indexofdata = 0; indexofdata < data.length; indexofdata++) {
    if (roll < data[indexofdata].weight) {
      cow = data[indexofdata];
      break;
    }
    roll -= data[indexofdata].weight;
  }
  //console.log(cow.name)
  if (cow.name != "NONE") {
    io.to(socketid).emit("drop", {
      msg: cow.name,
      value: valuelist[cow.name],
      multi: multilist[cow.name],
    });
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

  fetch(process.env.devlog)
    .then((r) => r.text())
    .then((text) => {
      if (devlog != text) {
        devlog = text;
        io.emit("devlog", devlog);
      }
    });
}

//clear clutter IDs
function clearEmpt() {
  let data = dataobj.users;
  let tobedeleted = {};
  for (const id in data) {
    if (
      data[id].cows == 0 &&
      !Object.keys(connections).includes(id) &&
      Object.keys(data[id].skins).length == 0
    ) {
      tobedeleted[id] = data[id];
    }
  }
  for (const id in tobedeleted) {
    delete dataobj.users[id];
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
let cashedapi = {};
let timeouts = {};
let YOUTUBE_API_KEY = process.env.newytapi;
function ytapi(req, res) {
  let q = req.body.q;
  if (!q) {
    q = "cow";
  }
  if (cashedapi[q]) {
    //console.log("cashed:")

    let item =
      cashedapi[q].data.items[
        Math.floor(random() * cashedapi[q].data.items.length)
      ];
    //console.log(item)

    res.send(JSON.stringify({ id: item.id.videoId, data: item }));
    cashedapi[q].uses += 1;
    if (cashedapi[q].uses > cashedapi[q].data.items.length) {
      delete cashedapi[q];
      if (timeouts[q]) {
        clearTimeout(timeouts[q]);
        delete timeouts[q];
      }
    }
    return;
  }
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=50&regionCode=us&q=${encodeURIComponent(q)}&key=${YOUTUBE_API_KEY}`;
  //fetch function following the aforementioned process
  fetch(url)
    .then((response) => response.json())
    .then((resdata) => {
      let data = resdata;
      for (let i = 0; i < data.items.length; i++) {
        if (data.items[i].id.kind == "youtube#video") {
          //
        } else {
          //console.log(data.items[i])
          data.items.splice(i, 1);
        }
      }
      //console.log(data)
      if (data.error) {
        console.log(data);
        YOUTUBE_API_KEY = process.env.ytapi;
        ytapi(req, res);
        return;
      }
      cashedapi[q] = { data: data, uses: 0 };
      timeouts[q] = setTimeout(
        () => {
          if (cashedapi[q]) {
            delete cashedapi[q];
          }
        },
        1000 * 60 * 60,
      );
      //let i = 0;
      let item = data.items[Math.floor(random() * data.items.length)];
      /*
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
      */
      //console.log(item)
      res.send(JSON.stringify({ id: item.id.videoId, data: item }));
    });
}

//---------------------------------------------------------------------------------//
//main entrypoint:
function main() {
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      dataobj = JSON.parse(data);
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
//post req sending process.env.pass

if (!process.env.dev) {
  fetch("https://cowtube.onrender.com/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: `{"pass":"${process.env.pass}"}`,
  });
}

setTimeout(main, 1000);
setInterval(saveData, 30000);

setInterval(() => {
  //console.log("rizz")
  let data = onlinetoduel;
  let newdata = [];
  for (let onlinerid in data) {
    if (data[onlinerid].online) {
      newdata.push(onlinerid);
    }
  }
  //console.log(JSON.stringify(newdata))
  for (let i = 0; i < newdata.length; i++) {
    //console.log(newdata[i])
    io.to(onlinetoduel[newdata[i]].socketid).emit("uuiddrop", newdata);
  }
}, 5000);
