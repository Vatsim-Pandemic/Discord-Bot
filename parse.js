const Parse = require('parse/node');

(async () => {
    console.log("Logging in");
    // Log into Parse
    Parse.initialize(process.env.PARSE_APP_ID, process.env.PARSE_JAVA_KEY);
    Parse.serverURL = process.env.PARSE_URL;

    var client = new Parse.LiveQueryClient({
        applicationId: process.env.PARSE_APP_ID,
        serverURL: process.env.PARSE_LIVE_QUERY_URL,
        javascriptKey: process.env.PARSE_JAVA_KEY
    }).on('error', (error) => console.error(error));
    client.open();

    // Subscribe to the EventLog
    const query = new Parse.Query("EventLog");
    const sub = client.subscribe(query);
    sub.on("update", onCreate);
    sub.on('open', onOpen);
})();

function onOpen() {
    console.log("PARSE: EventLog Opened");
}

function onCreate(event) {
    console.log(event.get("category"));
}