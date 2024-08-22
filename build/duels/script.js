const socket = io();

let stakes = 1 / 100;
let stakesdropdown = document.getElementById("stakes");

let clickintervalarray = [];
let clickintervalindex = 0;
let autoclickercount = 0;
let autoclickd = 15;
let timelastclickedforarray = Date.now();
let acac = false;
let timeend;
let timestart;
let resultpage = document.getElementById("resultpage");
let duelpage = document.getElementById("duelpage");
let initpage = document.getElementById("initpage");
let youclicksd = document.getElementById("youclicks");
let enemyclicksd = document.getElementById("enemyclicks");
let youclick = 0;
let enemyclick = 0;
let induel = false;

socket.on("devlog", (text) => {
  console.log(text);
  document.getElementById('devlog').innerHTML = text;
});
function autoclickcheck() {
  if (clickintervalarray.length != 10) {
    console.log("First clicks");
    return;
  }
  let freezedarray = clickintervalarray;
  freezedarray.sort(function (a, b) {
    return a - b;
  });
  if (freezedarray[9] - freezedarray[0] < 5) {
    if (acac) {
      alert("Irregular clicking detected, Please do not use an autoclicker.");
    }
  }
  //assuming only autoclickers have <xms deviation
  if (freezedarray[9] - freezedarray[0] < autoclickd) {
    console.log("autoclicker detected: " + JSON.stringify(freezedarray));
    autoclickercount += 1;

    if (autoclickercount > 9) {
      if (acac) {
        alert("Irregular clicking detected, Please do not use an autoclicker.");
      }
    }
  }
}

document.body.addEventListener("click", (e) => {
  console.log(clickintervalarray);
  let newlasttimeclickedforarray = Date.now();
  clickintervalarray[clickintervalindex] =
    newlasttimeclickedforarray - timelastclickedforarray;
  timelastclickedforarray = newlasttimeclickedforarray;

  if (clickintervalindex > 8) {
    clickintervalindex = 0;
  } else {
    clickintervalindex++;
  }

  autoclickcheck();
});

socket.on("duelrequest", (data) => {
  let reqid = data.id;
  let acac = data.acac;
  let toast = new bootstrap.Toast(document.getElementById("reqt"));
  document.getElementById("toastbody").innerHTML;

  let html = `
                User ${reqid} requested a duel
                <br>
                Stakes: ${data.stakes * 100}%
                <br>`;
  if (acac) {
    html += `
                  Autoclicker detection <span class="text-success">ENABLED</span>`;
  } else {
    html += `
                  Autoclicker detection <span class="text-danger">DISABLED</span>`;
  }
  html += `
              <br><button type="button" class="btn btn-outline-primary btn-sm" onclick="console.log('accepted duel');socket.emit('acceptd',{requesterid:'${reqid}',stakes:${data.stakes},acac:${acac},conskin:'${localStorage.getItem("skin-src")}',reqskin:'${data.reqskin}'})">Accept</button>`;
  document.getElementById("toastbody").innerHTML = html;

  toast.show();
});

socket.on("connect", () => {
  if (!getId()) {
    alert("please contribute cows before dueling");
    window.location.href = "/";
  }
  socket.emit("duelid", { id: getId() ,hash:localStorage.getItem("hash")});
});

socket.on("terminate", async (reason) => {
  await prompt(reason);
  window.location.href = "/";
});

