const socket = io();
let incskins = true;
const placementlabel = document.getElementById("placement");
const uuidlabel = document.getElementById("uuid");
const list = document.getElementById("lbl");
let lastdata;

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

function getLb() {
  socket.emit("getlb");
  //return {pos:2,id:"1",lb:[{id:"1",cows:23424},{id:"2",cows:23424}]}
}

//TODO: change to document.create
function format(lb, id) {
  let html = "";
  for (let i = 0; i < lb.length; i++) {
    //console.log(lb[if])
    let snippet = `<li onclick="window.location.href = '/profile/${lb[i].id}'" class="btn text-start list-group-item`;
    if (lb[i].id == id) {
      snippet += ` active`;
    }    
    
    snippet += `"> ${lb[i].name.replace(/</g, "&lt;").replace(/>/g, "&gt;")} <button class="btn btn-outline-secondary" onclick="copyid('${lb[i].id}');event.stopPropagation()">[${lb[i].id}]</button>`;
    //console.log(lb[i].online)
    if (lb[i].online) {
      snippet += `<span style="background:#3ad664" class="mx-3 badge rounded-pill">contributing</span>`;
    }
    snippet += `<span style="background:#b47aff" class="position-absolute top-50 end-0 translate-middle-y mx-3 badge rounded-pill">${lb[i].cows} cows</span></li>`;

    html += snippet;
  }
  return html;
}

function getPos(lb, id) {
  for (let i = 0; i < lb.length; i++) {
    if (lb[i].id == id) {
      return i + 1;
    }
  }
  return "unknown";
}

function loading() {
  list.innerHTML = `<li class="list-group-item active"><span class="placeholder-wave">
    <span class="placeholder" style="width:250px">

    </span>
  </span> </li>
  <li class="list-group-item"><span class="placeholder-wave">
    <span class="placeholder" style="width:250px">

    </span>
  </span></li>
  <li class="list-group-item"><span class="placeholder-wave">
    <span class="placeholder" style="width:250px">

    </span>
  </span></li>
  <li class="list-group-item"><span class="placeholder-wave">
    <span class="placeholder" style="width:250px">

    </span>
  </span></li>`;
}

async function main(data) {
  let lb;
  if(incskins){
    lb=data.inc
  }else{
    lb=data.lb
  }
  
  let id = getId();
  if (lb) {
    placementlabel.innerHTML = `Leaderboard Position: ${getPos(lb, id)}`;
    uuidlabel.innerHTML = `uuid: ${id}`;

    list.innerHTML = await format(lb, id);
  }
}

socket.on("lb", (data) => {
  lastdata = data
  main(data);
});

const copyid = async (id) => {
  try {
    await navigator.clipboard.writeText(id);
    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(
      document.getElementById("copytoast"),
    );
    document.getElementById('copybody').innerHTML = `ID ${id} copied!`
    toastBootstrap.show();
  } catch (err) {
    console.error('Failed to copy: ', err);
  }
}
socket.on("devlog", (text) => {
  console.log(text);
  document.getElementById('devlog').innerHTML = text;
});

window.onload = ()=>{
  setInterval(getLb, 5000);
  getLb();
}
