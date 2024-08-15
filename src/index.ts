const {
  ACCESS_TOKEN,
  DATABASE_BACKUP_URL,
  DEVLOG_URL,
  DEVMODE,
  ENVTIMEBLOCK,
  EXTERNAL_URL,
  LOGGING_ID,
  PROCESS_PORT,
  RATE_LIMIT,
  VERSION,
  YOUTUBE_API_KEY,
  SAVE_DATA,
} = require("./config.js");
if (!VERSION || !ACCESS_TOKEN || !PROCESS_PORT) {
  throw new Error(
    "VERSION or ACCESS_TOKEN or PROCESS_PORT not defined from config file.",
  );
}
let DATAOBJ: dataobjtype = { clicks: 0, users: {} };
let TIMEBLOCK = ENVTIMEBLOCK || 0;
if (LOGGING_ID) {
  const { Logtail } = require("@logtail/node");
  var logtail = new Logtail(LOGGING_ID);
}
const express = require("express");
const fs = require("fs");

const app = express();

const http = require("http").createServer(app);
const io = require("socket.io")(http);
const cors = require("cors");

app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["POST"], // Allow only POST requests
  }),
);

let updating = false;

let connections: mainpageconnections = {}; //to track and update clients
let devlog: string = "Cowtube";

let duels: { [key: string]: dueldata } = {};
let onlinetoduel: { [key: string]: onlinetodueldata } = {};
let duelids: { [key: string]: string } = {};
let cashedapi: { [key: string]: any } = {};
let timeouts: { [key: string]: number } = {};

// set up rate limiter: maximum of five requests per minute
app.set("trust proxy", 1 /* number of proxies between user and server */);
app.use(express.json({ limit: "10mb" }));

if (RATE_LIMIT) {
  const RateLimit = require("express-rate-limit");
  const limiter = RateLimit(RATE_LIMIT);

  // apply rate limiter to all requests
  app.use(limiter);
}

//lowest to highest rarity skins
//hex color:
//Farm Animal               E9F985
//Farm Ruler
//City Dweller            6bfc03
//Accomplished Cow
//Distingushed Cow
//Ruler of Cows            E20EF7
//Miniso Cow

let skins: SkinList = {
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
  skin14: {
    src: "/cowskins/14.png",
    name: "El Cowdo",
    cost: 50000,
    rarity: "City Dweller",
    color: "#6bfc03",
  },

  skin15: {
    src: "/cowskins/15.png",
    name: "Cowmander",
    cost: 50000,
    rarity: "City Dweller",
    color: "#6bfc03",
  },
};

//handle express.js get/post
app.use(express.json());

