document.getElementById("q").addEventListener("keypress",(e)=>{
  if(e.key == "Enter"){
    clicked()
  }
})
let currently = false;
let btn = document.getElementById('btn')
let vidid;
let title;
let turl;
let channelTitle;
let gotten = false;
let check = document.getElementById('check')
check.onchange = display
async function clicked() {
  if(currently){return}
  currently = true
  btn.innerHTML = `
  <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
  <span role="status"></span>`
  let q = document.getElementById("q").value;
  const url = "/cowtubeapi";

  const data = `{"q":"${q}"}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: data,
  });

  const json = await response.json();
  
  console.log(json);
  vidid = json.id;
  title = json.data.snippet.title;
  turl = json.data.snippet.thumbnails.high.url
  channelTitle = json.data.snippet.channelTitle;
  gotten = true
  display()
  currently = false
  btn.innerHTML = "search"
}

function display()
{
  if (!gotten){return}
  if(check.checked){
    document.getElementById('result').innerHTML = `
    <div class="video-container">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/${vidid}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>`

  }else{

      document.getElementById('result').innerHTML = `
                        <div class="translate-middle-x btn card" style="width: 40%;left:50%;" onclick="window.open('https://youtube.com/watch?v=${vidid}', '_blank').focus();
    ">
                            <img src="${turl}" class="card-img-top" alt="...">
                            <div class="card-body">
                                <h5 class="card-title">${title}</h5>
                                <p class="card-text">${channelTitle}</p>
                            </div>
                        </div>`
  }
}


