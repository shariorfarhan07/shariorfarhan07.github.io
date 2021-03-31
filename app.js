const text=document.querySelector(".container");
const form =document.querySelector('#form');

function renderText(doc){
let div=document.createElement('div');
div.classList.add("fromstyle");
div.setAttribute('data-id',doc.id);
let p =document.createElement('p')
p.textContent=doc.data().text;
div.appendChild(p);
text.appendChild(div);

}




db.collection('textme').get().then((snapshot)=>{
 snapshot.docs.forEach(doc => {
    renderText(doc);
 });

});


form.addEventListener('submit',(e)=>{
    e.preventDefault();
   if(form.name.value!==''){  
        db.collection('textme').add({text:form.name.value});
        form.name.value='';
       // window.setTimeout(location.reload(),1000);
       setTimeout("location.reload(true);", 1000);


    }
   
})
