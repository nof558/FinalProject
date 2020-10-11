//--NodeJs Express server setup
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const https = require("https");
const cors = require('cors');
app.use(cors());
app.use(express.json());

//--mosca server setup
//init mosca mqtt server (broker)
const mosca = require('mosca');
const settings = {port:1883}
const moscaServer = new mosca.Server(settings);

moscaServer.on('ready', function(){
    console.log("mosca (MQTT) server ready", settings);
});

//--mqtt setup
const mqtt = require('mqtt');
//the mqtt sever is running on our nodejs server that runs on localhost (127.0.0.1)
const url = '127.0.0.1';
const client  = mqtt.connect(`mqtt://${url}`);

//--mongoDB service setup
const mongoService = require('./mongoService');

//--Globals
var dataInterval;
var awakeInterval;
var alertTimeInterval;
var alertPowerInterval;
var awakeTime = 0;
var device = 'sonoff'; // 1.for device connection, 2.for mongo

// app.post('/power', async (req,res)=>{
//     console.log('post /power', req.body);
//     client.publish(`cmnd/sonoff/Power`, ' 2');
//     // client.publish(`cmnd/sonoff/Color1`,'3');
// })

app.post('/setDevice', async(req, res)=>{
    console.log(req.body);
    device = req.body.device;
    res.json('device set');
})

app.post('/power', async (req, res) => {
    console.log('power', req.body);
    if (req.body.status === 'ON') {
        client.publish(`cmnd/${device}/Power`, req.body.status);
        _startTimer();
        _alert();
        _sendDataToDb(Date.now());

       res.send(JSON.stringify({status: req.body.status}));
   } else {
       clearInterval(awakeInterval);
       clearInterval(dataInterval);
       clearInterval(alertTimeInterval);
       clearInterval(alertPowerInterval);
       awakeTime = 0;
       client.publish(`cmnd/${device}/Power`, req.body.status);

       res.send(JSON.stringify({status: req.body.status}));
   }
});

app.post('/getTotalPower', async(req,res) => {
    // console.log("getCalcWattByDays");
    let result = await mongoService.getTotalPower(device, req.body.days);
    res.json(result);
});

app.get('/getAvgPowerPerAct',async(req, res) => {
    // console.log('getAvgPowerPerAct');
    try {
        let ans = await mongoService.getAvgPowerPerAct();
        res.json(ans);
    }catch(err){
        console.log(err);
        res.sendStatus(err)
    }
});

app.post('/getAvgDayAct',async(req,res) => {
    // console.log("getAvgDayAct", req.body.days);
    try {
        let result = await mongoService.getAvgDayAct(device, req.body.days);
        res.json(result);
    }catch(err){
        console.log(err);
        res.sendStatus(err)
    }
});

app.get('/awake', async(req, res)=>{
    // console.log('awake', awakeTime);
    if (awakeTime) res.json(awakeTime);
    else res.json(0);
})

app.post('/powerDelay',async(req,res) => {
    console.log("powerDelay", req.body.time);
    
    setTimeout(function(){
        if (req.body.status === 'ON') {
            client.publish(`cmnd/${device}/Power`, req.body.status);
            _startTimer();
            _alert();
            _sendDataToDb(Date.now());
        }else {
            clearInterval(awakeInterval);
            clearInterval(dataInterval);
            clearInterval(alertTimeInterval);
            clearInterval(alertPowerInterval);
            awakeTime = 0;
            client.publish(`cmnd/${device}/Power`, req.body.status);
        }

    }, req.body.time * 1000);

    res.json('ok');
});

app.get('/getDevicesList', async(req, res)=>{
    console.log("getDevicesList")
    
    try {
        let ans = await mongoService.getDevicesList();
        res.json(ans);
    }catch(err){
        console.log(err);
        res.sendStatus(err)
    }
})


app.post('/notify',async(req,res) => {
    // console.log("notify",req.body.msg);
    
    var body = JSON.stringify({
        "notification": `This is a notification from website. ${req.body.msg}`,
        "accessCode": "amzn1.ask.account.AEVABZOFKVNAWNEHUBFRVS2BGZ5D4AZA3LK76MMSOU3L62KFEE3SK4OQQZZGSAYGRI3XPBPXQBJMUQAFSUY5QHW47JM53XNERBCDB44Q7KTVQ35P4LL55VVBOZVSIYTV4LMSFSLEG76KET5C2ZJ3WYRK7RT3EZG2VCY6Z6FVHUGAQ5KAJIQAAWIXJW7SU3HDB3Y3RRF4X65UEJA"
    });

    https.request({
        hostname: "api.notifymyecho.com",
        path: "/v1/NotifyMe",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body)
        }
    }).end(body);
    
    res.json('ok');
});

