const sequelize = require('sequelize');
const propertyCards = require("./game_data/propertyCards.json");

const db = new sequelize("database", {
  host: "localhost",
  dialect: "sqlite",
  logging: true,
  operatorsAliases: false,
  storage: "./game_data/playerData.sqlite"
});

const player = db.define('Data', {
  user: {
    type: sequelize.STRING,
    allowNull: false
  },
  guild: {
    type: sequelize.STRING,
    allowNull: false
  },
  gameID: {
    type: sequelize.STRING,
    allowNull: false
  },

  playerData: {
    type: sequelize.JSON,
    defaultValue: {}
  }
});

player.sync();
/**
 * @param {Discord.message} message 
 * @param {String} gameId Determine which game the user is currenlty playing in byt the channel it was sent in.
 * We store the author id to know who is the current player is
 * ownProperties and ownBuildings array size should always be in synced. So they can keep track of how many buildings at each property
 */
exports.createPlayer = async function (message, gameId) {
  player.create({
    user: await message.author.id,
    guild: await message.guild.id,
    gameID: gameId,
    playerData: {
      properties: [{}],
      balance: 1500,
      chanceCard: [],
      communityChest: [],
      inJail: false,
      turnsInJail: 0,
      snakeEyeCount: 0,
      currentPos: 0
    }
  });
}
/**
 * Put the player in jail
 * @param {String | int} userID 
 * @param {String} gameId - The gameId the user is currently playing
 * @returns nothing
 */
exports.setPlayerToJail = async function (userID, _gameID) {
    const _player = await player.findOne({
        where: {
            user: userID,
            gameID: _gameID
        }
    });
    if (_player) {
        const updatePlayerData = { ..._player.dataValues.playerData, inJail: true };
        await _player.update({
            playerData: updatePlayerData
        });
        return true;
    }
    return false;
}
/**
 * Take the player out of jail
 * @param {String | int} useID 
 * @param {String} gameId 
 * @returns Nothing
 */
exports.removePlayerInjail = async function (userID, _gameID) {
    const _player = await player.findOne({
        where: {
            user: userID,
            gameID: _gameID
        }
    });
    if (_player) {
        const updatePlayerData = {
            ..._player.dataValues.playerData,
            inJail: false
        };
        _player.update({
            playerData: updatePlayerData
        });
        return true;
    } return false;
}
/**
 * @param {Discord message} message 
 * @param {String} gameId 
 * @param {String} propertyName 
 * @returns Nothing
 */
exports.addPlayerProperties = async function (userID, _gameID, propertyName) {
    // first check if the property is owned by someone
    const propertyOwner = module.exports.findPropertyOwner( _gameID, propertyName)
    if ( propertyOwner === null) {
        return propertyOwner;
    }
    const _player = await player.findOne({
        where: {
            user: userID, 
            gameID: _gameID
        }
    });
    if ( _player ) {
        const propertyCard = propertyCards[propertyName];
        if(propertyCard) {
            // Add the property to the player properties object
            // Might need to change later currently it will copy the property to the playerData.properties with also giving it a key named "name: propertyName"
            const updatedProperties = [..._player.dataValues.playerData.properties, {...propertyCard, name: propertyName }];
            
            // Sort the array
            updatedProperties.sort( ( a,b ) => a.pos - b.pos );

            //update the playerData object
            const updatePlayerData = {
                ..._player.dataValues.playerData,
                properties: updatedProperties
            };
            // Update the record
            _player.update( { playerData: updatePlayerData } )
        } else { console.log (`${propertyName}: Not found`) }
    } else { console.log( `${userID}: Not Found\n${_gameID}: Not Found`) }
}
/**
 * Only removes the property from the player
 * @param {Discord message} message 
 * @param {String} gameID the gameID
 * @param {String} propertyName the name of the property
 */
exports.removePlayerProperties = async function (userID, _gameID, propertyName){
    const _player = await player.findOne({
        where: {
            user: userID,
            gameID: _gameID
        }
    });
    if (_player) {
        // Use the built in filter method in javascript to find and remove the array
        const updatedProperties = _player.dataVaules.playerData.properties.filter( property => property.name !== propertyName);

        //update the plyaerData object
        const updatePlayerData = {
            ..._player.dataVaules.playerData,
            properties: updatedProperties
        };
        // Update the record
        _player.update( { playerData: updatePlayerData } );
    } else { console.log(` ${userID}: Not Found\n ${_gameID}: Not Found`) };
}
/**
 * 
 * @param {String} _gameID 
 * @param {String} propertyName 
 * @returns {String | null}
 */
exports.finePropertyOwner = async function (_gameID, propertyName){
    const players = await player.findAll({
        where: {
            gameID: _gameID
        }
    });
    for (const playerInstance of players) {
        const properties = playerInstance.dataValues.playerData.properties;
        const hasMatchingProperty = properties.some( property => property.name === propertyName)

        if (hasMatchingProperty) return playerInstance.dataValues.user; // Return the user id if someone does own the property
    }
    return null;
}
/**
 * @param {Discord message} message 
 * @param {String} _gameID 
 * @param {int} move 
 * @returns {Object} the player data set
 */
