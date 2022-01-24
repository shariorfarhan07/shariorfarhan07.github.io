let form=document.querySelector('#form');
form.addEventListener('click',function(e){
e.preventDefault();
let task=document.querySelector("#TextInput").value;
if(task.length!=0){
    savetolocalstorage(task);
    document.querySelector("#TextInput").value="";  
    document.querySelector('#tasklist').innerHTML='';
    getDataFromLocalStrage()  
}

});
getDataFromLocalStrage();

function savetolocalstorage(text){
    let data=localStorage.getItem("toDoList");
    let task=new Array();
    if (data === null){       
        task.push(text);
    }else{
        task=JSON.parse(data);
        task.push(text);
    }
    console.log(data);
    localStorage.setItem("toDoList",JSON.stringify(task));
}

function getDataFromLocalStrage(){
    
    let q='';
    let data=localStorage.getItem("toDoList");
   
    if(data!==null){
        data=JSON.parse(data);
     
        for(let i=0;i<data.length;i++){
             q=document.createElement('h3');
             q.setAttribute('id',"l"+i);
             q.innerHTML =i+1+'.'+data[i];
             document.querySelector('#tasklist').appendChild(q);
        }
    }
}