const socket = io();
const number = document.getElementById("num");
const self = document.getElementById("selfnum");
const usernamedisplay = document.getElementById("user");
const usernamechangebox = document.getElementById("usernamechangebox");
const cowbtn = document.getElementById("cowbtn");
let clickintervalarray = [];
let clickintervalindex = 0;
const savebtn = document.getElementById("savebtn");
let clickbuffer = 0;

let clicksendbuffer = 0;
let username;
let autoclickercount = 0;
let vers = "1.1";
//console.log(1)
let clickmulti = 1;
let selfid;
let timelastclicked = 0;
let cowimgs = [];
let width = 350;
let totalcows = 0;
let selfcows = 0;
let leaderboardpos;
let globalselfskins;
let globalallskins;
let equippedskin = "cow";
let skinsrc = "/cow.png";
let timelastclickedforarray = Date.now();
let autoclickd = 15;
let devlog = document.getElementById("devlog");
const toastContainer = document.getElementById("toast-container");
let multied = false;
let unread = 0;
let chatbtn = document.getElementById("chatbtn");
let chatbox = document.getElementById("chatbox");
let chatinput = document.getElementById("chatinput");
let skinbtn = document.getElementById("skinbtn");
chatinput.addEventListener("keydown", (e) => {
  //check if enter is pres
  if (e.key == "Enter") {
    //send message
    if (chatinput.value) {
      socket.emit("chat", chatinput.value);
      chatinput.value = "";
    }
  }
});
document.body.addEventListener("keydown",(e)=>{
  if(e.key=="/"){
    if(document.activeElement==chatinput){return}
    
      chatinput.focus()

    e.preventDefault()
  }
})
socket.on("drop", (data) => {
  createToast(data.msg, data.value, data.multi);
});

socket.on("chatmsg", (data) => {
  let username = data.name;
  let msg = data.msg;
  let id = data.id;
  chatbox.innerHTML += `
              <div class="w-100 text-wrap m-0 py-0 d-flex text-break"><strong>${escape_html(username)} [${escape_html(id)}]:</strong>${escape_html(msg)}</div>`;
  chatbox.scrollTo(0, chatbox.scrollHeight);
    unread ++
    chatbtn.innerHTML = `chat <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
    ${unread}
  </span>`
});
function escape_html(str) {
  if (str === null || str === "") return false;
  else str = str.toString();

  var map = {
    "&": "&",
    "<": "<",
    ">": ">",
    '"': '"',
    "'": "'",
  };

  return str.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}
socket.on("msg", (msg) => {
  document.getElementById("msg").style.display = "block";
  document.getElementById("msgmsg").innerHTML = msg;
});

socket.on("skinupdate", (data) => {
  let selfskins = data.skins;
  let allskins = data.allskins;
  globalselfskins = selfskins;
  globalallskins = allskins;
  displayskins(selfskins, allskins);
  if (
    !Object.keys(selfskins).includes(equippedskin) ||
    !Object.keys(selfskins).includes(localStorage.getItem("equipped-skin"))
  ) {
    localStorage.setItem("equipped-skin", "cow");
    localStorage.setItem("skin-src", "/cow.png");
    document.getElementById("cowbtn").children[0].src =
      localStorage.getItem("skin-src");
  }
});

socket.on("connect", (data) => {
  socket.emit("id", getId());
});

socket.on("total", (data) => {
  totalcows = data.total;
  updatedisplay();
});

socket.on("leaderboard", (data) => {
  let pos = data.lb;
  if (leaderboardpos != pos) {
    leaderboardpos = pos;
  }
});