app.get("/*", (req: any, res: any) => {
  if (req.url == "/rollcow") {
    let rolls: string[] = [];
    for (let i = 0; i < 10; i++) {
      rolls.push(rollcow());
    }
    res.send(rolls);
    return;
  }
  if (updating) {
    res.send("CowTube is updating, please wait.");
    return;
  }
  if (TIMEBLOCK) {
    if (Date.now() < TIMEBLOCK) {
      res.send(
        `listen in class, TIMEBLOCK lifting in ${Math.ceil((TIMEBLOCK - Date.now()) / 1000 / 60)} minutes`,
      );
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
    if (!Object.keys(DATAOBJ.users).includes(req.url.slice(9))) {
      res.sendFile(__dirname + "/404page/index.html");

      return;
    }

    let id = req.url.slice(9);
    let htmlfile = String(fs.readFileSync(__dirname + "/profile/index.html"));
    if (DATAOBJ.users[id]) {
      if (!Object.keys(DATAOBJ.users[id]).includes("skins")) {
        DATAOBJ.users[id].skins = {};
      }
      let tcv = getskinsvalue(DATAOBJ.users[id].skins);
      res.send(
        htmlfile
          .replace(/\{skinsowned\}/g, displayskins(DATAOBJ.users[id].skins))
          .replace(/\{uuid\}/g, id)
          .replace(/\{username\}/g, DATAOBJ.users[id].name)
          .replace(/\{tc\}/g, DATAOBJ.users[id].cows.toString())
          .replace(/\{lp\}/g, getPlacement(id, DATAOBJ.users).toString())
          .replace(/\{sv\}/g, tcv.toString())
          .replace(/\{tcv\}/g, (DATAOBJ.users[id].cows + tcv).toString()),
      );
    }
    return;
  }
  switch (req.url) {
    case "/":
      res.send(
        String(fs.readFileSync(__dirname + "/cow/index.html")).replace(
          /\{VERSION\}/g,
          VERSION,
        ),
      );
      break;
    case "/script.js":
      res.send(
        String(fs.readFileSync(__dirname + "/cow/script.js")).replace(
          /\{VERSION\}/g,
          VERSION,
        ),
      );
      break;
    case "/leaderboard":
      res.send(
        String(fs.readFileSync(__dirname + "/cowlb/index.html")).replace(
          /\{VERSION\}/g,
          VERSION,
        ),
      );
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

    case "/cowcur.png":
      res.sendFile(__dirname + "/cowcur.png");
      break;

    case "/cronjob":
      //keeping server alive
      res.send("croned");
      //logtail.info("croned")
      break;
    case "/404/style.css":
      res.sendFile(__dirname + "/404page/style.css");
      break;
    case "/404/bg.jpg":
      res.sendFile(__dirname + "/404page/cowbg.jpg");
      break;
    /*case "/getnews":
      getnews(res);
      break;*/
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
      res.send(htmlfile);
      break;
    case "/duels":
      res.sendFile(__dirname + "/duels/index.html");
      break;
    case "/duels/script.js":
      res.sendFile(__dirname + "/duels/script.js");
      break;

    case "/roll":
      res.sendFile(__dirname + "/roll/index.html");
      break;
    case "/roll/script.js":
      res.sendFile(__dirname + "/roll/script.js");
      break;
    case "/offlinescript.js":
      res.sendFile(__dirname + "/offlinescript/offline.js");
      break;
    case "/rv":
      if (YOUTUBE_API_KEY) {
        res.sendFile(__dirname + "/rv/index.html");
      } else {
        res.sendFile(__dirname + "/404page/index.html");
      }
      break;
    case "/rv/script.js":
      res.sendFile(__dirname + "/rv/script.js");
      break;

    default:
      res.sendFile(__dirname + "/404page/index.html");
  }
});

app.post("/*", (req: any, res: any) => {
  if (logtail) {
    logtail.info(`POST request: ${req.url}`, req.body);
    logtail.flush();
  }
  switch (req.url) {
    case "/cowtubeapi":
      ytapi(req, res);
      break;
    case "/console":
      admin(req, res);
      break;
    case "/console/login":
      if (req.body.pass == ACCESS_TOKEN) {
        res.send({ value: ACCESS_TOKEN, correct: true });
      } else {
        res.send({ correct: false });
      }
      break;
    case "/update":
      if (req.body.pass != ACCESS_TOKEN) {
        break;
      }
      updating = true;
      setTimeout(
        () => {
          updating = false;
        },
        1000 * 60 * 2,
      );
      SAVE_DATA(DATAOBJ, DEVMODE, DATABASE_BACKUP_URL);
      //send msg
      for (const onlineid in connections) {
        if (connections[onlineid]) {
          for (let i = 0; i < connections[onlineid].length; i++) {
            io.to(connections[onlineid][i]).emit(
              "msg",
              "Updating cowtube, please wait a few seconds...",
            );
          }
        }
      }
      break;
    default:
      res.send("404");
  }
});

//putting together html to render skins for static profile pages
function displayskins(selfskins: { [key: string]: any }): string {
  let html: string = "";
  for (const skinhave in selfskins) {
    //console.log(skinhave)
    html += `<div class="card d-inline-flex m-2 p-3" style="width: 18em;">
<img style="height:15em;object-fit: contain" src="${skins[skinhave]?.src || "/cow.png"}" class="card-img-top">
  <div class="card-body">
    <p class="card-text">${skins[skinhave]?.name || "unknown"}<br>rarity: ${skins[skinhave]?.rarity || "unknown"}<br>cost: ${skins[skinhave]?.cost || "unknown"}</p>
  </div>
</div>`;
  }
  return html;
}

//admin console stuff
function admin(req: any, res: any): void {
  //console.log(req.body);
  if (req.body.pass == ACCESS_TOKEN) {
    const userob = DATAOBJ.users[req.body.id];
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
        if (!Object.keys(DATAOBJ.users).includes(req.body.id)) {
          res.send("ID invalid");
          break;
        }
        if (isNaN(parseInt(req.body.value))) {
          res.send("Value is NaN");
          break;
        }
        if (userob) {
          const connectionsocketidarray = connections[req.body.id];
          if (connectionsocketidarray) {
            userob.cows += parseInt(req.body.value);
            DATAOBJ.clicks += parseInt(req.body.value);
            for (let i = 0; i < connectionsocketidarray.length; i++) {
              let total = DATAOBJ.clicks;
              let self = userob.cows;
              io.to(connectionsocketidarray[i]).emit("number", {
                total: total,
                self: self,
                id: req.body.id,
                name: userob.name,
              });
            }

            res.send(`incremented ${req.body.id} cows by ${req.body.value}`);
          } else {
            userob.cows += parseInt(req.body.value);
            DATAOBJ.clicks += parseInt(req.body.value);
            res.send(`incremented ${req.body.id} cows by ${req.body.value}`);
            break;
          }
        }
        break;
      case "changename":
        if (userob) {
          const connectionsocketidarray = connections[req.body.id];
          if (!Object.keys(DATAOBJ.users).includes(req.body.id)) {
            res.send("ID invalid");
            break;
          }
          userob.name = req.body.value;
          res.send(`changed ${req.body.id} name to ${req.body.value}`);
          if (connectionsocketidarray) {
            for (let i = 0; i < connectionsocketidarray.length; i++) {
              io.to(connectionsocketidarray[i]).emit("newusername", {
                name: userob.name,
              });
            }
          }
        }
        break;
      case "setcow":
        if (isNaN(parseInt(req.body.value))) {
          res.send("Value is NaN");
          break;
        }
        if (userob) {
          const connectionsocketidarray = connections[req.body.id];
          if (!Object.keys(DATAOBJ.users).includes(req.body.id)) {
            res.send("ID invalid");
            break;
          }
          DATAOBJ.clicks += parseInt(req.body.value) - userob.cows;
          userob.cows = parseInt(req.body.value);
          res.send(`set ${req.body.id} cows to ${req.body.value}`);
          if (connectionsocketidarray) {
            for (let i = 0; i < connectionsocketidarray.length; i++) {
              let total = DATAOBJ.clicks;
              let self = userob.cows;
              io.to(connectionsocketidarray[i]).emit("number", {
                total: total,
                self: self,
                id: req.body.id,
                name: userob.name,
              });
            }
          }
        }
        break;

      case "sendmsg":
        if (req.body.id == "all") {
          io.emit("msg", req.body.value);
          res.send(`sent ${req.body.value} to all online clients`);
          break;
        }
        if (!Object.keys(DATAOBJ.users).includes(req.body.id)) {
          res.send("ID invalid");
          break;
        }
        if (userob) {
          const connectionsocketidarray = connections[req.body.id];
          if (connectionsocketidarray) {
            for (let i = 0; i < connectionsocketidarray.length; i++) {
              io.to(connectionsocketidarray[i]).emit("msg", req.body.value);
            }
            res.send(`sent ${req.body.id}: ${req.body.value}`);
          } else {
            res.send("notonline");
          }
        }
        break;
      case "timeblock":
        if (isNaN(req.body.value)) {
          res.send("invalid value, value must be int for TIMEBLOCK");
          break;
        }
        let TIMEBLOCKingfromnow =
          Date.now() + 1000 * 60 * parseInt(req.body.value);
        TIMEBLOCK = TIMEBLOCKingfromnow;
        res.send(
          `TIMEBLOCK set to till ${TIMEBLOCK} or ${new Date(TIMEBLOCK).toISOString()}`,
        );

        break;
      case "eval":
        if (req.body.value) {
          try {
            res.send(JSON.stringify(eval(req.body.value)));
          } catch (e) {
            res.send(JSON.stringify(e));
          }
        }
        break;
      default:
        res.send("?");
    }
  } else {
    res.send("wrong pass");
  }
}

