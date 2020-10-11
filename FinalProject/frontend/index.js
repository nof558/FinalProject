var status = 'OFF';
var timeUpInterval;
var voltInterval;
const url = 'http://localhost:3003';

async function toggle() {

    if (status === 'OFF'){
        console.log('turning on');
        status = 'ON';
        _getTimeUp();
        _getVolt();
    }else{
        status = 'OFF'
        clearInterval(timeUpInterval);
        clearInterval(voltInterval);
    }

    try {
        const response = await fetch(`${url}/power`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({status})
        });

        console.log('Completed!', response);
    } catch (err) {
        console.error(`Error: ${err}`);
    }
}

async function getTotalPower() {

    let input = document.getElementById("totalPower-input").value;
    const el = document.getElementById("totalPower");
    try {
        fetch(`${url}/getTotalPower`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({days:input})
        }).then( res => res.json())
        .then( data => {
        //   console.log(data);
          el.innerHTML= data.toString().substr(0,6);
        })

    } catch (err) {
        console.error(`Error: ${err}`);
    }
}

async function getAvgPowerPerAct() {

    const el = document.getElementById('avg-power');
    try {
        const ans = fetch(`${url}/getAvgPowerPerAct`, {
            method: 'GET',
            credentials: 'same-origin'
        }).then( res => res.json())
        .then( data => {
        //   console.log(data);
          el.innerHTML = data.toString().substr(0,6);
        })
        
    } catch (err) {
        console.error(`Error: ${err}`);
    }
}

async function getAvgDayAct() {
    let input = document.getElementById("avgDayAct-input").value;
    const el = document.getElementById("avgDayAct");
    try {
        const res = await fetch(`${url}/getAvgDayAct`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({days:input})
        }).then( res => res.json())
        .then( data => {
        //   console.log(data);
          el.innerHTML = data;
        })

    } catch (err) {
        console.error(`Error: ${err}`);
    }
}

async function getDevicesList(){
    console.log("getDevicesList");
    let el = document.getElementById("devices-select");

    try {
        const res = await fetch(`${url}/getDevicesList`, {
            method: 'GET',
            credentials: 'same-origin'
        }).then( res => res.json())
        .then( data => {
        //   console.log(data); 
            let htmlStr = "<option selected disabled>Choose a Device</option>";
            data.forEach(obj => {
                htmlStr += `<option value="${obj}"> ${obj} </option>`
            });
            el.innerHTML = htmlStr;
        })

    } catch (err) {
        console.error(`Error: ${err}`);
    }
}

async function setDevice(ev){
    console.log(ev.target.value);
    try {
        const res = await fetch(`${url}/setDevice`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({device: ev.target.value})
        }).then( res => res.json())
        .then( data => {
          console.log(data); 

        })

    } catch (err) {
        console.error(`Error: ${err}`);
    }
}

async function sendNotification(){
    let msg = document.getElementById("msg-input").value;

    try {
        const res = await fetch(`${url}/notify`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({msg})
        }).then( res => res.json())
        .then( data => {
          console.log(data); 
        })

    } catch (err) {
        console.error(`Error: ${err}`);
    }
}


function _getTimeUp(){
    const el = document.getElementById("time");

    let count = 0;
    timeUpInterval = setInterval(()=>{
        count++;
        el.innerHTML = `${count}s`;
    }, 1000);

}


function _getVolt(){
    const el = document.getElementById("volt");

    voltInterval = setInterval(()=>{
        el.innerHTML = (Math.random()*220).toString().substr(0,6);
    }, 1000);

}