socket.on("number", (data) => {
  //console.log(data)
  clicksendbuffer = 0;
  totalcows = data.total;
  selfcows = data.self;
  updatedisplay();
  localStorage.setItem("id", data.id);
  if (selfid != data.id) {
    document.getElementById("uuid").innerHTML = `
    uuid: ${data.id}
    `;
    selfid = data.id;
    document.getElementById("cowbtn").onclick = clicked;
    document.getElementById("cowbtn").addEventListener("keydown", (e) => {
      e.preventDefault();
    });
    usernamedisplay.innerHTML = data.name
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    usernamechangebox.value = data.name;
    username = data.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
});

socket.on("newusername", (data) => {
  usernamedisplay.innerHTML = data.name
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  usernamechangebox.value = data.name;
});

socket.on("devlog", (text) => {
  console.log(text);
  devlogadd(text);
});

socket.on("refresh", (r) => {
  alert(r);
  window.location.reload();
});

function getId() {
  let id = localStorage.getItem("id");
  if (!id) {
    return null;
  } else {
    if (id.length == 8) {
      try {
        let parsedid = parseInt(id);
        if (parsedid > 0) {
          return id;
        } else {
          return null;
        }
      } catch (e) {
        return null;
      }
    }
  }
}

let actested = false;
async function clicked() {
  clickbuffer += clickmulti;
  updatedisplay();

  //console.log((width *0.8).toFixed(0)+"px")
  cowbtn.style.width = (width * 0.8).toFixed(0) + "px";

  //cowbtn.style.height = (document.getElementById('cowimg').offsetHeight *0.8).toFixed(0)+ "px"

  let secs = 150;
  let options = [1, 2, 3, 5, 10];
  let num = options[Math.floor(Math.random() * options.length)];
  for (let i = 0; i < num; i++) {
    clickeffect(cowbtn);
    await sleep(secs / num);
  }
  cowbtn.style.width = width + "px";
  cowbtn.style.height = document.getElementById("cowimg").offsetHeight + "px";
}

function updatedisplay() {
  number.innerHTML =
    "Total Cows: " + (totalcows + clickbuffer + clicksendbuffer);
  if (leaderboardpos) {
    self.innerHTML =
      "Your contributions: " +
      (selfcows + clickbuffer + clicksendbuffer) +
      `<br>Leaderboard Position: ${leaderboardpos}`;
  } else {
    self.innerHTML =
      "Your contributions: " + (selfcows + clickbuffer + clicksendbuffer);
  }
}

function generatecowimgid() {
  let id = Math.floor(Math.random() * 1000000);
  while (cowimgs.includes(id)) {
    id = Math.floor(Math.random() * 1000000);
  }
  return id;
}

async function clickeffect(cowbtn) {
  if (cowimgs.length > 75) {
    return;
  }
  let cowid = generatecowimgid();
  let element = `
  <div id="${await cowid}" class="cowparticle" style="
        left: ${Math.floor(Math.random() * cowbtn.offsetWidth)}px;
        top:${Math.floor(Math.random() * cowbtn.offsetHeight)}px;
        width:${Math.floor((Math.random() * cowbtn.offsetWidth) / 10) + cowbtn.offsetWidth / 20}px;">
  <img src="/cow.png">
  </div>`;

  cowbtn.innerHTML += element;
  cowimgs.push(cowid);
  for (let i = 0; i < 25; i++) {
    let cowparticle = document.getElementById(cowid);
    cowparticle.style.opacity = 1 - ((1 / 25) * i) ** 2;
    await sleep(1000 / 50);
  }
  let cowimg = document.getElementById(cowid);
  cowimgs.splice(cowimgs.indexOf(cowid), 1);
  //console.log(cowimg)
  cowimg.remove();
}

async function sleep(ms) {
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve();
    }, ms),
  );
}

function savenewuser() {
  if (
    usernamechangebox.value.length == 0 ||
    usernamechangebox.value == username
  ) {
    return;
  }
  //console.log(usernamechangebox.value);
  socket.emit("changeusername", { name: usernamechangebox.value });
  bootstrap.Modal.getInstance(
    document.getElementById("userchangemodal"),
  ).hide();
}