exports.movePlayer = async function(message, _gameID, move) {
    const _player = await player.findOne({ 
        where: {
            user: message.author.id,
            gameID: _gameID
        }
    });

    if (_player) {
        const newPos = _player.dataValues.playerData.currentPos + move;
        const updatedPlayerData = {
            ..._player.dataValues.playerData,
            currentPos: (newPos <= 40 && newPos > 0) ? newPos : (newPos < 0) ? newPos + 40 : newPos - 40
        };
        _player.update({
            playerData: updatedPlayerData
        });
    }

    return _player;
}
/**
 * @param {String} _gameID 
 * @param {int} movePosition tells it where the player now is to see if there is an owner for that position
 * @returns {Object} Returns the player object that owns the property and where in the index the property was found
 */
exports.findOwner = async function (_gameID, movePosition) {
    // Find all players in a game. Then iterate through all the players to see if there is an owner on a property. If so, return the player that owns it.
    const gamePlayers = await player.findAll({
        where: {
            gameID: _gameID
        },
        attributes: ['playerData']
    });

    for (const currentPlayer of gamePlayers) {
        const ownProperties = currentPlayer.playerData.ownProperties;
        for (const property of ownProperties) {
            const propertyIndex = propertyCards.findIndex(card => card.name === property);
            if (propertyIndex !== -1 && propertyCards[propertyIndex].pos === movePosition) {
                return {
                    player: currentPlayer,
                    index: index
                }
            }
        }
    }

    return -1;
}
/**
 * @param {Discord message} message 
 * @param {String} gameId 
 * @returns the Player data Data
 */
exports.findPlayer = async function (message, _gameID) {
    const _player = await player.findOne({
        where:{
            user: await message.author.id,
            guild: await message.guild.id,
            gameID: _gameID
        }
    })
    return _player;
}
exports.addSnakeEyeCount = async function (message, _gameID) {
    const _player = await player.findOne({
        where: {
            user: message.author.id,
            gameID: _gameID
        }
    })
    if (_player) {
        const updatePlayerData = {
            ..._player.dataValues.playerData,
            snakeEyeCount: _player.datavalues.playerData.snakeEyeCount++
        };
        if (updatePlayerData.snakeEyeCount >= 3) {
            updatePlayerData.snakeEyeCount = 0;
            module.exports.setPlayerToJail(message);
        }
        _player.update({
            playerData: updatePlayerData
        })
    }
    return _player;
}
/**
 * @param {Discord Object} message 
 * @param {*} _gameID 
 * @returns 
 */
exports.getSnakeEyeCount = async function (message, _gameID) {
    const _player = await player.findOne({
        where: {
            user: message.author.id,
            gameID: _gameID
        }
    })
    return _player.dataValues.playerData.snakeEyeCount;
}
/**
 * 
 * @param {int} playerID - Send the player ID directly rather then the message object
 * @param {int} _gameID 
 * @param {int} balance 
 * @returns {Object} _player
 */
exports.addMoney = async function (playerID, _gameID, balance) {
    const _player = await player.findOne({
        where: {
            user: playerID,
            gameID: _gameID
        }
    });
    if( _player) {
        const newMoney = _player.dataValues.playerData.balance + balance;
        const updatePlayerData = {
            ..._player.dataValues.playerData,
            balance: newMoney
        };
        _player.update({
            playerData: updatePlayerData
        });
    }
    return _player;
}
/**
 * 
 * @param {int} playerID - Send the player ID directly rather then the message object
 * @param {int} _gameID 
 * @param {int} balance 
 * @returns {Object} _player
 */
// This will probably have to be refactored to actually deal with negaitive money. And some logic to see if they can get out of debt?
exports.removeMoney = async function (playerID, _gameID, balance) {
    const _player = await player.findOne({
        where: {
            user: playerID,
            gameID: _gameID
        }
    });

    if( _player) {
        let newMoney = _player.dataValues.playerData.balance - balance;
        // If the new balance for the player is low, send it back and deal with it where it was orignally called
        // Then from there show the user what they can mortage/sell to gan money back to get out of debt
        // Or say that they can't sell or mortage anything.
        if (newMoney < 0)
            return newMoney;
        const updatePlayerData = {
            ..._player.dataValues.playerData,
            balance: newMoney
        };
        _player.update({
            playerData: updatePlayerData
        })
    } else {
        console.error(` Player: ${playerID} and gameID: ${_gameID} have not been found`);
    }
    return _player;
}
exports.getMoney = async function (playerID, _gameID) {
    const _player = await player.findOne({
        where: {
            user: playerID,
            gameID: _gameID
        }
    });
    return _player.dataValues.playerData.balance;
}
/**
 * 
 * @param {Discord Message} message 
 * @param {String} _gameID 
 * @param {Boolean} propertiesInfo 
 * @param {Boolean} buildingsInfo 
 * @param {Boolean} mortgageInfo 
 * @returns {Object}
 */
