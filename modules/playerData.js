const sequelize = require("sequelize");
const propertyCards = require("../persistant_data/MonopolyCards.json");
const db = new sequelize("database", "NothingLikeAGood", "AleAmIRight", {
    host: "localhost",
    dialect: "sqlite",
    logging: true,
    operatorsAliases: false,
    storage: "database.sqlite"
});

const tag = db.define('Data', {
    user: {
        type: sequelize.STRING,
        allowNull: false
    },
    role: {
        type: sequelize.STRING,
        allowNull: false
    },
    PlayerData: {
        type: sequelize.JSON,
        defaultValue: {}
    }
});
tag.sync();

// may or may not be needed will stay just in case.
exports.getTag = function(){
    return tag;
};
// for new players
exports.setPlayerData = function (message, role){
    tag.create({
      user: message.author.id,
      role: role,
      PlayerData: {
        ownProperties: [],
        ownBuildings: [],
        ifMortgaged: [],
        balance: 1500,
        chanceCard: [],
        communityChest: [],
        inJail: false,
        turnsInJail: 0,
        snakeEyeCount: 0,
        currentPos: 0
      }
    });
};

exports.setPlayerInJail = async function (message, role) {
    const  PlayerData  = await module.exports.findPlayer(message,role);
    if (PlayerData.inJail)
        return console.log("The player is already in jail, there in issue somewhere.")
    else{
        PlayerData.inJail = true;
    }
    module.exports.updatePlayer(message, role, PlayerData);
};

exports.removePlayerInJail = async function (message, role) {
    const PlayerData = await module.exports.findPlayer(message, role);
    if (!PlayerData.inJail)
        return console.log("The player is already out of jail, there is an issue somewhere.")
    else
        PlayerData.inJail = false;
    module.exports.updatePlayer(message, role, PlayerData);
};

exports.setPlayerProperties = async function (message, role, propertyName){
    const PlayerData = await module.exports.findPlayer(message, role);
    let playerProperites = PlayerData.ownProperties;
    if(playerProperites.indexOf(propertyName) === -1)
        return console.log(" Someone already owns this property. ");
    else{
        PlayerData.ownProperties.push(propertyName)
        PlayerData.ownBuildings.push(0);
        PlayerData.ifMortgaged.push(false);
    }
    await module.exports.sortPlayerDataPropertiesArray(PlayerData);
    module.exports.updatePlayer(message, role, PlayerData);
};

exports.removePlayerProperties = async function (message, role, propertyName){
    const playerData = await module.exports.findPlayer(message, role);
    let playerProperites = playerData.ownProperties;
    if (playerProperites.indexOf(propertyName) === -1)
        return console.log (`${message.author} does not have ${propertyName} to begin with in game ${role}`);
    else{
        playerData.ownProperties.splice(playerData.ownProperties.indexOf(propertyName));
    }
}

exports.findPlayer = async function (message, role) {
    const { PlayerData } = await tag.findOne({
        where: {
            user: message.author.id,
            role: role
        }
    });
    return PlayerData;
};

exports.updatePlayer = async function (message, role, newPlayerData){
    await tag.update({
         PlayerData: newPlayerData
        }, 
        {
            where: 
            {
                user: message.author.id,
                role: role
            }
        });
    console.log ("Player data has been udpated");
};
// goal to sort the ownPropties array to be the same as how they are mapped on the board
exports.sortPlayerDataPropertiesArray = async function (playerData){
    let swapped;
    let ownArray = playerData.ownProperties;
    do{
        swapped = false;
        for (let i = 0; i < ownArray.length-1; i ++){
            if (ownArray[i].pos > ownArray[i+1].pos){
                await module.export.swapArrayPosition(playerData, i , i +1);
                swapped = true;
            }
        }
    }while(swapped)
    console.log("Players property data has been sorted.")
};

exports.swapArrayPosition = async function (playerData, i, indexB){
    let temp = [playerData.ownProperties[i], playerData.ownBuildings[i], playerData.ifMortgaged[i]];
    //init swap
    playerData.ownProperties[i] = playerData.ownProperties[indexB];
    playerData.ownBuildings[i] = playerData.ownBuildings[indexB];
    playerData.ifMortgaged[i] = playerData.ifMortgaged[indexB];

    //final swap
    playerData.ownProperties[indexB] = temp[0];
    playerData.ownBuildings[indexB] = temp[1];
    playerData.ifMortgaged[indexB] = temp[2];
};