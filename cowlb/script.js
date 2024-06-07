const socket = io();

const placementlabel = document.getElementById("placement");
const uuidlabel = document.getElementById("uuid");
const list = document.getElementById("lbl");
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
    let snippet = `<li class="list-group-item`;
    if (lb[i].id == id) {
      snippet += ` active`;
    }    
    
    snippet += `"> ${lb[i].name.replace(/</g, "&lt;").replace(/>/g, "&gt;")} [${lb[i].id}]`;
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
  let lb = data;
  let id = getId();
  if (lb) {
    placementlabel.innerHTML = `Leaderboard Position: ${getPos(lb, id)}`;
    uuidlabel.innerHTML = `uuid: ${id}`;

    list.innerHTML = await format(lb, id);
  }
}
console.log(1);
getLb();
socket.on("lb", (data) => {
  main(data);
});

setInterval(getLb, 5000);
