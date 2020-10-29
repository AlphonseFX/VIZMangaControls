// Bot Requirements
const DISCORD = require("discord.js");
const CLIENT = new DISCORD.Client();
const PATH = require('path');
const HTTPS = require('https');
const PATREON = require(
     PATH.join(__dirname, 'patreon.js')
);

// Configuration file
// Format: 
// { 
//    "token"  : "",
//    "prefix" : "!vendor"
// }
const CONFIG = require(
     PATH.join(__dirname, 'resources', 'config.json')
);

// Server ID, bot channel and master list (which contains a list of message IDs)
const SERVER_ID = "";
const MASTER_CHANNEL_ID = "";
const MASTER_MSG_ID = "";

// On ready
CLIENT.on("ready", () => {
     console.log(`(NOTICE) Bot has started`); 
     
     // sync attempt
     console.log(`(LOG) Attempting to sync with online Patron list`); 
     const c = CLIENT.guilds.cache.get(SERVER_ID).channels.cache.get(MASTER_CHANNEL_ID);
     var masterMsg = c.messages.fetch(MASTER_MSG_ID).then(async result => {
          const REGEX = /^\d{15,20}$/gm;
          if (REGEX.test(result.content)) {
               var listPost = await c.messages.fetch(result.content);
               if (listPost) {
                    var attachments = await listPost.attachments.first();
                    if (attachments && attachments.name === 'output.json') {
                         const fs = require('fs');
                         const listPath = PATH.join(__dirname, 'resources', 'output.json');
                         const listFile = fs.statSync(listPath);
                         if (listFile.mtimeMs < listPost.createdTimestamp) {
                              var newFile;
                              HTTPS.get(attachments.url, response => {
                                   newFile = fs.createWriteStream(listPath);
                                   response.pipe(newFile);
                              });
                              console.log("(NOTICE) Local list has been updated with an online copy")
                         }
                         else {
                              console.log("(WARNING) Local list is newer than online version. Save only when necessary!")
                         }
                    }
                    else {
                         console.log("(ERROR) Invalid attachments; message must have an attached 'output.json' file")
                    }
               }
               else { 
                    console.log("(ERROR) Could not fetch the message containing the list; contact me?")
               }
          }
          else {
               console.log("(ERROR) Cannot read master ID, invalid format. Was it stored properly?")
          }
     });
});

// On message
CLIENT.on("message", async msg => {
     if(msg.author.bot) return;
     if(msg.content.indexOf(CONFIG.prefix) !== 0) return;
     const arguments = msg.content.slice(CONFIG.prefix.length).trim().split(/ +/g);

     const command = arguments.shift().toLowerCase();

     // Incorrect server
     if (command) {
          if (msg.guild.id != SERVER_ID) {
               throw Error ("Incorrect server!");
               command = null;
          }
     }

     // Save list online
     if (command === 'save') {
          if (!msg.member.roles.cache.get('697964132015669368')) {
               return msg.reply("you have insufficient privileges.");
          }
          else {
               var listPath = PATH.join(__dirname, 'resources', 'output.json');
               var fileMsg = await msg.channel.send({
                    files: [listPath]
               });
     
               var masterMsg = await msg.channel.messages.fetch(MASTER_MSG_ID);
               if (masterMsg) {
                    masterMsg.edit(fileMsg.id);
                    const m = await msg.channel.send("Updated the online list with a local copy");
               }
               else {
                    const m = await msg.channel.send("Could not fetch the master message; save failed.");
               }
          }
     }

     // Update list
     if(command === "update") {
          if (!msg.member.roles.cache.get('697964132015669368')) {
               return msg.reply("you have insufficient privileges.");
          }
          else {
               const m = await msg.channel.send("Updating the list, please leave the bot running...");
               var invalids = await PATREON.validateList();

               if (invalids) {
                    for (var i = 0; i < invalids.length; i++) {
                         let member = await msg.guild.members.fetch(invalids[i]);
                         if (member) {
                              let patronRole = msg.guild.roles.cache.find(role => role.name === "Patrons");
                              member.roles.remove(patronRole);

                              console.log("(NOTICE) User with ID " + invalids[i] + " has lost their Patron status");
                              await msg.channel.send("User <@" + invalids[i] + "> has lost their Patron status.");
                         }
                         else {
                              console.log("(ERROR) Unable to find member with ID " + arguments[1])
                         }
                    }
                    m.edit("Finished updating the Patron list; you can now turn off the bot.");
               }
               else {
                    console.log("(LOG) No invalid Patrons in the list");
               }
          }
     }

     // Add to list
     if(command === "add") {
          if (!msg.member.roles.cache.get('697964132015669368')) {
               return msg.reply("you have insufficient privileges.");
          }
          else {
               if (arguments[0] && arguments[1]) {
                    const m = await msg.channel.send("Attempting to add user...");
                    const obj = {
                         "url":arguments[0],
                         "discord":arguments[1]
                    };

                    let member = await msg.guild.members.fetch(arguments[1]);
                    if (member) {
                         let addResponse = await PATREON.addPatron(obj);
                         if (addResponse) {
                              let patronRole = msg.guild.roles.cache.find(role => role.name === "Patrons");
                              member.roles.add(patronRole);
                              m.edit("Success. <@" + arguments[1] + "> is now a Patron.");
     
                              console.log("(LOG) A Patron with the ID " + arguments[1] + " has been added");
                         }
                         else {
                              m.edit("Failed to add user <@" + arguments[1] + ">, are their pledges public?");
                              console.log("(ERROR) Invalid user; are you sure they're a Patron?");
                              
                         }
                    }
                    else {
                         m.edit("Cannot find handle with ID '" + arguments[1] + "'. No role changes made.");
                         console.log("(ERROR) Unsuccessful attempt to add user (ID: " + arguments[1] + ")")
                    }
               }
          }
     }
});

// Login with token from config
CLIENT.login(CONFIG.token);
