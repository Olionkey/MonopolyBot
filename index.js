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

    console.log("Master PID is " + process.pid)

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
    console.log("Spawned with PID " + process.pid)

    /* Required Files */
    const auth = require("./auth.json");
    const config = require("./config.json").general;
    const Discord = require("discord.js");
    const client = new Discord.Client();
    const cards = require('./persistant_data/MonopolyCards.json');

    let fs = require('fs');
    let game = false;
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
        if (message.author.bot) return;

        //Will search for the prefix for the bot to function
        if (message.content.indexOf(config.prefix) !== 0) return;

        /* Will split up the message after every space */
        /* Which is stored in an array in the variable of args */
        /* Then later on it is stored in command .*/
        const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();
        const guildMember = message.member; //Helps add roles to users.
        const combWord = args.join(' ');
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

            case 'start':
              if (game)
                return message.channel.send("game is already started please don't start another game.");
              game = true;
              message.channel.send ("Game has started.")
              
              let inRay = false;
              do{
                inRay = false;
                let testGameId = Math.floor(Math.random() * 10000);
                for ( let i = 0 ; i < CGID.length; i ++)
                  if ( CGID[i] === testGameID)
                    inRay = true;
                if (!inRay)
                  CGID[CGID.length] = testGameId;
              }while (inRay);
              
              message.guild.createRole({
                name: `lobby#${CGID[CGID.length-1]}`,
                hoist: true,
                mentionable: true,
              })      
            
            break;


            case 'play':
              // Checks to see if the game has to started if not then no one can join.
              if(!game)
                return message.channel.send ("Please start the game before joining.");
              // current max lobby limit is 10, should let the server owner change it in the future.
              if ( lobby.length < 10){
                  // goes through the current lobby array to see if the player has joined already or not
                  for (let i = 0 ; i < lobby.length; i ++)
                    if(lobby[i] === message.author.id)
                      return message.reply ("Sorry but you already joined.");

                message.reply ("Welcome to the lobby please wait, while we gather more players!");
                lobby[lobby.length] = message.author.id;
                //console.log(CGID);
                let roleName = `lobby#${CGID[CGID.length - 1]}`;
                let role = message.guild.roles.find(r => r.id !== message.guild.id && r.name == roleName);

                let endpoint = require('discord.js').Constants.Endpoints.Guild(message.guild).toString() + '/roles';
                 message.client.rest.makeRequest('get', endpoint, true).then(roles => roles.map(r => r.name + ': ' + r.id))
                console.log("This is the endpoint" + endpoint);
                console.log("\n\n\nThis is the map of the roles." )
                console.log(message.guild.roles.map(r => r.name + ": " + r.id));
                guildMember.addRole(role).catch(()=>console.error("adding role"));
              }
              if (lobby.length > 1)
                setTimeout(function(){
                  message.reply("Game has started! Enjoy!!");
                }, 60000)
            break;
                
            case 'f':
              let f = message.guild.roles;
                console.log(f.name);
            break;
            case 'endgame':
              let roleName 
              for (let i = 0; i < CGID.length; i ++)
                if (CGID[i] === combWord){
                  roleName = `lobby#${CGID[i]}`;
                  return;
                }
              if (roleName === undefined)
                return message.channel.send("Sorry that game number does not exist.");      
              
              let role = message.guild.roles.find(r => r.name == roleName);
                role.delete('good night')
                  .then(deleted => console.log (`Deleted role ${deleted.name}`))
                  .catch(console.error);
            break;

            case'endall':
              for (let i = 0 ; i < CGID.length; i ++){
                let roleName = `lobby#${CGID[i]}`;
                let role = message.guild.roles.find(r => r.name == roleName);
                role.delete('good night')
                  .then(deleted => console.log(`Deleted role ${deleted.name}`))
                  .catch(console.error);
              }
            break;
            default:
                //return message.reply("That is no command.");
                break;
        }
        
    });
}