async function update() {
  if (clickbuffer > 0) {
    socket.emit("clicked", { id: getId(), clicks: clickbuffer, vers: vers });
    clicksendbuffer = clickbuffer;
    clickbuffer = 0;
  }
  await sleep(1000);
  update();
}

function devlogadd(text) {
  devlog.innerHTML = text;
}

function createToast(message, value, multi) {
  const toast = document.createElement("div");
  toast.classList.add("toast", "border", "border-primary"); // Add basic styling
  toast.setAttribute("data-bs-autohide", "false");
  let html = `
    <div class="toast-header">
      <strong class="me-auto">Special Cow Dropped!</strong>
      <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()" aria-label="Close"></button>
    </div>
    <div class="toast-body">
      ${message}
<div class="mt-2 pt-2 border-top">
      <button type="button" class="btn btn-primary btn-sm" onclick="this.parentElement.parentElement.parentElement.remove();claimdrops(${value})">claim: +${value}</button>`;

  if (multi) {
    html += `
      <button type="button" class="btn btn-outline-primary btn-sm" onclick="multi(this,${multi.multi},${multi.time})">Activate Multi: x${multi.multi} for ${multi.time}s`;
  }

  html += `
    </div>      
    </div>
  `;
  toast.innerHTML = html;
  toastContainer.appendChild(toast);
  const toastInstance = new bootstrap.Toast(toast); // Initialize Bootstrap toast
  toastInstance.show(); // Show the toast
}

function multi(btn, multi, time) {
  if (multied) {
    return;
  }
  btn.parentElement.parentElement.parentElement.remove();
  multied = true;
  clickmulti = multi;
  document.getElementById("multi").innerHTML = "x" + multi;
  //console.log(time*1000)
  //console.log(time)
  setTimeout(() => {
    clickmulti = 1;
    multied = false;
    document.getElementById("multi").innerHTML = "x1";
  }, time * 1000);
}

function claimdrops(value) {
  socket.emit("claimdrop", { id: selfid, toclaim: value });
}

function autoclickcheck() {
  if (clickintervalarray.length != 10) {
    console.log("First clicks");
    return;
  }
  let freezedarray = clickintervalarray;
  freezedarray.sort(function (a, b) {
    return a - b;
  });
  //console.log(clickintervalarray)
  //console.log((freezedarray[9]-freezedarray[0])<autoclickd)
  // now is in diff to first
  if (freezedarray[9] - freezedarray[0] < 5) {
    socket.emit("autoclicker", { id: selfid, array: freezedarray });

    alert("Irregular clicking detected, Please do not use an autoclicker.");

    window.location.reload();
  }
  //assuming only autoclickers have <xms deviation
  if (freezedarray[9] - freezedarray[0] < autoclickd) {
    console.log("autoclicker detected: " + JSON.stringify(freezedarray));
    autoclickercount += 1;

    if (autoclickercount > 9) {
      socket.emit("autoclicker", { id: selfid, array: freezedarray });

      alert("Irregular clicking detected, Please do not use an autoclicker.");

      window.location.reload();
    }
  }
}