socket.on("startduel", (data) => {
  let enemyname = data.enemyname;
  let enemyid = data.enemyid;
  let diff = data.time - Date.now();
  let starton = data.starton - diff;
  let endon = data.endon - diff;
  document.getElementById("youbtnimg").src = data.skin;
  document.getElementById("enemybtnimg").src = data.enemyskin;

  if (data.acac) {
    acac = true;
    console.log("on");
  } else {
    acac = false;
  }
  startduel(enemyname, enemyid, starton, endon);
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
          document.getElementById("selfuuid").innerHTML = id;
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

socket.on("duelend", (result) => {
  //console.log(Date.now());
  if (!induel) {
    return;
  }
  acac = false;
  let win = result.win;

  resultpage.style.display = "block";
  induel = false;
  let mainresult = document.getElementById("mainresult");
  if (win) {
    mainresult.innerHTML = `You Won!`;
  } else {
    mainresult.innerHTML = `You Lost!`;
  }
  let cpsrow = document.getElementById("cpsrow");
  let clicksrow = document.getElementById("clicksrow");
  let reward = document.getElementById("reward");

  reward.innerHTML = `${result.reward} cows`;
  cpsrow.innerHTML = `
  <th scope="row" style="background-color: transparent">average CPS:</th>
      <td style="background-color: transparent">${(result.youclick / 10).toFixed(1)}cps</td>
      <td style="background-color: transparent">${(result.enemyclick / 10).toFixed(1)}cps</td>`;
  clicksrow.innerHTML = `
      <th scope="row" style="background-color: transparent">Clicks</th>
      <td style="background-color: transparent">${result.youclick}</td>
      <td style="background-color: transparent">${result.enemyclick}</td>
      `;
  youclicksd.innerHTML = result.youclick;
  enemyclicksd.innerHTML = result.enemyclick;
  document.getElementById("youcps").innerHTML =
    `${(result.youclick / 10).toFixed(1)}cps`;

  document.getElementById("enemycps").innerHTML =
    `${(result.enemyclick / 10).toFixed(1)}cps`;
});

socket.on("enemyduelclick", () => {
  enemyclick++;
  enemyclicksd.innerHTML = enemyclick;
  displayprogress();
});

function displayprogress() {
  let fightprogress = document.getElementById("fightprogress");
  fightprogress.style.width = `${Math.floor((youclick / (enemyclick + youclick)) * 100)}%`;
}

function displaycps() {
  let youcps = document.getElementById("youcps");
  let enemycps = document.getElementById("enemycps");
  if (timeend < Date.now()) {
    return;
  }
  youcps.innerHTML =
    (
      Math.round((youclick / ((Date.now() - timestart) / 1000)) * 10) / 10
    ).toFixed(1) + "cps";

  enemycps.innerHTML =
    (
      Math.round((enemyclick / ((Date.now() - timestart) / 1000)) * 10) / 10
    ).toFixed(1) + "cps";
  setTimeout(displaycps, 50);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startduel(enemyname, enemyid, starton, endon) {
  induel = true;
  resultpage.style.display = "none";
  duelpage.style.display = "block";
  initpage.style.display = "none";
  document.getElementById("enemyname").innerHTML = enemyname;
  youclick = 0;
  enemyclick = 0;
  youclicksd.innerHTML = youclick;
  enemyclicksd.innerHTML = enemyclick;

  console.log(starton);
  if (starton - Date.now() > 0) {
    document.getElementById("getready").style.display = "block";
    document.getElementById("startdetails").innerHTML =
      `Enemy: ${enemyname}<br>[${enemyid}]`;
    while (starton > Date.now()) {
      document.getElementById("waitingprogress").style.width =
        (((starton - Date.now()) / 3000) * 100).toFixed(1) + "%";
      await sleep(20);
    }
    document.getElementById("getready").style.display = "none";
  }

  //wait
  timestart = starton;
  timeend = endon;
  displaycps();
  while (Date.now() < timeend) {
    document.getElementById("timeleft").innerHTML =
      (Math.round((timeend - Date.now()) / 100) / 10).toFixed(1) + "s";
    await sleep(10);
    if (Date.now() >= timeend) {
      document.getElementById("timeleft").innerHTML = "0s";
      break;
    }
  }
}

function clicked() {
  if (!induel) {
    alert("Not in duel");
    return;
  }
  youclick++;

  youclicksd.innerHTML = youclick;
  socket.emit("duelclick");
  displayprogress();
}

document.getElementById("cowbtn").addEventListener("keydown", (e) => {
  e.preventDefault();
});
document.getElementById("duelbtn").onclick = () => {
  if (document.getElementById("uuid").value) {
    if (document.getElementById("uuid").value == getId()) {
      let ans = prompt("u really wanna duel yourself lmao?(yes/no):");
      if (ans != "yes") {
        return;
      }
    }
    socket.emit("duelrequest", {
      id: document.getElementById("uuid").value,
      stakes: stakes,
      acac: document.getElementById("acac").checked,
      reqskin: localStorage.getItem("skin-src"),
    });
    senttoast(document.getElementById("uuid").value);
    document.getElementById("duelbtn").disabled = true;
    setTimeout(() => {
      document.getElementById("duelbtn").disabled = false;
    }, 1000);
  }
};

function senttoast(uuid) {
  let toast = new bootstrap.Toast(document.getElementById("senttoast"));
  document.getElementById("duelreqsent").innerHTML = uuid;
  toast.show();
}

//enemyduelclick
//duelend
//startduel
//terminate
//duelrequest
///////
//acceptd
//duelid

function start() {
  induel = false;
  resultpage.style.display = "none";
  duelpage.style.display = "none";
  initpage.style.display = "block";
  document.getElementById("enemyname").innerHTML = "--";
  youclick = 0;
  enemyclick = 0;

  if (!getId()) {
    alert("please contribute cows before dueling");
    window.location.href = "/";
  }
  //console.log(getId());
  socket.emit("duelid", { id: getId() });
}

socket.on("duelannounce", (text) => {
  document.getElementById("feedbox").innerHTML += `<h5>
  ${text}
</h5>`;
});

socket.on("uuiddrop", (data) => {
  let html = "";
  console.log(data);
  for (let i = 0; i < data.length; i++) {
    html += `<li> <button class="dropdown-item text-secondary" onclick="document.getElementById('uuid').value=this.innerHTML;" >${data[i]}</button> </li>`;
  }
  document.getElementById("uuiddrop").innerHTML = html;
});

window.onload = start;
