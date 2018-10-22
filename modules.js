`use strict`;
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