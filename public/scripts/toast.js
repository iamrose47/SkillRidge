// --------------------------notification----------------

const toastContent=document.getElementById('toast-content');

function notify(notification){
    let textContent;
    if(notification.type=='success'){
        textContent=`<i
        class="fa fa-check-circle fa-2x"
        aria-hidden="true"
        style="color: green"
      ></i>
      <div class="message">
        <span class="text text-1">Success</span>
        <span class="text text-2">${notification.message}</span>
      </div>`
    }
    else{
        textContent = `<i
      class="fa fa-exclamation-circle fa-2x"
      aria-hidden="true"
      style="color: red"
    ></i>
    <div class="message">
      <span class="text text-1">Error</span>
      <span class="text text-2">${notification.message}</span>
    </div>`;
    }
    toastContent.innerHTML=textContent;
    toastContent.parentElement.classList.add('tactive');
    setTimeout(()=>{
        toastContent.parentElement.classList.remove('tactive');
    },3000);

}