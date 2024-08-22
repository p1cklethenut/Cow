const socket = io()
let id;
socket.on("connect",()=>{
socket.emit("roll",{init:{id:getId(),hash:localStorage.getItem("hash")}})
})
socket.on("terminate",(msg)=>{
    alert(msg);
    window.location.href = "/";
})
socket.on("data",(data)=>{
    let {dataid,cows,name} = data;
    document.getElementById("cows").innerHTML = `${cows} cows`
    document.getElementById("name").innerHTML = truncateString(name,20);
    id = dataid

})
function truncateString(str, num) {
  if (str.length > num) {
    return str.slice(0, num) + "...";
  } else {
    return str;
  }
}
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


function getColor(multi) {
    if (multi < 5) {
        return "rgba(255,20,20,0.6)";
    } else if (multi < 15) {
        return "rgba(200,40,40,0.6)";
    } else if (multi < 33) {
        return "rgba(70,0,0,0.6)";
    } else if (multi < 77) {
        return "rgba(0,240,0,0.6)";
    } else if (multi < 85) {
        return "rgba(0,200,255,0.6)";
    } else if (multi < 95) {
        return "rgba(0,0,255,0.6)";
    } else {
        return "rgba(210,0,255,0.6)";
    }
}
function rollextra() {
      let rollednum = Math.floor(Math.random() * 100);
    if (rollednum < 5) {
        return { multi: 0, value: rollednum };
      } else if (rollednum < 15) {
        return { multi: 0.1, value: rollednum };
      } else if (rollednum < 33) {
        return { multi: 0.2, value: rollednum };
      } else if (rollednum < 77) {
        return { multi: 1.1, value: rollednum };
      } else if (rollednum < 85) {
        return { multi: 1.5, value: rollednum };
      } else if (rollednum < 95) {
        return { multi: 2, value: rollednum };
      } else {
        return { multi: 3, value: rollednum };
      }
  }
function clicked(){
    socket.emit("roll",{id:id||getId(),stakes: parseInt(document.getElementById("stake").innerHTML || "1000"),hash:localStorage.getItem("hash")})
    document.getElementById("startbtn").disabled = true;
}
socket.on("devlog", (text) => {
  console.log(text);
  document.getElementById('devlog').innerHTML = text;
});
socket.on("roll",(data)=>startRolling(data))
async function startRolling(result) {


    if (result) {
        if (result.notenough) {
            new bootstrap.Toast(
                document.getElementById("notenoughtoast"),
            ).show();
            document.getElementById("startbtn").disabled = false
            return;
        }
        if(result.noacc){
            alert("Please contribute cows before rolling");
            window.location.href = "/";
        }
    } else {
        alert("Cannot connect to server, please refresh.");
        return;
    }
    let gain;

    let {dataid,cows,name} = result;
    document.getElementById("name").innerHTML = truncateString(name,20);
    id = dataid
    let multi = result.multi;
    let stakes = result.stakes
    let value = result.value;
    const btn = document.getElementById("startbtn");
    const slider = document.getElementById("slider");
    const outerslider = document.getElementById("outerslider");
    slider.innerHTML = "";

    for (let i = 0; i < 79; i++) {
        const startitem = document.createElement("div");
        const rolldata = rollextra();
        startitem.classList.add("front-item", "item", "card");
        startitem.style.backgroundColor = getColor(rolldata.value);

        startitem.innerHTML = `<div class="card-body">
                 <h2>x${rolldata.multi}</h2>
               </div>`;
        slider.appendChild(startitem);
    }
    for (let i = 0; i < 1; i++) {
        const item = document.createElement("div");
        item.classList.add("front-item", "item", "card");
        item.style.backgroundColor = getColor(value);
        item.innerHTML = `<div class="card-body">
                     <h2>x${multi}</h2>
                   </div>`;
        gain = Math.floor(stakes * multi);
        slider.appendChild(item);
    }

    for (let i = 0; i < 20; i++) {
        const enditem = document.createElement("div");
        const rolldata = rollextra()

        enditem.classList.add("item", "card");
        enditem.style.backgroundColor = getColor(rolldata.value);

        enditem.innerHTML = `<div class="card-body">
                 <h2>x${rolldata.multi}</h2>
               </div>`;
        slider.appendChild(enditem);
    }
    slider.style.transition = `none`;
    btn.disabled = true;
    btn.innerHTML = "Rolling...";
    // Reset the slider position to the right
    slider.style.left = "100%";
    const items = document.querySelectorAll(".front-item");

    // Calculate the width of all items combined
    const itemWidth = items[0].offsetWidth;
    const totalWidth = itemWidth * items.length;

    // Set the new left position to slide to the left
    const finalLeftPosition =
        (totalWidth - outerslider.offsetWidth / 2 - Math.random() * itemWidth) *
        -1;

    // Apply the slide transition
    slider.style.transition = `left 5s cubic-bezier(.15,.91,.45,1)`;
    slider.style.left = `${finalLeftPosition}px`;

    // Highlight the middle item when the transition ends
    setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = `roll`;
        document.getElementById("cows").innerHTML = `${cows} cows`

        showRollScreen(multi, gain, stakes);
    }, 5000); // Match this to the transition duration
}

function showRollScreen(multiplier, gain, stakes) {
    const finishscreen = document.getElementById("finishscreen");
    finishscreen.style.display = "block";
    document.getElementById("resulttitle").innerHTML =
        `You ${multiplier > 1 ? "won" : "lost"} ${gain - stakes} cows!`;
    document.getElementById("resultmulti").innerHTML = `x${multiplier}`;

}