/*unused
async function getnews(res:any):Promise<void> {
  const url:string =
    "https://newsapi.org/v2/top-headlines?" +
    "country=sg&" +
    "apiKey=" +
    process.env["newsapi"];
  let req:Request = new Request(url);
  let response:Response = await fetch(req);
  let json:object = await response.json();
  res.send(json);
  return;
}
*/

//Function that gets and returns a array of objects, sorted from top to bottom (leaderboard)
function getLb(inc: boolean): object[] {
  const obj = DATAOBJ.users;

  let sortable: userlbdata[] = [];
  for (const userarray in obj) {
    //console.log(obj[userarray])
    let userob = {
      id: userarray,
      cows: obj[userarray]?.cows || 0,
      name: obj[userarray]?.name || "cowcontributor",

      online: Object.keys(connections).includes(userarray),
    };
    if (inc) {
      userob.cows += getskinsvalue(obj[userarray]?.skins || {});
    }
    sortable.push(userob);
  }

  sortable.sort(function (a, b) {
    return b["cows"] - a["cows"];
  });
  //console.log(sortable)
  return sortable;
}

//getting total value based on inputted skins
function getskinsvalue(userskins: { [key: string]: any }): number {
  let value = 0;
  for (const skinid in userskins) {
    if (userskins[skinid]) {
      value += skins[skinid]?.cost || 0;
    }
  }
  return value;
}

