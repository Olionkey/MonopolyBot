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
    if(playerProperites.indexOf( propertyName ) === -1)
        return console.log(" Someone already owns this property. ");
    else{
        PlayerData.ownProperties.push( propertyName )
        PlayerData.ownBuildings.push(0);
        PlayerData.ifMortgaged.push(false);
    }
    await module.exports.sortPlayerDataPropertiesArray( PlayerData );
    module.exports.updatePlayer(message, role, PlayerData);
};

exports.removePlayerProperties = async function (message, role, propertyName){
    const playerData = await module.exports.findPlayer(message, role);
    let playerProperites = playerData.ownProperties;
    if (playerProperites.indexOf(propertyName) === -1)
        return console.log (`${message.author} does not have ${propertyName} to begin with in game ${role}`);
    else{
        playerData.ownProperties.splice( playerData.ownProperties.indexOf( propertyName ), 1 );
        playerData.ownBuildings.splice( playerData.ownProperties.indexOf( propertyName ), 1 );
        playerData.ifMortgaged.splice( playerData.ownProperties.indexOf( propertyName ), 1 );
    }
    module.exports.updatePlayer(message, role, PlayerData);
};

// Returns the index, if the player owns it if not it will return -1.
exports.checkPlayerProperties = async function (...args){
    if(args.length === 3)
        const playerData = await module.exports.findPlayer(args[0], args[1]);
    
    let playerProperites = playerData.ownProperties;
    if (playerProperites.indexOf( args[2] ) === -1)
        return -1;
    else
        return playerProperites.indexOf( args[2] );
};
//Rewrite addMoney, removeMoney to use rest ...foo Check if the first index is a json property before procedding, 
//If it is not then find the player;
exports.addMoney = async function (message, role, amount){
    const playerData = await module.exports.findPlayer(message, role);
    playerData.balance += amount;
    module.exports.updatePlayer(message, role, playerData);
};

exports.removeMoney = async function (message, role, amount){
    if (await module.exports.getMoney(message, role) - amount < 0)
        return console.log(" the player is in debt, still unsure how to handle this. We need to figure it out though");
    else{
        const playerData = await module.exports.findPlayer(message, role);
        playerData.balance -= amount;
        module.exports.updatePlayer(message, role);
    }
};

exports.getMoney = async function (message, role){
    const playerData = await module.exports.findPlayer(message, role);
    return playerData.balance;
};
//Method is broken needs to be rethonk. Delete all code and rewrite
// Current issue is People[0,2,4,6...] only stores message.author.id, Need a way to check which players need to be payed
// Could be done later. But trying to get through all of the methods first. -Olionkey
exports.payPlayers = async function (amount, ...People){
    const payerData = await module.exports.findPlayer(People[0], People[1]);
    let playerData = [];
    for (let i = 2 ; i < People.length-1; i +=2 ){
        let foo = await module.exports.findPlayer(People[i], People[i+1]);
        await module.exports.addMoney(People[i], People [i+1], amount);
        playerData.push(foo);
    }
    await module.exports.removeMoney(People[0], People[1], ( ( playerData.length - 2 ) / 2 * amount ) );
    console.log("Players have been payed.");
};

exports.addJailTurns = async function (message, role){
    const playerData = await module.exports.findPlayer(message, role);
    if(playerData.inJail){
        if (await module.exports.getJailTurns(playerData) + 1 < 3)
            playerData.turnsInJail +=1;
        else if (await module.exports.getJailTurns( playerData ) + 1 === 3){
            playerData.turnsInJail +=1;
            message.channel.send(" This is your last turn before having to pay to get out of jail"); // Should not be in this file.
        }
        await module.exports.updatePlayer(message, role, playerData);
        return;
    } else{
        return console.log(`${message.author.id} in game ${role} is not in jail`);
    }
};
//Unsure why this is a function, but since it here is might as well keep it.
exports.getJailTruns = async function (...Args){
    if(typeof(Args[0] === 'object'))
        return Args[0].turnsInJail;
    else{
        const playerData = await module.exports.findPlayer(Args[0], Args[1]);
        return playerData.turnsInJail
    }
};

exports.resetJailTurns = async function (message, role){
    const playerData = await module.exports.findPlayer( message, role );
    playerData.turnsInJail = 0;
    await module.exports.updatePlayer(message, role, playerData);
};

exports.addSnakeEyeCount = async function (message, role) {
    const playerData = await module.exports.findPlayer(message, role);
        if (await module.exports.getSnakeEyeCount(playerData) + 1 < 3)
            playerData.snakeEyeCount += 1;
        else if (await module.exports.getSnakeEyeCount(playerData) + 1 === 3) {
            playerData.snakeEyeCount += 1;
            message.channel.send(" This is your last turn before having to pay to get out of jail"); // Should not be in this file.
        }
        await module.exports.updatePlayer(message, role, playerData);
        return;
};

//Unsure why this is a function, but since it here is might as well keep it.
exports.getSnakeEyeCount = async function (...Args) {
    if (typeof (Args[0] === 'object'))
        return Args[0].snakeEyeCount;
    else {
        const playerData = await module.exports.findPlayer(Args[0], Args[1]);
        return playerData.snakeEyeCount;
    }
};

exports.resetSnakeEyeCount = async function (message, role) {
    const playerData = await module.exports.findPlayer(message, role);
    playerData.snakeEyeCount = 0;
};