//subscriber for sonoff
client.on('connect', async function (ev) {
    // console.log('connect', ev);
    //add device to the DB
    await mongoService.addDevice(device);

    client.subscribe('stat/sonoff/#');

    //Example function for real data from smart device
    // client.subscribe(`stat/${device}/#`, function (err) {
    //     console.log('client has subscribed successfully to topic => sonoff', settings);
    //     if (!err) {
    //         console.log(`client subscribed to device : ${device}`);
    //            setTimeout(() => {
    //                 connectionStatus = client.publish('stat/sonoff/STATUS10', 0);
    //                 // console.log(connectionStatus);
    //             }, 3000)
    //     }
    // });
})
// 'message' its a built in function
client.on('message', function (topic, message) {
    
    let context = message.toString();
    console.log('msg from sonoff=>',context)
})
//--end subscriber for sonoff--//




//--server functions

async function _sendDataToDb(startTime) {
    dataInterval = setInterval(()=>{ 
        let entity = {
            startTime : startTime,
            voltage: Math.random() * 220
        }
        console.log("dataInterval -> entity", entity)
        mongoService.addEntity(device, entity);
        
    }, 1000);
}

function _startTimer(){
    awakeInterval = setInterval(()=>{ 
        awakeTime++;
    }, 1000);
}

async function _alert(){
    const avgTime = await mongoService.avgTimePerAct(device);
    const avgPower = await mongoService.avgPowerPerSec(device);
    console.log("alert -> avgTime", avgTime)

    //How often to run a check on the DB
    alertTimeInterval = setInterval(()=>{
        //how longer from the average to notify, PA: it will be a bit longer cause of the 3 sec interval.

        if (awakeTime > avgTime*1.2){
            console.log('time exception');
            
            var body = JSON.stringify({
                "notification": `Attention! ${device} is up for too long!`,
                "accessCode": "amzn1.ask.account.AEVABZOFKVNAWNEHUBFRVS2BGZ5D4AZA3LK76MMSOU3L62KFEE3SK4OQQZZGSAYGRI3XPBPXQBJMUQAFSUY5QHW47JM53XNERBCDB44Q7KTVQ35P4LL55VVBOZVSIYTV4LMSFSLEG76KET5C2ZJ3WYRK7RT3EZG2VCY6Z6FVHUGAQ5KAJIQAAWIXJW7SU3HDB3Y3RRF4X65UEJA"
            });

            https.request({
                hostname: "api.notifymyecho.com",
                path: "/v1/NotifyMe",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(body)
                }
            }).end(body);

            //so it willl notify once
            clearInterval(alertTimeInterval);
        }
    }, 3000)

    alertPowerInterval = setInterval(()=>{
        //how longer from the average to notify, PA: it will be a bit longer cause of the 5 sec interval.
        //Fake data.
        //For testing:
        // if (avgTime*2 > avgTime*1.2){
        if (Math.random() * 220 > avgPower*1.2){
            console.log('power exception');
            
            var body = JSON.stringify({
                "notification": `Attention! ${device} is consuming more power than usual!`,
                "accessCode": "amzn1.ask.account.AEVABZOFKVNAWNEHUBFRVS2BGZ5D4AZA3LK76MMSOU3L62KFEE3SK4OQQZZGSAYGRI3XPBPXQBJMUQAFSUY5QHW47JM53XNERBCDB44Q7KTVQ35P4LL55VVBOZVSIYTV4LMSFSLEG76KET5C2ZJ3WYRK7RT3EZG2VCY6Z6FVHUGAQ5KAJIQAAWIXJW7SU3HDB3Y3RRF4X65UEJA"
            });

            https.request({
                hostname: "api.notifymyecho.com",
                path: "/v1/NotifyMe",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(body)
                }
            }).end(body);

            //so it willl notify once
            clearInterval(alertPowerInterval);
        }
    }, 5000)
}


const port = process.env.PORT || 3003 ;
http.listen(port, () => {
    console.log (`App listening on port ${port} !`)
});