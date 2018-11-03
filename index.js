const Alexa = require('ask-sdk');
const MTGWrapper = require('./MTGWrapper');

const DEBUG = false;
const SKILL_NAME = 'Carte Magic';
const HELP_MESSAGE = 'Posso cercare carte di Magic: The Gathering per te. Prova a chiedere "Alexa, chiedi a carte magic di cercare Gatto Nero!"';
const HELP_REPROMPT = 'Posso aiutarti? È sempre un paicere cercare Ornitotteri!';
const STOP_MESSAGE = 'Ci si vede!';
const ERROR_MESSAGE = 'Ops, c\'è stato un piccolo errore...';

const skillBuilder = Alexa.SkillBuilders.standard();

function debug(msg) {
  if (DEBUG) console.log(msg);
}

// returns true if the skill is running on a device with a display (show|spot)
function supportsDisplay(handlerInput) {
  var hasDisplay =
    handlerInput.requestEnvelope.context &&
    handlerInput.requestEnvelope.context.System &&
    handlerInput.requestEnvelope.context.System.device &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display
  return hasDisplay;
}

const GetCardIntentHandaler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest' ||
      (request.type === 'IntentRequest' && request.intent.name === 'GetCardIntent');
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const response = handlerInput.responseBuilder;
    debug(`[ - ] Ricevuta richiesta ${request.intent  && request.intent.name ? request.intent.name : request.type}`);

    const card = request.intent && request.intent.slots && request.intent.slots["carta"] ? request.intent.slots["carta"].value : null;
    debug(`[ - ] Ricevuta richiesta ${request.intent  && request.intent.name ? request.intent.name : request.type} per la carta ${card}`);
    if (!card) {
      return handlerInput.responseBuilder
        .speak(HELP_MESSAGE)
        .withSimpleCard(SKILL_NAME, HELP_MESSAGE)
        .reprompt(HELP_REPROMPT)
        .getResponse();
    } else {
      return new Promise(resolve => {
        debug("[ - ] Invio richeista alle API...");
        let mtg = null;
        if (request.locale == "it-IT") {
          mtg = new MTGWrapper('Italian');
        } else {
          mtg = new MTGWrapper();
        }
        mtg.getCardByName(card)
          .then(res => {
            debug("[ - ] Risposta dalle API ricevuta!");
            if (supportsDisplay(handlerInput) && res.imageUrl) {
              debug("[ - ] Il dispositivo supporta un display!");
              const title = res.title;
              const primaryText = new Alexa.RichTextContentHelper().withPrimaryText(res.text).getTextContent();
              const image = new Alexa.ImageHelper().addImageInstance(res.imageUrl).getImage();

              response.addRenderTemplateDirective({
                type: 'BodyTemplate2',
                backButton: 'visible',
                image,
                title,
                textContent: primaryText,
              });
            }
            debug(`[ - ] Preparo la risposta con testo \n${res.text}`);
            resolve(response
              .speak(res.text)
              .withShouldEndSession(true)
              .getResponse());


          })
          .catch(err => {
            debug(`[ - ] Errore nel dialogare con le API! \n${err}`);
            resolve(handlerInput.responseBuilder
              .speak(ERROR_MESSAGE)
              .reprompt(ERROR_MESSAGE)
              .getResponse());
          });
      });
    }
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(HELP_MESSAGE)
      .reprompt(HELP_REPROMPT)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      (request.intent.name === 'AMAZON.CancelIntent' ||
        request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(STOP_MESSAGE)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    debug(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    debug(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak(ERROR_MESSAGE)
      .reprompt(ERROR_MESSAGE)
      .getResponse();
  },
};

exports.handler = skillBuilder
  .addRequestHandlers(
    GetCardIntentHandaler,
    HelpHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();