exports.updateCurrentPos = async function ( message, role, rollCount){
    const playerData = module.exports.findPlayer(message, role);
    // 39 is how may squares are on the board, with go being count 0.
    if (playerData.currentPos + rollCount > 39){
        playerData.currentPos = ((playerData.currentPos + rollCount) - 39); 
    } else {
        playerData.currentPos += rollCount;
    }
    await module.exports.updatePlayer(message, role, playerData);
};
// should have it work with X amount but have no time to implement that right now.
exports.addPlayerBuildings = async function (message, role, property) {
    const playerData = await module.exports.findPlayer(message, role);
    if (property.isArray){
        for (let i = 0 ; i < property.length; i ++)
            if(await module.exports.checkPlayerBuildings(playerData, property[i]) === 5)
                i = i; 
            else{
                let index = await module.exports.checkPlayerProperties(playerData, property);
                playerData.ownBuildings[index] += 1;
            }   
    } else {
        if ( await module.exports.checkPlayerBuildings(playerData, property) === 5)
            return console.log(`${message.author} already has max buildings on ${property}, in game number ${role}`);
        else{
            let index = await module.exports.checkPlayerProperties(playerData, property);
            playerData.ownBuildings[index] +=1;
        }
    }
    await module.exports.updatePlayer(message, role, playerData);
};

exports.sellPlayerBuildings = async function (message, role, property){
    const playerData = await module.exports.findPlayer(message, role);
    if (property.isArray){
        for (let i = 0 ; i < property.length; i ++){
            if(await module.exports.checkPlayerBuildings(playerData, property) === 0)
                i = i;
            else{
                let index = await module.exports.checkPlayerProperties(playerData, property)
                playerData.ownBuildings[index] -= 1;
            }
        }
    } else {
        if ( await module.exports.checkPlayerBuildings(playerData, property) === 0)
            return console.log(`${message.author} already has no buildings on ${property}, in game number ${role}`);
        else {
            let index = await module.exports.checkPlayerProperties(playerData, property);
            playerData.ownBuildings[index] -=1;
        }
    }
    await module.exports.updatePlayer(message, role, playerData);
};

exports.checkPlayerBuildings = async function (...args){
    if(args.length === 3){
        let playerData = await module.exports.findPlayer(args[0], args[1]);
        let index = module.exports.checkPlayerProperties(playerData, args[2]);
        return playerData.ownBuildings[index]; 
    } else if (args.length === 2){
        let index = module.exports.checkPlayerProperties(args[0], args[1]);
        return args[0].ownBuildings[index];
    } else
        return console.log(`I am missing parameters. I only recevied, ${args}`);
};

exports.setPropertyMortage = async function (message, role, property) {
    const playerData = await module.exports.findPlayer(message, role);
    if (property.isArray) {
        for (let i = 0; i < property.length; i++)
            if (await module.exports.checkPlayerBuildings(playerData, property[i]))
                i = i; 
            else {
                let index = await module.exports.checkPlayerProperties(playerData, property);
                playerData.ifMortgaged[index] = true;
            }
    } else {
        if (await module.exports.checkPlayerBuildings(playerData, property))
            return console.log(`${message.author} already has ${property} mortgaged, in game number ${role}`);
        else {
            let index = await module.exports.checkPlayerProperties(playerData, property);
            playerData.ifMortgaged[index] = true;
        }
    }
    await module.exports.updatePlayer(message, role, playerData);
};

exports.removePropertyMortage = async function (message, role, property) {
    const playerData = await module.exports.findPlayer(message, role);
    if (property.isArray) {
        for (let i = 0; i < property.length; i++) {
            if (!(await module.exports.checkPropertyMortage(playerData, property)))
                i = i;
            else {
                let index = await module.exports.checkPlayerProperties(playerData, property)
                playerData.ifMortgaged[index] = false;
            }
        }
    } else {
        if (await module.exports.checkPlayerBuildings(playerData, property))
            return console.log(`${message.author} already has ${property} mortgaged, in game number ${role}`);
        else {
            let index = await module.exports.checkPlayerProperties(playerData, property);
            playerData.ifMortgaged[index] = false;
        }
    }
    await module.exports.updatePlayer(message, role, playerData);
};

exports.checkPropertyMortage = async function (...args) {
    if (args.length === 3) {
        let playerData = await module.exports.findPlayer(args[0], args[1]);
        let index = module.exports.checkPlayerProperties(playerData, args[2]);
        return playerData.ifMortgaged[index];
    } else if (args.length === 2) {
        let index = module.exports.checkPlayerProperties(args[0], args[1]);
        return args[0].ifMortgaged[index];
    } else
        return console.log(`I am missing parameters. I only recevied, ${args}`);
};

exports.removeGame = async function (role){
    const destoryed = await tag.destroy({ where: { role: role } })
    if(destoryed)
        return console.log(`game ${role} has been destroyed`);
    else    
        return console.log(`game ${role} has not been destroyed`);
};

exports.removePlayer = async function (message, role){
    const destroyed = await tag.destory( await module.exports.findPlayer(message, role) );
    if (destoryed)
        return console.log(`Player ${message.author} has been removed from game ${role}`);
    else
        return console.log(`Player ${message.author} has not been removed from game ${role}`);
};

/*
args[0] = message
args[1] = role
args[2] = if return ownedProperties
args[3] = if return ownedBuildings
args[4] = if return ifMortgage
*/
exports.getPlayerInfo = async function (...args){
    const playerData = await module.exports.findPlayer(args[0], args[1]);
    let returnValue = [];
    returnValue[0] = playerData.balance;
    if(args[2])
        returnValue.push(playerData.ownProperties);
    else if (args[3])
        returnValue.push(playerData.ownBuildings);
    else if (args[4])
        returnValue.push(playerData.ifMortgaged);
    return returnValue;
};

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
    let playerProperites = playerData.ownProperties;
    do{
        swapped = false;
        for (let i = 0; i < playerProperites.length-1; i ++){
            if (ownArray[i].pos > playerProperites[i+1].pos){
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

