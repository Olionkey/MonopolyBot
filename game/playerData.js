const sequelize = require('sequelize');
const propertyCards = require("./game_data/propertyCards.json");

const db = new sequelize("database", {
  host: "localhost",
  dialect: "sqlite",
  logging: true,
  operatorsAliases: false,
  storage: "database.sqlite"
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
  gameId: {
    type: sequelize.STRING,
    allowNull: false
  },

  playerData: {
    type: sequelize.JSON,
    defaultValue: {}
  }
});

// Sort and properties, then swap properties,buildings and mortgaged
const sortOwnedProperties = (a, b) => {
  // get the indexes of A and B in the ownProperties Array
  const indexA = playerData.ownProperties.indexOf(a);
  const indexB = playerData.ownProperties.indexOf(b);
  // Compare Pos of each index
  const result = a.pos - b.pos;
  //if b if before a swap it all
  if (result > 0) {
    [playerData.ownProperties[indexA], playerData.ownProperties[indexB]] = [
      playerData.ownProperties[indexB],
      playerData.ownProperties[indexA]
    ];
    [playerData.ownBuildings[indexA], playerData.ownbuildings[indexB]] = [
      playerData.ownBuildings[indexB],
      playerData.ownBuildings[indexA]
    ];
    [playerData.ifMortgaged[indexA], playerData.ifMortgaged[indexB]] = [
      playerData.ifMortgaged[indexB],
      playerData.ifMortgaged[indexA]
    ];
  }
  return result;
};

player.sync();

/**
 * Helper function to update playerData of a given player
 * @param {Object} _player - Player object
 * @param {Object} updatedPlayerData - New player data
 * @returns {Promise} - Promise that resolves when the update is completed
 */
async function updatePlayerData(_player, updatedPlayerData) {
  await _player.update({
    playerData: updatedPlayerData
  });
}

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
    }
    return false;
}
/**
 * 
 * @param {Discord message} message 
 * @param {String} gameId 
 * @param {String} propertyName 
 * @returns Nothing
 */
exports.addPlayerProperties = async function (userID, _gameID, propertyName) {
    const _player = await player.findOne({
        where: {
            user: userID,
            gameID: _gameID
        }
    });
    let playerProperties = _player.playerData.ownProperties;
    // This won't do what I originaly was thinking 5 years ago, Create a new method that will either search through all players in a game to see what propeties are owned. or create a new array that keeps track of propeties that are already owned.
    if (playerProperties.indexOf(propertyName) !== -1) {
        return console.log("Someone already owns this property");
    } else {
        _player.playerData.ownProperties.push(propertyName);
        _player.playerData.ownBuildings.push(0);
        _player.playerData.ifMortgaged.push(false);
    }
    // Sort the property array,building, and mortgaged so they follow the order of the game board.
    _player.playerData.ownProperties.sort(sortOwnedProperties);
    await _player.update({
        playerData: _player.playerData
    })
    _player.save();
}
/**
 * Only removes the property from the player
 * @param {Discord message} message 
 * @param {String} gameID the gameID
 * @param {String} propertyName the name of the property
 */
exports.removePlayerProperties = async function (message, gameID, propertyName){
    let _player             = await module.exports.findPlayer(message, gameID);
    let playerProperties    = _player.playerData.ownProperties;
    
    //check to see if the player even owns the property
    if ( playerProperties.indexOf( propertyName ) === -1) { return console.log(`${message.author} does not currenlty own ${propertyName} in game ${gameID}`)} 
    else {
        _player.playerData.splice( _player.playerData.ownProperties.indexOf( propertyName ));
    }
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
