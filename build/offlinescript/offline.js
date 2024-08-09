window.addEventListener("offline", (e) => {
  if(document.getElementById("offlinemodalbtn")){
    offlinemodal.click();
    return
  }
  document.body.innerHTML += `<button class="btn btn-primary" id="offlinemodalbtn" style="display:none;" data-bs-target="#offlinemodal" data-bs-toggle="modal">Open first modal</button>
<div class="modal" id="offlinemodal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">You are Offline!</h5>
      </div>
      <div class="modal-body">
        <p>please reconnect</p>
      </div>
      <div class="modal-footer">
      </div>
    </div>
  </div>
</div>`
  let offlinemodal = document.getElementById("offlinemodalbtn")
  offlinemodal.click();
});

window.addEventListener("online", (e) => {
  window.location.reload()
});