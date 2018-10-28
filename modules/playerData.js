const sequelize = require("sequelize");
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

exports.getTag = function(){
    return tag;
};

exports.setPlayerData = function (message, role){
    tag.create({
      user: message.author.id,
      role: role,
      PlayerData: {
        ownProperties: [],
        ownBuildings: [],
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