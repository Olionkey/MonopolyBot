let fs = require ('fs');
const updateJsonFile = require('update-json-file');

// will only pull out the lobbyRoles on the server and skip all of the other roles.
exports.getLobbyRole = function (message){
    let allRoles = message.guild.roles.map(r => r.name); // Stores all of the roles on the server
    let lobbyRole = [];

    for (let i = 0 ; i < allRoles.length; i ++){
        if (allRoles[i].includes('lobby'))
            lobbyRole[lobbyRole.length] = allRoles[i];
    }
    return lobbyRole;
};