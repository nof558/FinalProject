
const dbService = require('./db.service')
const ObjectId = require('mongodb').ObjectId

module.exports = {
    addDevice, 
    addEntity,
    getTotalPower,
    getAvgPowerPerAct,
    getAvgDayAct,
    getDevicesList,
    avgTimePerAct,
    avgPowerPerSec
}

async function addDevice(device) {
    // console.log("addDevice -> device", device)
    
    const collection = await dbService.getCollection('smartDevices');
    const d = await collection.findOne({device});
    if (d) {
        return d;
    }
    // if no such device in the db, create new device:
    try {
        await collection.insertOne({
            device: device,
            data : []
        });
        return device;
    } catch (err) {
        console.log(`ERROR: cannot insert device`)
        throw err;
    }
}

async function addEntity(device, entity) {

    const collection = await dbService.getCollection('smartDevices')
    try {
        await collection.updateOne(
            {
                "device":device
            },
            { $push : { data : entity } } 
            
        );
        return 'entity added';
    } catch (err) {
        console.log(`ERROR: cannot insert entity`)
        throw err;
    }
}


async function getTotalPower(device, days) {
    let today = new Date();
    let start = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));
    let end = today.getTime();

    let data = await _findEntityByTime(device, start.getTime(), end);

    let totalPower = data.reduce((acc, obj)=>{
        return acc + obj.voltage
    },0)
    // console.log("getTotalPower -> totalPower", totalPower/1000)

    return totalPower/1000;
}


async function getAvgPowerPerAct() {
    let allSamples = await _getAllEntities();
    let totalWatt = allSamples.data.map(item => item.voltage).reduce((acc, curVal) => (acc + curVal), 0);
    // console.log("avgPowerPerAct -> totalWatt", totalWatt)
    // console.log("avgPowerPerAct -> avgPower", typeof(avgPower))
    let temp = 0;
    let count = 0;
    allSamples.data.forEach((obj)=>{
        if (obj.startTime !== temp){
            count++;
        }
        temp = obj.startTime;
    });
    let avgPower = (totalWatt / count)/1000;
    
    return avgPower;
}

async function getAvgDayAct(device, days){

    let today = new Date();
    let start = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));
    let end = today.getTime();
    // console.log("calcAvgDailyActivations -> end", end)
    
    let data = await _findEntityByTime(device, start.getTime(),end);
    let temp = 0;
    let count = 0;
    data.forEach((obj)=>{
        if (obj.startTime !== temp){
            count++;
        }
        temp = obj.startTime;
    });
    return count/days;
}




async function getDevicesList(){
    const collection = await dbService.getCollection('smartDevices');
    try {
        const data = await collection.aggregate([ { $project : { device : 1} } ]).toArray();
        let list = data.map((obj)=>obj.device)
        // console.log("getDevicesList -> list", list)
        return list;
    } catch (err) {
        console.log(`ERROR: cannot query list`)
        throw err;
    }
}




async function avgTimePerAct(device){
    //Number of days back, to calculate average from.
    const days = 10;
    let today = new Date();
    let start = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));

    let data = await _findEntityByTime(device, start, today.getTime());
    // console.log(data);

    let seconds = data.length;
    // console.log("ai -> seconds", seconds)
    let temp = 0;
    let count = 0;
    data.forEach((obj)=>{
        if (obj.startTime !== temp){
            count++;
        }
        temp = obj.startTime;
    });
    
    // console.log("ai -> count", count)
    // console.log("avg=>", seconds/count);
    return seconds/count;
}

async function avgPowerPerSec(device){
    //Number of days back, to calculate average from.
    const days = 10;
    let today = new Date();
    let start = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));

    let data = await _findEntityByTime(device, start, today.getTime());
    // console.log(data);

    let seconds = data.length;
    // console.log("ai -> seconds", seconds)

    let totalWatt = data.map(obj => obj.voltage).reduce((acc, curVal) => (acc + curVal), 0);
    // console.log("avgPowerPerAct -> totalWatt", totalWatt)
    let avgPower = totalWatt / seconds;
    // console.log("avgPowerPerAct -> avgPower", typeof(avgPower))
    return avgPower;
}


async function _findEntityByTime(device, start, end) {
    // console.log("function_findEntityByTime -> device", device)
    // console.log("function_findEntityByTime -> start", start)
    // console.log("function_findEntityByTime -> end", end)
    try {
        const collection = await dbService.getCollection('smartDevices');

        let deviceCol = await collection.find({"device": device}).toArray();
        let data = deviceCol[0].data;
        let filtered = data.filter((entity)=>{
            return (entity.startTime >= start && entity.startTime <= end)
        })
        // console.log("filtered", filtered.length);
        // console.log('_findEntityByTime', data);
        
        return filtered;
    }catch (e) {
        return Promise.reject(e);
    }
}

async function _getAllEntities() {
    try {
        const collection = await dbService.getCollection('smartDevices');
        let ret = await collection.find({}).toArray();
        return ret[0];
    }catch (e) {
        return e;
    }
}
