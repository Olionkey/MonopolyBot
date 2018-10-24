const propertyCards = require(`../persistant_data/MonopolyCards.json`);
//const lobbyData     = require('../lobbys');
const updateJsonFile = require(`update-json-file`);
const Enmap = require("enmap");

let lobbies = [];

exports.createPlayer = function ( message, role, client ){
    let index = module.exports.findLobbyIdInArray(role);
    lobbies[index].ensure(`${message.author.id}`, {
        user: message.author.id,
        ownProperties: [
            {
                buildings: 0
            }
        ],
        balance: 1500,
        chanceCard: [],
        communityChest: [],
        inJail: false,
        turnsInJail: 0,
        snakeEyeCount: 0,
        currentPos: 0,
        lastRoll: 0
    });
}

exports.testDb = function(){
    console.log(lobbies[lobbies.length]);
}

exports.createRoleDB = function (role) {
    //Enmap names are stored by the id not the full name!
    lobbies[lobbies.length] = new Enmap({name: role});
}

exports.findLobbyIdInArray = function (role) {
    for( let i = 0 ; i < lobbies.length; i ++)
        if (lobbies[i].name === role)
            return i;
        
    return -1;
}