function displayskins(selfskins, allskins) {
  let div = document.getElementById("skins");
  let html = "";
  for (const skinid in allskins) {
    let skinname = allskins[skinid].name;
    let skindata = allskins[skinid];
    //console.log(skindata);
    html += `
              <div class="card d-inline-flex m-2 p-3" style="width: 18rem;">
                  <img 
style="height:15em;  object-fit: contain;
" src="${skindata.src}" class="card-img-top" alt="...">
                  <div class="card-body">
                      <h2 class="card-title">${skinname}</h2>
                      <p class="card-text pb-1 mb-0" style="color:${skindata.color}">${skindata.rarity}</p><p class="p-0 m-0 card-text fs-6">cost: ${skindata.cost} cows</p>`;
    if (selfskins[skinid]) {
      //own the skin
      if (equippedskin == skinid) {
        //console.log(skindata);
        html += `
      <a onclick="equippedskin = 'cow';document.getElementById('cowbtn').children[0].src='/cow.png';document.getElementById('btnparent').style.height=(cowbtn.offsetHeight+100)+'px';displayskins(globalselfskins,globalallskins);localStorage.setItem('equipped-skin','cow');localStorage.setItem('skin-src','/cow.png')" class="btn btn-outline-secondary">unequip</a>`;
      } else {
        //currently not equiped, button to equip
        html += `
              <a onclick="equippedskin = '${skinid}';document.getElementById('cowbtn').children[0].src='${skindata.src}';document.getElementById('btnparent').style.height=(cowbtn.offsetHeight+100)+'px';localStorage.setItem('equipped-skin','${skinid}');localStorage.setItem('skin-src','${skindata.src}');displayskins(globalselfskins,globalallskins)" class="btn btn-outline-primary">equip</a>`;
      }
    } else {
      //dont own the skin, prompt to buy

      html += `
                      <a onclick="if(selfcows>${skindata.cost}){socket.emit('buyskin','${skinid}')}else{
                      const cantbuytoast = document.getElementById('cantbuytoast')

                      const toastBootstrap = bootstrap.Toast.getOrCreateInstance(cantbuytoast)
                      toastBootstrap.show()
                      }"
                      class="btn btn-primary">${skindata.cost} cows</a>`;
    }
    html += `
                  </div>
              </div>
              `;
  }
  div.innerHTML = html;
}

function actest() {
  let t1 = Date.now();
  let ans = "";
  let text = ["sigma", "skibidi", "gyatt", "meow", "cow", "moo"][
    Math.floor(Math.random() * 6)
  ];
  while (ans != text) {
    ans = prompt(`Autoclicker test\nType ${text}:`);
  }
  if (Date.now() - t1 > 1000 * 5) {
    window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  }

  setTimeout(
    actest,
    Math.floor(Math.random() * 1000 * 60 * 10) + 1000 * 60 * 15,
  );
}

setInterval(() => {
  autoclickercount = 0;
}, 5000);

let lastmovedmouse = Date.now();
let clickedsincemove = 0;
document.addEventListener("mousemove", (event) => {
  lastmovedmouse = Date.now();
  clickedsincemove = 0;
});

window.onload = function () {
  if (localStorage.getItem("equipped-skin")) {
    if (localStorage.getItem("skin-src")) {
      document.getElementById("cowbtn").children[0].src =
        localStorage.getItem("skin-src");
      skinsrc = localStorage.getItem("skin-src");
      cowbtn.style.width = width + "px";
      document.getElementById("btnparent").style.height =
        cowbtn.offsetHeight + 100 + "px";
    }

    equippedskin = localStorage.getItem("equipped-skin");
  } else {
    localStorage.setItem("equipped-skin", "cow");
    localStorage.setItem("skin-src", "/cow.png");
    document.getElementById("cowbtn").children[0].src =
      localStorage.getItem("skin-src");
  }
  update();
};

document.body.addEventListener("click", (e) => {
  //console.log("clicked")
  ///////////////
  ///////////////
  let newlasttimeclickedforarray = Date.now();
  clickintervalarray[clickintervalindex] =
    newlasttimeclickedforarray - timelastclickedforarray;
  timelastclickedforarray = newlasttimeclickedforarray;

  if (clickintervalindex > 8) {
    clickintervalindex = 0;
  } else {
    clickintervalindex++;
  }
  ///////////////
  autoclickcheck();
  clickedsincemove += 1;
  if (clickedsincemove > 20 * 60 * 10 && !actested) {
    actest();
    actested = true;
  }
  if (timelastclicked != undefined) {
    if (timelastclicked + 50 > Date.now()) {
      //console.log(timelastclicked+50 < Date.now())
      return;
    }
  }
  timelastclicked = Date.now();
  //console.log("registed")
  //const mooaudio = new Audio("/moo.mp3");
});