exports.getPlayerInoro = async function (message, _gameID, propertiesInfo, buildingsInfo, mortgageInfo) {
    const _player = await player.findOne({
        where: {
            user: message.author.id,
            gameID: _gameID
        }
    });
    const playerData = _player.dataValues.playerData;
    const result = {};

    if (propertiesInfo) { result.ownProperties = playerData.ownProperties }
    if (buildingsInfo)  { result.ownBuildings  = playerData.ownBuildings }
    if (mortgageInfo)   { result.mortgageInfo  = playerData.mortgageInfo }
    return result;
}
/**
 * 
 * @param {Discord Message} message 
 * @param {String} _gameID 
 */
exports.resetJailTurns = async function ( message, _gameID) {
    const _player = player.findOne({
        where: {
            useID: await message.author.id,
            gameID: _gameID
        }
    });
    if (_player) {
        const updatePlayerData = {
            ..._player.dataValues.playerData,
            turnsInJail: 0
        };
        _player.update({
            playerData: updatePlayerData
        })
    }
}
/**
 * TODO: Currently this will only deal with houses and it will just keep adding more even after 4 houses have been added, Logic is needed to add 1 hotel and nothing more;
 * @param {Discord message} message 
 * @param {String} _gameID 
 * @param {String} property 
 * @param {int} amount 
 */
exports.addBuildings = async function (message, _gameID, propertyName, buildingsToAdd, isHotel = false) { 
    const _player = await player.findOne({ 
        where: {
            user: message.author.id,
            gameID: _gameID
        }
    });
    
    const playerProperties  = _player.dataValues.playerData.properties;
    const playerBalance     = _player.dataValues.playerData.balance;
    const propertyCard      = propertyCards[propertyName];
    const colorGroup        = propertyCard.color;
    const houseCost         = propertyCard.houseCost;
    const hotelCost         = propertyCard.hotelCost;

    if (ownsAllColorGroup(colorGroup, playerProperties)) {
        const propertiesInColorGroup = playerProperties.filter(property => property.color === colorGroup);
        const buildingCost = houseCost * buildingsToAdd;

        if (playerBalance >= buildingCost) {
            // Update the buildings on each property then update the user's balance and send back their new balance;
            while (buildingsToAdd > 0) {
                // Find the property with the least amount of buildings first to balance all of the buildings
                let minBuildings = Math.min(...propertiesInColorGroup.map(property => property.buildingAmount));

                const updatedProperties = playerProperties.map(property => {
                    if (property.color === colorGroup && property.buildingAmount === minBuildings && --buildingsToAdd > 0) {
                        return {
                            ...property,
                            buildingAmount: property.buildingAmount + 1
                        };
                    }
                    return property;
                });

                await _player.update({
                    playerData: {
                        ..._player.dataValues.playerData, 
                        properties: updatedProperties,
                        balance: playerBalance - buildingCost
                    }
                });
            }
        } else {
            // TODO: Write code that can tell the player how many houses they can afrrd.
            throw new Error("Insufficient funds.");
        }
    } else {
        throw new Error("You do not own all properties in the color group.");
    }
}
exports.sellBuildings = async function (message, _gameID, propertyName, BuildingsToRemove) { 
    const _player = await player.findOne({
        where: {
            user: message.author.id,
            gameID: _gameID
        }
    });
    const totalBuildings = module.exports.getBuildingAmount(message, _gameID, propertyName);
    

}
epoxrts.getBuildingAmount = async function (message, _gameID, propertyName) {
    const _player = await player.findOne({
        where: {
            user: message.author.id,
            gameID: _gameID
        }
    })
    
    const playerProperties = _player.dataValues.playerData.properties;
    const colorProp        = playerProperties.filter(prop => prop.color === propertyCards[propertyName].color);
    let totalBuildings     = 0;
    for (const prop of colorProp) { totalBuildings += prop.buildingAmount }
    return totalBuildings;
    }

/**
 * TODO: Remove this code since propertyCards.json stores how much of each color exists.
 * @purpose Counts the amount of properties in a color group to check if the player has all of the properties needed to be able to build
 * @param {String} color 
 * @returns {Boolean}
 */
function countPropertiesInColorGroup ( color ) {
    return propertyCards.reduce(( count, property ) => {
        return property.color === color ? count + 1 : count;
    }, 0);
};
/**
 * @purpose Returns to know if the user has the correct amount of propeties in (for) that color group
 * @param {String} color 
 * @param {Object} playerProperties 
 * @returns {Boolean}
 */
function ownsAllColorGroup( color, playerProperties ){
    const cardsInColorGroup     = countPropertiesInColorGroup(color);
    const ownedProps            = playerProperties.reduce(( count, property) => {
        return property.color === color ? count++ : count;
    }, 0);
    // Return if the user has the required amount of cards
    return cardsInColorGroup === ownedProps; 
};

