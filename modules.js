`use strict`;
let fs = require ('fs');
const updateJsonFile = require('update-json-file');

// will only pull out the LobbyRoles on the server and skip all of the other roles.
exports.getLobbyRole = function (message){
    let allRoles = message.guild.roles.map(r => r.name); // Stores all of the roles on the server
    let LobbyRole = [];

    for (let i = 0 ; i < allRoles.length; i ++){
        if (allRoles[i].includes('lobby'))
            LobbyRole[LobbyRole.length] = allRoles[i];
    }
    console.log(LobbyRole);
    return LobbyRole;
};
// generate the new CGID for the lobby
exports.getNewCGID = function (CGID){
    let inRay = false;
    let testGameId = 0;
    do {
        inRay = false;
        testGameId = Math.floor(Math.random() * 10000);

        for (let i = 0; i < CGID.length; i++)
            if (CGID[i] === testGameId)
                inRay = true;
        if (!inRay)
            CGID[CGID.length] = testGameId;

    } while (inRay);
    return testGameId;
}

exports.createChannel = function (message, lobbyName){
    // Searches for the role needed for the permission for the channels
    let currentRole = message.guild.roles.find(r => r.name === lobbyName);
    // message.guild.id is @everyone
    message.guild.createChannel(`${lobbyName}`, "text", [{
        id: message.guild.id,
        denied: 'VIEW_CHANNEL'
    },
    {
        id: currentRole.id,
        allowed: 'VIEW_CHANNEL'
    }])
        .then(channel => channel.setParent('504069030727122973')) // Sets it to the category under "Lobbys"
        .catch(console.error)
}

exports.deleteChannel = function (message, lobbyNumber, all){
    let roles = module.exports.getLobbyRole(message);
    if (all)
    {
        let channel,
            f; // Stores the channel name that needs to be deleted.
        for (let i = 0; i < roles.length ; i ++){
            // Removes the hashtag from the lobbyName which is needed to find the channel to delete, # is an illegal character in channel generation
            f = lobbyName[i].substring(0, lobbyName[i].indexOf("#")) + lobbyName[i].substring(lobbyName[i].indexOf("#") + 1);
            channel = message.guild.channels.find(r => r.name === f);
            channel.delete("All Games Ended")
            .then(deleted => console.log(`Deleted ${deleted.name} because all games have ended.`))
            .catch(console.error);
        }
    } else {
        let roleNum = [];
        for (let i = 0; i < roles.length; i ++){
            roleNum[i] = roles[i].substring(roles[i].indexOf('#')+1);
        }
        parseInt(roleNum);

        for( let i = 0 ; i < roleNum.length; i ++){
            if (roleNum[i] === lobbyNumber){
                channel = message.guild.channels.find(r => r.name === `lobby${lobbyNumber}`);
                channel.delete(`Game # ${lobbyNumber} has ended.`)
                .then(deleted => console.log(`Deleted ${deleted.name} because this game has ended.`))
                .catch(console.error);
            }
        }
    }

}

exports.getLobbyNumber = function (message){
    let lobbyName = module.exports.getLobbyRole(message);
    let lobbyNumber = [];
    for(let i = 0 ; i < lobbyName.length; i ++){
        lobbyNumber[i] = lobbyName[i].substring(lobbyName[i].indexOf("#") + 1);
        lobbyNumber[i] = parseInt(lobbyNumber[i]);
    }
    return lobbyNumber;

}