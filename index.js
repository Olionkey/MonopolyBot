/* Make 2 processes: one for regenerating (the master) and one to do the processing (the worker) */
/*
 **  This lets the bot to be multi threaded if you want to let it be multi threaded in the future.
 */
var cluster = require('cluster');
/* Check to see if the process is the master */
if (cluster.isMaster) {
    /* Fork workers. In the future, the plan is to have the bot be multi-threaded */
    for (var i = 0; i < (1); i++) {
        cluster.fork();
    }

    console.log("Master PID is " + process.pid);

    cluster.on('exit', function (deadWorker, code, signal) {
        /* Restart the worker */
        var worker = cluster.fork();

        /* Note the process IDs */
        var newPID = worker.process.pid;
        var oldPID = deadWorker.process.pid;

        /* Log the event */
        console.log('worker ' + oldPID + ' died.');
        console.log('worker ' + newPID + ' born.');
    });

} else {

    /* This is the PID of the new generated process. It doesn't show the 'worker PID born' at startup */
    console.log("Spawned with PID " + process.pid);

    /* Required Files */
    const auth = require("./auth.json");
    const config = require("./config.json").general;
    const Discord = require("discord.js");
    const client = new Discord.Client();
    const updateJsonFile = require('update-json-file');
    const cards = require('./persistant_data/MonopolyCards.json');
    const roleFunction = require('./modules/roles.js');
    const game = require('./modules/game.js');

    let fs = require('fs');
    let gameStart = false;
    let playercount = 0;
    let joinable = true;
    let lobby = [],
        CGID  = []; // Current Game Ids



    /*Start bot */
    client.login(auth.token);
    client.on("ready", () => {
        console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
        const member = client.channels.get(config.statusChannelID);
    });

    /* When the bot is first added to a new server */
    client.on("guildCreate", guild => {
        console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
    });

    /*When the bot is deleted from a server */
    client.on("guildDelete", guild => {
        console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
    });

    /* Will run when it sees a message */
    client.on("message", async message => {
        /* Will ignore it self */

        //if (message.author.bot) return;

        //Will search for the prefix for the bot to function
        if (message.content.indexOf(config.prefix) !== 0) return;

        /* Will split up the message after every space */
        /* Which is stored in an array in the variable of args */
        /* Then later on it is stored in command .*/
        const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();
        const guildMember = message.member; //Helps add roles to users.
        const combWord = args.join('');
        /* what calls the bot for a command */


        switch (command) {
            case 'r':
                console.log("Reload time!");
                process.exit(0);
                break;
            case 'ping':
              return message.channel.send("pong");
            break;

            case 'testcards':
                var code = "message.channel.send(cards.";
                code = code + combWord + ")";
                 eval(code);
            break;

            case 'roll':
              let roll1 = Math.floor(Math.random()*7);
              let roll2 = Math.floor(Math.random()*7);

              if ( roll1 === roll2 ){
                if (/*add playerSnakeEye count ===  3 */ 1+1 === 3){
                  //send player to jail.
                }
                // make it their turn again.
                return message.reply("You rolled snake eyes, move " + roll1+roll2 + " spaces.");
              }
              message.reply("You have rolled, move " + roll1 + roll2 + " spaces.")
            break;

            case 's':
            case 'start':
              if (gameStart)
                return message.channel.send("game is already started please don't start another game.");
              gameStart = true;
              message.channel.send ("Game has started.")
            
              // Purpose of the loop is to check if the randomly generated CGID has been used yet, if so make a new ID
              CGID[CGID.length - 1] = roleFunction.getNewCGID(CGID);
              
              // Will create a role with the last number generated.
              message.guild.createRole({
                name: `lobby#${CGID[CGID.length-1]}`,
                hoist: false,
                mentionable: false,
              })
                .then( () => roleFunction.createChannel(message, `lobby#${CGID[CGID.length - 1]}`));
              
            break;

            case 'join':
            case 'play':
              // Checks to see if the game has to started if not then no one can join.
              if(!gameStart)
                return message.channel.send ("Please start the game before joining.");
              // current max lobby limit is 10, should let the server owner change it in the future.
              if ( lobby.length < 10){
                  // goes through the current lobby array to see if the player has joined already or not
                  for (let i = 0 ; i < lobby.length; i ++)
                    if(lobby[i] === message.author.id)
                      return message.reply ("Sorry but you already joined.");

                message.reply ("Welcome to the lobby please wait, while we gather more players!");
                lobby[lobby.length] = message.author.id;

                let roleName = `lobby#${CGID[CGID.length - 1]}`;
                // Makes sure the guild id and role id do not match. Had some issues where they did.
                let role = message.guild.roles.find(r => r.id !== message.guild.id && r.name == roleName);

                guildMember.addRole(role).catch(()=>console.error("adding role"));
              }
            
              if (lobby.length > 0) {
              // If the player count is greater 1 then the game will start in x amount of minutes.
                setTimeout(function(){
                  let players = ""
                  for (let i = 0 ; i < lobby.length; i ++) {
                    players = players + lobby[i] + ","
                  }
                  players = players.substring(0, players.length - 1);
                  message.reply("Game has started! Enjoy!!");
                  
                  playGame(players)
                  
                  gameStart = false;
                  lobby = [];
                10}, 6000)
                }

            break;

            case 'endgame':
              let roleName;
              let allRoles = [];
              allRoles = roleFunction.getLobbyNumber(message);
              // Will serach through all of the roles on the server rather then an array which reset after the bot restart.
              for (let i = 0; i < allRoles.length; i ++){
                if (allRoles[i] === parseInt(args[0])){
                  console.log ("Got a match");
                  roleName = `lobby#${allRoles[i]}`;
                  break;
                }
              }

              if (roleName === undefined)
                return message.channel.send("Sorry that game number does not exist.");      
              
              let role = message.guild.roles.find(r => r.name == roleName);
              // Deletes the roll after it has been found.
                role.delete('good night')
                  .then(deleted => console.log (`Deleted role ${deleted.name}`))
                  .catch(console.error);
              roleFunction.deleteChannel(message, args[0], false)

            break;

            default:
                return message.reply("That is no command.");
            break;
                
            case'endall':
              let lobbyRole = roleFunction.getLobbyRole(message);
              console.log("I got lobbyRole");
              let rolep = '';
               for(let i = 0 ; i < lobbyRole.length; i ++){
                rolep = message.guild.roles.find(r => r.name == lobbyRole[i]);
                rolep.delete('good night')
                  .then(deleted => console.log(`Deleted role ${deleted.name}`))
                  .catch(console.error);
              }
              message.channel.send ("All lobby roles have been deleted.");
              gameStart = false;
              roleFunction.deleteChannel(message,-1,true)
            break;
        }
        
    });
      async function playGame(UUID_String) {
      let players = []
      players = UUID_String.split(",");
      for (let i = 0 ; i < players.length; i ++) {
        let debug = client.channels.get(411777884861104130)
        debug.send(players[i])
      }
    }
}
