const Parse = require('parse/node');
const Discord = require('discord.js');

let discordClient = null;
let pieDiscord = null;

const DEPARTURE_URL = "https://cdn.discordapp.com/emojis/461733071218278410.png?v=1%22"
const ARRIVAL_URL = "https://cdn.discordapp.com/emojis/461733151996117012.png?v=1"
const DIVERT_URL = "https://cdn.discordapp.com/emojis/461738339222159370.png?v=1"
const CANCEL_URL = "https://canary.discordapp.com/assets/b1868d829b37f0a81533ededb9ffe5f4.svg"

module.exports.init = async function(client) {
    console.log("Logging in to Parse");
    
    discordClient = client;
    pieDiscord = discordClient.guilds.get('417715719388790794');
    
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
    sub.on("create", onCreate);
    sub.on('open', onOpen);
}

function onOpen() {
    console.log("Parse DB EventLog Opened");
    onCreate({
        get: (string) => {
            switch (string) {
                case "createdAt": return new Date();
                case "detail": return {
                    identity: {
                        discord: {
                            id: "139548522377641984"
                        }
                    },
                    planned: {
                        departure: "KSEA",
                        arrival: "KSFO",
                    },
                    callsign: "IHS1503",
                    plane: "CONC",
                    distance: "N/A"
                }
            }
        },    
    });
}

function onCreate(event) {
    //console.log(event.get("category"));
    if(discordClient == null) return new Error("Discord Client Null");

    let message = new Discord.MessageEmbed();
    let details = event.get("detail");

    let user = pieDiscord.members.get(details.identity.discord.id);

    switch("departure") {
        case "departure":
            message.setTitle(`${details.callsign} has departed from ${details.planned.departure}`)
                .setDescription(`${user.displayName} is enroute ${details.planned.departure} - ${details.planned.arrival}\nPlane: ${details.plane}\nDistance: ${details.distance}`)
                .setFooter(`Departed at ${event.get("createdAt").toUTCString()} | User ID: ${user.id}`)
                .setColor("GREEN")
                .setThumbnail(DEPARTURE_URL);
            
            pieDiscord.channels.get(process.env.DEPARTURE_CHANNEL).send({embed : message});
            break;
        case "arrival":
            message.setTitle(`${event.get("callsign")} has arrived at ${event.get("arrAirport")}`)
                .setDescription(`Result: ${1}\n`)
                .setFooter(`Arrived at ${1} | User ID: ${user.id}`)
                .setColor("RED")
                .setThumbnail(ARRIVAL_URL);
            
            pieDiscord.channels.get("dep channel").send({embed : message});
        case "divert":
            message.setTitle(`${event.get("callsign")} has diverted to ${event.get("arrAirport")}`)
                .setDescription(`Original Plan: ${1} - ${1}\nNew Plan: ${1} - ${1}`)
                .setFooter(`Diverted at ${1} | User ID: ${user.id}`)
                .setColor("YELLOW")
                .setThumbnail(DIVERT_URL);
            
            pieDiscord.channels.get("dep channel").send({embed : message});
    }
}