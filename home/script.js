
const main = document.getElementById('main')
const news = document.getElementsByClassName("news")

function search(){
  let query = document.getElementById("query").value;
  if(query.length == 0){
    return;
  }
  console.log(`https://www.google.com/search?q=`+encodeURIComponent(query))
  
  window.location.href=`https://www.google.com/search?q=`+encodeURIComponent(query)
}

async function getnews(){
  return
  const url = 'https://95d34174-b3f9-4041-bc89-c188d6ab97b9-00-dkjq9wib5u38.sisko.replit.dev:3001/getnews';

  const response = await fetch(url);

  const text = await response.text();

  //console.log(text);
  displaycards(text)
}

function displaycards(text){
  
  let articles = JSON.parse(text).articles;
  for (let i = 0; i < articles.length&&i<6; i++){
    news[i].innerHTML=`<h4>${articles[i].title}</h4>`
    news[i].onclick = ()=>{
      window.location.href = articles[i].url
    }
  }
}

function startTime() {
  const today = new Date();
  let h = today.getHours();
  let m = today.getMinutes();
  let s = today.getSeconds();
  m = checkTime(m);
  s = checkTime(s);
  document.getElementById('time').innerHTML =  h + ":" + m + ":" + s;
  setTimeout(startTime, 1000);
}

function checkTime(i) {
  if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
  return i;
}

getnews()
document.getElementById("query").addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    search()
  }
 })
let ctrlpressed = false
window.addEventListener("keydown", (event) => {
                         if (event.key === "Control") {
                           ctrlpressed = true
                         }
                       })

window.addEventListener("keyup", (event) => {
                         if (event.key === "Control") {
                           ctrlpressed = false
                         }
                       })

window.addEventListener("keydown", (event) => {
   if (event.key === "k") {
      if(ctrlpressed){
        document.getElementById('query').focus()
      }
   }
 })

document.getElementById('notesta').addEventListener("keypress", (event) => {
  let time = new Date().getTime()
  localStorage.setItem("notes", document.getElementById('notesta').value)
  localStorage.setItem("timesaved", time)
  lastsave = time
})


let datedisplay = document.getElementById('datedisplay')
let date = new Date()
let dayofweek = date.getDay()
let day = date.getDate()
let month = date.getMonth()
let year = date.getFullYear()
let week = {0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday"}
let months = {1:"January",2:"February",3:"March",4:"April",5:"May" ,6:"June",7:"July",8:"August",9:"September" ,10:"October",11:"November",12:"December"}
datedisplay.innerHTML = `<strong style="font-size:75px">${week[dayofweek]}</strong> ${day} ${months[month]} ${year}`

document.getElementById('notesta').value = localStorage.getItem("notes")
