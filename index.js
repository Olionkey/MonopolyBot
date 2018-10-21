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

  cluster.on('exit', function(deadWorker, code, signal) {
    /* Restart the worker */
    var worker = cluster.fork();

    /* Note the process IDs */
    var newPID = worker.process.pid;
    var oldPID = deadWorker.process.pid;

    /* Log the event */
    console.log('worker '+oldPID+' died.');
    console.log('worker '+newPID+' born.');
  });

} else {
  /* This is the PID of the new generated process. It doesn't show the 'worker PID born' at startup */
  console.log("Spawned with PID " + process.pid)

  /* Required Files */
  const auth           = require("./auth.json");
  const config         = require("./config.json").general;
  const Discord        = require("discord.js");
  const client         = new Discord.Client();

  let fs               = require('fs');



  /*Start bot */
  client.login(auth.token);
  client.on("ready" , () => {
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
  client.on("message", async message =>{
    /* Will ignore it self */
    if(message.author.bot) return;

    //Will search for the prefix for the bot to function
    if(message.content.indexOf(config.prefix) !== 0) return;

    /* Will split up the message after every space */
    /* Which is stored in an array in the variable of args */
    /* Then later on it is stored in command .*/
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    /* what calls the bot for a command */
    switch(command){
      case 'r':
        console.log("Reload time!");
        process.exit(0);
      break;

      default:
        return message.reply("That is no command.");
      break;
    }
  });
}
