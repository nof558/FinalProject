'use strict';
const Alexa = require('ask-sdk-core');
const axios = require('axios');
const url = "http://localhost:3003" ;

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechText = 'Welcome to the Alexa Skills Kit, you can say hello!';
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard('Hello World', speechText)
            .getResponse();
    }
};
//--custom Intents
const awakeIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'awakeIntent';
    },
    async handle(handlerInput) {
        // const action = handlerInput.requestEnvelope.request.intent.slots.action.value;
        // console.log("handle -> action", action)
        
        const res = await axios.get(`${url}/awake`);
        // console.log(res.data);
        const speechText= res.data? `awake for ${res.data} seconds` : 'boiler is off';
        
        return handlerInput.responseBuilder
            .speak(speechText)
            .withSimpleCard('smart boiler', speechText)
            .getResponse();
    }
};

const powerIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'powerIntent';
    },
    async handle(handlerInput) {
        const action = handlerInput.requestEnvelope.request.intent.slots.action.value;
        const time = handlerInput.requestEnvelope.request.intent.slots.time.value;
        // console.log("handle -> action", action)
        // console.log("handle -> time", time)
        let speechText ='';

        if (time){
            const res = await axios.post(`${url}/powerDelay`,{status: action.toUpperCase(), time: time});
            // console.log(res.data);
            speechText =`boiler will turn ${action} in ${time} seconds`;

        }else {
            const res = await axios.post(`${url}/power`,{status: action.toUpperCase()});
            // console.log(res.data);
            speechText =`boiler is ${res.data.status}`;
        }
        
        
        return handlerInput.responseBuilder
            .speak(speechText)
            .withSimpleCard('smart boiler', speechText)
            .getResponse();
    }
};

const powerConsIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'powerConsIntent';
    },
    async handle(handlerInput) {
        let time = handlerInput.requestEnvelope.request.intent.slots.time.value;
        // console.log("handle -> time", time)

        //default is 1 day
        if (time == "?" || time == undefined ) time = 1;
        
        const res = await axios.post(`${url}/getTotalPower`,{days: time});
        console.log(res.data);

        const speechText =`power consumption for the last ${time} days is ${res.data.toString().substr(0,6)}`;
        
        return handlerInput.responseBuilder
            .speak(speechText)
            .withSimpleCard('smart boiler', speechText)
            .getResponse();
    }
};

const avgPowerPerActIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'avgPowerPerActIntent';
    },
    async handle(handlerInput) {

        const res = await axios.get(`${url}/getAvgPowerPerAct`);
        // console.log(res.data);

        const speechText =`average power consumption per activation is ${res.data.toString().substr(0,6)}`;
        
        return handlerInput.responseBuilder
            .speak(speechText)
            .withSimpleCard('smart boiler', speechText)
            .getResponse();
    }
};

const avgDayActIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'avgDayActIntent';
    },
    async handle(handlerInput) {
        let days = handlerInput.requestEnvelope.request.intent.slots.days.value;
        // console.log("handle -> days", days)
        if (days === "?") days = 1;

        const res = await axios.post(`${url}/getAvgDayAct`,{days: days});
        // console.log(res.data);

        const speechText =`average day activations is ${res.data.toString().substr(0,6)} in the last ${days} days`;
        
        return handlerInput.responseBuilder
            .speak(speechText)
            .withSimpleCard('smart boiler', speechText)
            .getResponse();
    }
};

const commandsIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'commandsIntent';
    },
    async handle(handlerInput) {

        const speechText =`the commands that available are:
                            1 you can ask How long are you awake.
                            2 you can ask What is the average power consumption per activation.
                            3 you can ask How much power you consume, and than say number of days you wants.
                            4 you can ask What is the average day activations, and than say number of days you wants.
                            5 you can set a timer to turn on or off, by saying turn on or off, and than say in, and the number of seconds you want.
                            6 you can ask to hear the command list by asking the command list
                            `;
        
        return handlerInput.responseBuilder
            .speak(speechText)
            .withSimpleCard('smart boiler', speechText)
            .getResponse();
    }
};
//end of custom intents

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechText = 'You can say hello to me!';
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard('Hello World', speechText)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speechText = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speechText)
            .withSimpleCard('Hello World', speechText)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder.getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
      return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);
        return handlerInput.responseBuilder
        .speak('Sorry, I can\'t understand the command. Please say again.')
        .reprompt('Sorry, I can\'t understand the command. Please say again.')
        .getResponse();
    },
};

exports.handler = Alexa.SkillBuilders.custom()
     .addRequestHandlers(LaunchRequestHandler,
                         awakeIntentHandler,
                         powerIntentHandler,
                         powerConsIntentHandler,
                         HelpIntentHandler,
                         avgDayActIntentHandler,
                         avgPowerPerActIntentHandler,
                         commandsIntentHandler,
                         CancelAndStopIntentHandler,
                         SessionEndedRequestHandler)
     .lambda();
