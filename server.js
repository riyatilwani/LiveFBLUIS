
var restify = require('restify');
var builder = require('botbuilder');

// Get secrets from server environment
var botConnectorOptions = { 
    appId: process.env.BOTFRAMEWORK_APPID, 
    appPassword: process.env.BOTFRAMEWORK_APPSECRET
};

// Create bot
var connector = new builder.ChatConnector(botConnectorOptions);
var bot = new builder.UniversalBot(connector);

/*bot.dialog('/', function (session) {
    
    //respond with user's message
    session.send("You said " + session.message.text);
});*/

// Setup Restify Server
var server = restify.createServer();

// Handle Bot Framework messages
server.post('/api/messages', connector.listen());

// Serve a static web page
server.get(/.*/, restify.serveStatic({
    'directory': '.',
    'default': 'index.html'
}));

server.listen(process.env.port || 3978, function () {
    console.log('%s listening to %s', server.name, server.url); 
});


// Create LUIS recognizer that points at our model and add it as the root '/' dialog for our BOT
var model = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/3fa40492-01dd-47a1-996d-21ed834cd93e?subscription-key=bd4510d7612e4756a15a7808df780482&staging=true&verbose=true&q=';
var recognizer = new builder.LuisRecognizer(model);
var intent = new builder.IntentDialog({ recognizers: [recognizer] });
bot.dialog('/', intent);

// Add intent handlers
intent.matches('search flight', [


function (session, results, next) {
        var origin = builder.EntityRecognizer.findEntity(results.entities, 'origin');
        if(!origin){
            builder.Prompts.text(session, "Where would you like to fly from?"); 
        } else {
            next({ response: {
                    origin: origin.entity
                }
            });
        }
    },


function (session, results, next) {
        var destination = builder.EntityRecognizer.findEntity(results.entities, 'destination');
        if(!destination){
            builder.Prompts.text(session, "Where do you want to go?"); 
        } else {
            // Pass title to next step.
            next({ response: {
                    origin: results.origin,
                    destination: destination.entity
                }
            });
        }
    },


function (session, results, next) {
        var date = builder.EntityRecognizer.findEntity(results.entities, 'builtin.datetime.date');
        if(!date){
            builder.Prompts.text(session, "When do you want to go?"); 
        } else {
            next({ response: {
                    origin: results.origin,
                    destination: results.destination,
                    date: date.entity
                }
            });
        }
    },
    function (session, results) {
        if (results.response) {
           session.send("Fetching results. Please wait.");
        } else {
            session.send("Incomplete information");
        }
    }
]);


   
intent.matches('boarding pass',[
    function (session, results, next) {
        var pnr = builder.EntityRecognizer.findEntity(results.entities, 'pnr');
        if (!pnr) {
            builder.Prompts.text(session, "What is your PNR number?");
        } else {
            next({ response: pnr.entity });
        }
    },
    function (session, results) {
        if (results.response) {
            // ... save task
            session.send("Okay, give me a few minutes.");
        } else {
            session.send("Sorry");
        }
    }
        ]);
intent.onDefault(builder.DialogAction.send("I'm sorry I didn't understand. How may I help you?"));