//setting up socket connection
function socketSetup(): void {
  io.on("connection", (socket: any) => {
    let socket_client_id: string = socket.id;
    // Send initial content to the client when connected
    let connection_client_id: string;
    let duelpage: boolean = false;
    socket.on("roll", (data: any) => {
      if (data.init) {
        if (data.init.id) {
          const userob = DATAOBJ.users[data.init.id];
          if (userob) {
            if (userob.cows > 0) {
              socket.emit("data", { cows: userob.cows, name: userob.name });
            }
            return;
          } else {
            socket.emit("terminate", "No id, please contribute cows");
            return;
          }
        } else {
          socket.emit("terminate", "No id, please contribute cows");
          return;
        }
        return;
      }
      let id = data.id;
      let stakes = data.stakes;
      if (![1000,2000,5000,10000].includes(stakes)){
        stakes = 1000
      }
      if (id) {
        const userob = DATAOBJ.users[id];
        if (userob) {
          if (userob.cows >= stakes) {
            let { multi, value } = rollstakes();
            let changeincows = multi * stakes - stakes;

            DATAOBJ.clicks += changeincows;
            userob.cows += changeincows;
            socket.emit("roll", {
              multi,
              value,
              stakes,
              cows: userob.cows,
              name: userob.name,
              id: id,
            });

            return;
          } else {
            socket.emit("roll", { notenough: true });
            return;
          }
        }
      } else {
        socket.emit("roll", { noacc: true });
        return;
      }
    });
    socket.on(
      "duelrequest",
      (data: {
        id: string;
        stakes: number;
        acac: boolean;
        reqskin: string;
      }) => {
        let idtobereq: string = data.id;
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
      },
    );
    let ided: boolean = false;
    socket.on("duelid", (data: { id: string }) => {
      if (ided) {
        return;
      }
      if (!DATAOBJ.users[data.id]) {
        io.to(socket_client_id).emit(
          "terminate",
          "Id invalid, please contribute at least one cow before dueling",
        );
      } else {
        if (
          DATAOBJ.users[data.id]?.cows == 0 &&
          Object.keys(DATAOBJ.users[data.id]?.skins || {}).length == 0
        ) {
          io.to(socket_client_id).emit(
            "terminate",
            "Id invalid, please contribute at least one cow before dueling",
          );
        }
      }
      //console.log(onlinetoduel[data.id]);
      const onlinetodueluser = onlinetoduel[data.id];
      if (onlinetodueluser) {
        //console.log("new ided, but there is a current window; terminating window.");
        io.to(onlinetodueluser.socketid).emit(
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
    socket.on(
      "acceptd",
      (data: {
        requesterid: string;
        conskin: string;
        reqskin: string;
        acac: boolean;
        stakes: number;
      }) => {
        let requesterid: string = data.requesterid;
        if (
          !onlinetoduel[requesterid] ||
          !onlinetoduel[connection_client_id] ||
          duelids[connection_client_id] ||
          duelids[requesterid]
        ) {
          return;
        }

        let reward: number;
        let player1reward: number;
        let player2reward: number;
        let userobreq = DATAOBJ.users[requesterid];
        let userobcon = DATAOBJ.users[connection_client_id];
        if (userobcon && userobreq) {
          const onlinetoduelrequser = onlinetoduel[requesterid];
          const onlinetoduelclientuser = onlinetoduel[connection_client_id];
          let conskin: string = "/cow.png";
          let reqskin: string = "/cow.png";
          let acac: boolean = data.acac;
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
          if (onlinetoduelclientuser && onlinetoduelrequser) {
            if (onlinetoduelrequser.online && onlinetoduelclientuser.online) {
              onlinetoduelrequser.online = false;
              onlinetoduelclientuser.online = false;
              let starton: number = Date.now() + 3000;
              let endon: number = starton + 10 * 1000;
              io.to(onlinetoduel[requesterid].socketid).emit("startduel", {
                enemyname:
                  DATAOBJ.users[connection_client_id]?.name || "cowcontributor",
                enemyid: connection_client_id,
                starton: starton,
                endon: endon,
                time: Date.now(),
                acac: acac,
                skin: reqskin,
                enemyskin: conskin,
              });

              io.to(onlinetoduelclientuser.socketid).emit("startduel", {
                enemyname: DATAOBJ.users[requesterid]?.name || "cowcontributor",
                enemyid: requesterid,
                starton: starton,
                endon: endon,
                time: Date.now(),
                acac: acac,
                skin: conskin,
                enemyskin: reqskin,
              });
              const thisduelid = requesterid + connection_client_id;
              duelids[connection_client_id] = thisduelid;
              duelids[requesterid] = requesterid + connection_client_id;
              duels[thisduelid] = {
                player1: { clicks: 0, socketid: socket_client_id },
                player2: {
                  clicks: 0,
                  socketid: onlinetoduel[requesterid].socketid,
                },
              };
              setTimeout(() => {
                if (userobreq.cows && userobcon.cows)
                  reward = Math.floor(
                    data.stakes * Math.min(userobreq.cows, userobcon.cows),
                  );
                if (
                  duels[thisduelid]?.player1.clicks ==
                  duels[thisduelid]?.player2.clicks
                ) {
                  reward = 0;
                }
                if (duels[thisduelid]?.player1 && duels[thisduelid]?.player2) {
                  if (
                    duels[thisduelid]?.player1?.clicks >
                    duels[thisduelid]?.player2?.clicks
                  ) {
                    player1reward = reward;
                    player2reward = -1 * reward;
                  } else {
                    player2reward = reward;
                    player1reward = -1 * reward;
                  }
                } else {
                  player2reward = 0;
                  player1reward = 0;
                }
                userobcon.cows += player1reward;
                userobreq.cows += player2reward;
                //console.log(player2reward)
                //console.log(player1reward)

                if (duels[thisduelid]) {
                  const reqsok = onlinetoduel[requesterid]?.socketid;

                  if (reqsok) {
                    io.to(reqsok).emit("duelend", {
                      win:
                        duels[thisduelid]?.player1.clicks <
                        duels[thisduelid]?.player2.clicks,
                      youclick: duels[thisduelid]?.player2.clicks,
                      enemyclick: duels[thisduelid]?.player1.clicks,
                      reward: player2reward,
                    });
                  }
                  const consok = onlinetoduel[connection_client_id]?.socketid;
                  if (consok) {
                    io.to(consok).emit("duelend", {
                      win:
                        duels[thisduelid]?.player1.clicks >
                        duels[thisduelid]?.player2.clicks,
                      youclick: duels[thisduelid]?.player1.clicks,
                      enemyclick: duels[thisduelid]?.player2.clicks,
                      reward: player1reward,
                    });
                  }
                }
                if (duels[thisduelid]) {
                  if (
                    duels[thisduelid]?.player1.clicks >
                    duels[thisduelid]?.player2.clicks
                  ) {
                    for (const id in onlinetoduel) {
                      if (onlinetoduel[id]?.socketid) {
                        io.to(onlinetoduel[id].socketid).emit(
                          "duelannounce",
                          `User ${connection_client_id} won User ${requesterid} in a duel!`,
                        );
                      }
                    }

                    io.emit("chatmsg", {
                      msg: `User ${connection_client_id} won User ${requesterid} in a duel!`,
                      id: "duels",
                      name: "system",
                    });
                  } else if (
                    duels[thisduelid]?.player1.clicks <
                    duels[thisduelid]?.player2.clicks
                  ) {
                    for (const id in onlinetoduel) {
                      if (onlinetoduel[id]?.socketid) {
                        io.to(onlinetoduel[id].socketid).emit(
                          "duelannounce",
                          `User ${requesterid} won User ${connection_client_id} in a duel!`,
                        );
                      }
                    }

                    io.emit("chatmsg", {
                      msg: `User ${requesterid} won User ${connection_client_id} in a duel!`,

                      id: "duels",
                      name: "system",
                    });
                  } else {
                    for (const id in onlinetoduel) {
                      if (onlinetoduel[id]?.socketid) {
                        io.to(onlinetoduel[id].socketid).emit(
                          "duelannounce",
                          `User ${requesterid} and User ${connection_client_id} tied in a duel!`,
                        );
                      }
                    }

                    io.emit("chatmsg", {
                      msg: `User ${requesterid} and User ${connection_client_id} tied in a duel!`,
                      id: "duels",
                      name: "system",
                    });
                  }
                }
                delete duels[thisduelid];

                delete duelids[connection_client_id];
                delete duelids[requesterid];

                const onlinetoduelrequser = onlinetoduel[requesterid];
                const onlinetoduelclientuser =
                  onlinetoduel[connection_client_id];
                if (onlinetoduelrequser) {
                  onlinetoduelrequser.online = true;
                }
                if (onlinetoduelclientuser) {
                  onlinetoduelclientuser.online = true;
                }
              }, endon - Date.now());
            }
          }
        }
      },
    );
    socket.on("duelclick", () => {
      if (!duelpage) {
        return;
      }
      if (!duels[duelids[connection_client_id] || ""]) {
        return;
      }
      const thisduelid = duelids[connection_client_id];
      if (thisduelid) {
        if (duels[thisduelid]) {
          if (
            duels[thisduelid]?.player1.socketid ==
            onlinetoduel[connection_client_id]?.socketid
          ) {
            duels[thisduelid].player1.clicks += 1;
            io.to(duels[thisduelid].player2.socketid).emit("enemyduelclick");
          } else {
            duels[thisduelid].player2.clicks += 1;
            io.to(duels[thisduelid].player1.socketid).emit("enemyduelclick");
          }
        }
      }
    });
    socket.on("buyskin", (skinid: string) => {
      //console.log(skinid);
      if (!Object.keys(skins).includes(skinid)) {
        //console.log("skin does not exist");
        //console.log(skinid);
        //console.log(skins);
        return;
      }
      const userob = DATAOBJ.users[connection_client_id];
      if (userob) {
        if (!Object.keys(userob || {}).includes("skins")) {
          //undef
          userob.skins = {};
        }
        if (!userob.skins[skinid]) {
          //should be false?
          if (skins[skinid]) {
            if (userob.cows >= skins[skinid].cost) {
              userob.skins[skinid] = true;
              userob.cows -= skins[skinid].cost;
              DATAOBJ.clicks -= skins[skinid].cost;
              io.to(socket_client_id).emit("skinupdate", {
                skins: userob.skins,
                allskins: skins,
              });
              let total = DATAOBJ.clicks;
              let self = userob.cows || -1;
              io.to(socket_client_id).emit("number", {
                total: total,
                self: self,
                id: connection_client_id,
                name: userob.name,
              });
            }
          }
        }
      }
    });
    socket.on("changeusername", (data: { name: string }) => {
      let newuser = truncateString(data.name,30);
      if (newuser) {
        if (connection_client_id) {
          let userob = DATAOBJ.users[connection_client_id];
          if (userob) {
            userob.name = newuser;

            socket.emit("newusername", { name: newuser });
          }
        }
      }
    });
    socket.on("getlb", () => {
      io.to(socket_client_id).emit("lb", {
        lb: getLb(false),
        inc: getLb(true),
      });
    });
    socket.on("disconnect", (reason: any) => {
      if (duelpage) {
        if (onlinetoduel[connection_client_id]?.socketid == socket_client_id) {
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
      let clients = connections[connection_client_id];
      if (clients) {
        if (clients.includes(socket_client_id)) {
          clients.splice(clients.indexOf(socket_client_id), 1);
          //console.log(`client ${connection_client_id} disconnected`);

          if (connections[connection_client_id]?.length == 0) {
            delete connections[connection_client_id];
            //console.log("deleted")
          }

          let totalclients = 0;
          for (const id in connections) {
            const clients = connections[id];
            if (clients) {
              totalclients += clients.length;
              if (clients.length == 0) {
                //console.log("deleted")
                delete connections[id];
              }
            }
          }
          console.log(`clients connected: ${totalclients}`);
        }
      }
    });
    socket.on("id", (data: string) => {
      //console.log("ided:"+data);
      let id: string = data;
      if (DATAOBJ.users[id] === undefined && id) {
        DATAOBJ.users[id] = { name: "cowcontributer", cows: 0, skins: {} };
        //console.log("created: "+id)
      } else if (!id) {
        if (!Object.keys(DATAOBJ.users).includes(id)) {
          let isdupe: boolean = true;
          while (isdupe) {
            id = Math.floor(10000000 + random() * 90000000).toString();
            if (!Object.keys(DATAOBJ.users).includes(id)) {
              isdupe = false;
            }
          }
          DATAOBJ.users[id] = { name: "cowcontributer", cows: 0, skins: {} };
        }
      }
      let total: number = DATAOBJ.clicks;
      let self: number = DATAOBJ.users[id]?.cows || 0;
      io.to(socket_client_id).emit("number", {
        total: total,
        self: self,
        id: id,
        name: DATAOBJ.users[id]?.name,
      });
      let leaderboardpos: number = getPlacement(id, DATAOBJ.users);
      io.to(socket_client_id).emit("leaderboard", {
        lb: leaderboardpos,
      });
      io.to(socket_client_id).emit("devlog", devlog);
      let connectionsocketidarray = connections[id];
      if (connectionsocketidarray) {
        if (!connectionsocketidarray.includes(socket_client_id)) {
          connectionsocketidarray.push(socket_client_id);
        }
      } else {
        connections[id] = [socket_client_id];
      }
      //console.log(connections)
      //console.log(connectionsocketidarray)

      connection_client_id = id;
      const userdata = DATAOBJ.users[connection_client_id];
      if (userdata) {
        if (!userdata.skins) {
          userdata.skins = {};
        }
      }

      io.to(socket_client_id).emit("skinupdate", {
        skins: DATAOBJ.users[connection_client_id]?.skins,
        allskins: skins,
      });
      console.log(`connections: ${JSON.stringify(connections, null, 2)}`);
    });
    socket.on("autoclicker", (data: any) => {
      console.log("Autoclicker detected: " + JSON.stringify(data));
    });
    socket.on("claimdrop", (data: any) => {
      let id: string = data.id;
      let toclaim: number = data.toclaim;
      if (DATAOBJ.users[id] && typeof toclaim == "number") {
        //console.log(data)
        DATAOBJ.users[id].cows += toclaim;
        DATAOBJ.clicks += toclaim;
      }

      let total: number = DATAOBJ.clicks;
      let self: number = DATAOBJ.users[id]?.cows || 0;
      io.to(socket_client_id).emit("number", {
        total: total,
        self: self,
        id: id,
        name: DATAOBJ.users[id]?.name,
      });
    });
    socket.on(
      "clicked",
      (data: { vers: string; id: string; clicks: number }) => {
        if (data.vers) {
          if (data.vers != VERSION) {
            io.to(socket_client_id).emit(
              "refresh",
              "Outdated client, refreshing",
            );
          }
        } else {
          io.to(socket_client_id).emit(
            "refresh",
            "Outdated client, refreshing",
          );
        }
        //console.log("clicked: "+JSON.stringify(data));
        let id: string = data.id;
        let clicks: number = data.clicks;

        // Ensure id is unique
        if (!Object.keys(DATAOBJ.users).includes(id)) {
          let isdupe: boolean = true;
          while (isdupe) {
            id = Math.floor(10000000 + random() * 90000000).toString();
            if (!Object.keys(DATAOBJ.users).includes(id)) {
              isdupe = false;
            }
          }
          DATAOBJ.users[id] = { name: "cowcontributer", cows: 0, skins: {} };
        }

        // Ensure the user object exists before updating
        const user = DATAOBJ.users[id];
        if (user) {
          DATAOBJ.clicks += clicks;
          user.cows += clicks;
        }

        let total: number = DATAOBJ.clicks;
        let self: number = user?.cows || 0;
        if (!connections[id]) {
          return;
        }

        const connectionsocketidarray = connections[id];
        if (connectionsocketidarray) {
          for (let i = 0; i < connectionsocketidarray.length; i++) {
            const socketid = connectionsocketidarray[i];
            if (socketid) {
              io.to(socketid).emit("number", {
                total: total,
                self: self,
                id: id,
              });
            }
          }
          for (let i = 0; i < connectionsocketidarray.length; i++) {
            const socketid = connectionsocketidarray[i];
            if (socketid) {
              io.to(socketid).emit("leaderboard", {
                lb: getPlacement(id, DATAOBJ.users),
              });
            }
          }
        }

        connection_client_id = id;
        for (let i = 0; i < clicks; i++) {
          rollcowsite(socket_client_id);
        }
      },
    );

    socket.on("chat", (value: string) => {
      io.emit("chatmsg", {
        msg: value,
        id: connection_client_id,
        name: DATAOBJ.users[connection_client_id]?.name || "cowcontributor",
      });
    });
  });
}

//function to truncateString for username changes
function truncateString(str:string, num:number) {
  if (str.length > num) {
    return str.slice(0, num)
  } else {
    return str;
  }
}

//using node-crypto to ensure no time specific rng abnormalities
function random(): number {
  const crypto = require("crypto");
  return crypto.randomBytes(4).readUInt32LE() / 0xffffffff;
}

//For /roll site
function rollstakes(): { multi: number; value: number } {
  let rollednum = Math.floor(random() * 100);
  if (rollednum < 5) {
    return { multi: 0, value: rollednum };
  } else if (rollednum < 15) {
    return { multi: 0.1, value: rollednum };
  } else if (rollednum < 30) {
    return { multi: 0.2, value: rollednum };
  } else if (rollednum < 70) {
    return { multi: 1.1, value: rollednum };
  } else if (rollednum < 85) {
    return { multi: 1.5, value: rollednum };
  } else if (rollednum < 95) {
    return { multi: 2, value: rollednum };
  } else {
    return { multi: 3, value: rollednum };
  }
}

//rolling, intergrated soon...
function rollcowsite(socketid: string): void {
  let valuelist: { [key: string]: number } = {
    "epic cow": 200,
    "legendary cow": 500,
    "mythic cow": 1000,
    "miniso cow": 5000,
  };

  let multilist: { [key: string]: multilistelement } = {
    "epic cow": null,
    "legendary cow": { multi: 5, time: 10 },
    "mythic cow": { multi: 50, time: 5 },
    "miniso cow": { multi: 200, time: 5 },
  };
  let data: chancedataelemenet[] = [
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
  let totalsiterollweight: number = 0;

  // calculate sum using forEach() method
  data.forEach((obj) => {
    totalsiterollweight += obj.weight;
  });
  //console.log(totalsiterollweight)
  let roll: number = Math.floor(random() * totalsiterollweight);

  let cow: chancedataelemenet = {
    name: "NONE",
    weight: 50000,
  };
  for (let indexofdata = 0; indexofdata < data.length; indexofdata++) {
    const cowcurrentroll = data[indexofdata];
    if (cowcurrentroll) {
      if (roll < cowcurrentroll.weight) {
        cow = cowcurrentroll;
        break;
      }
      roll -= cowcurrentroll.weight;
    }
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
function getPlacement(id: string, users: any): number {
  //console.log("placementxalled")
  const obj: userplacementobj = users;
  let sortable: usersplacementsortingtype[] = [];
  for (const userarray in obj) {
    const cows = obj[userarray]?.cows;
    if (cows) {
      sortable.push([userarray, cows]);
    }
  }

  sortable.sort(function (a, b) {
    return b[1] - a[1];
  });

  //console.log(sortable)
  for (let i = 0; i < sortable.length; i++) {
    if (sortable) {
      const item = sortable[i];
      if (item) {
        const itemid = item[0];
        if (itemid) {
          if (itemid == id) {
            //console.log(i+1)
            return i + 1;
          }
        }
      }
    }
  }
  //console.log(0)
  return 0;
}

//Function to update Total cow count globally (setInterval(this))
function updateTotalGlobal(): void {
  clearEmpt();
  if (Object.keys(connections).length == 0) {
    return;
  }

  const totalclicks = DATAOBJ.clicks;
  io.emit("total", { total: totalclicks });

  //also update devlog
  if (DEVLOG_URL) {
    fetch(DEVLOG_URL)
      .then((r) => r.text())
      .then((text) => {
        if (devlog != text) {
          devlog = text;
          io.emit("devlog", devlog);
        }
      })
      .catch((error) => {
        console.log(`devlog fetching error: ${error}`);
      });
  }
}

//clear clutter IDs
function clearEmpt(): void {
  let data = DATAOBJ.users;
  let tobedeleted: string[] = [];
  for (const id in data) {
    if (data[id]) {
      if (
        data[id].cows == 0 &&
        !Object.keys(connections).includes(id) &&
        Object.keys(data[id].skins).length == 0
      ) {
        tobedeleted.push(id);
      }
    } else {
      tobedeleted.push(id);
    }
  }
  for (let index = 0; index < tobedeleted.length; index++) {
    const idtobedeleted = tobedeleted[index];
    if (idtobedeleted) {
      delete DATAOBJ.users[idtobedeleted];
    }
  }
}

//Function to roll a cow drop. Deps: getTotalWeight()
function rollcow(): string {
  //Function to get weight to randomize cow drops:
  function getTotalWeight(): number {
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
function ytapi(req: any, res: any): void {
  if (YOUTUBE_API_KEY) {
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
      .then((resdata: any) => {
        if (!resdata) {
          return;
        }
        let data: any = resdata;
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
          return;
        }
        cashedapi[q] = { data: data, uses: 0 };
        timeouts[q] = Number(
          setTimeout(
            () => {
              if (cashedapi[q]) {
                delete cashedapi[q];
              }
            },
            1000 * 60 * 60,
          ),
        );
        let item = data.items[Math.floor(random() * data.items.length)];
        res.send(JSON.stringify({ id: item.id.videoId, data: item }));
      })
      .catch((e) => {
        console.log(e);
        if (logtail) {
          logtail.error(e);
          logtail.flush();
        }
      });
  }
}

//global broadcast of uuids to duel page
function broadcastUUID(): void {
  let data = onlinetoduel;
  let newdata: string[] = [];

  for (let onlinerid in data) {
    if (data[onlinerid] && data[onlinerid].online) {
      newdata.push(onlinerid);
    }
  }

  for (let i = 0; i < newdata.length; i++) {
    const key = newdata[i];
    if (key) {
      const duelData = onlinetoduel[key];
      if (duelData) {
        io.to(duelData.socketid).emit("uuiddrop", newdata);
      } else {
        console.warn(`Duel data not found for key: ${key}`);
      }
    }
  }
}

//---------------------------------------------------------------------------------//
//main entrypoint:
function mainentry(): void {
  if (DATABASE_BACKUP_URL) {
    fetch(DATABASE_BACKUP_URL)
      .then((response) => response.json())
      .then((data: any) => {
        if (data) {
          DATAOBJ = JSON.parse(data);
          console.log("got data");
          http.listen(PROCESS_PORT, () => {
            console.log("Server listening on port " + PROCESS_PORT);

            if (logtail) {
              logtail.info(`Server started`);

              // Ensure that all logs are sent to Logtail
              logtail.flush();
            }
            setInterval(updateTotalGlobal, 1000); // updating total cow count every second
            socketSetup();
          });
        }
      })
      .catch((error) => {
        console.log("Error fetching data:", error);
      });
  } else {
    http.listen(PROCESS_PORT, () => {
      console.log("Server listening on port " + PROCESS_PORT);

      if (logtail) {
        logtail.info(`Server started`);

        // Ensure that all logs are sent to Logtail
        logtail.flush();
      }
      setInterval(updateTotalGlobal, 1000); // updating total cow count every second
      socketSetup();
    });
  }
}
//post req sending ACCESS_TOKEN

if (!DEVMODE && EXTERNAL_URL) {
  fetch(EXTERNAL_URL + "/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: `{"pass":"${ACCESS_TOKEN}"}`,
  }).catch((error) => {
    console.log(error);
    if (logtail) {
      logtail.error(error);
      logtail.flush();
    }
  });
}

setTimeout(mainentry, 1000);
setInterval(() => {
  SAVE_DATA(DATAOBJ, DEVMODE, DATABASE_BACKUP_URL);
}, 30 * 1000);
setInterval(broadcastUUID, 5000);
