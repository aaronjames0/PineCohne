/** @format */

console.clear();

const Discord = require("discord.js");

const ytdl = require('ytdl-core');

const config = require("./Data/config.json");

const intents = new Discord.Intents(32767);

const client = new Discord.Client({ intents });

const queue = new Map();

function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
      serverQueue.voiceChannel.leave();
      queue.delete(guild.id);
      return;
    }
  }

function playSong(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
}

async function execute(message, serverQueue) {
    const args = message.content.split(" ");
  
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
      return message.channel.send("Cohne no know which channel you in");
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK"))
      return message.channel.send("Cohne no allowed to play music in there");

    const songInfo = await ytdl.getInfo(args[1]);
    const song = {
        title: songInfo.title,
        url: songInfo.video_url
    };

    if (!serverQueue) {
        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };

        queue.set(message.guild.id, queueContruct);

        queueContruct.songs.push(song);

        try {
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
            play(message.guild, queueContruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    } else {
        serverQueue.songs.push(song);
        return message.channel.send(`${song.title} has been added to the queue!`);
    }
}

function skip(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send("You have to be in a voice channel to stop the music!");
    if (!serverQueue)
        return message.channel.send("There is no song that I could skip!");
    serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send("You have to be in a voice channel to stop the music!");
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection.play(ytdl(song.url)).on("finish", () => {
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
    }).on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

function help(channel) {
    channel.send("I don't do anything yet");
    return;
}

client.on("ready", () => console.log("I'm am R Cohne"));

client.on("messageCreate", message => { //Message Processing
    if(!message.content.startsWith(config.prefix)) return;

    const serverQueue = queue.get(message.guild.id);

if (message.content.startsWith(`${config.prefix}play`)) {
    execute(message, serverQueue);
    return;
} else if (message.content.startsWith(`${config.prefix}skip`)) {
    skip(message, serverQueue);
    return;
} else if (message.content.startsWith(`${config.prefix}stop`)) {
    stop(message, serverQueue);
    return;
} else if (message.content.startsWith(`${config.prefix}help`)) {
    help(message.channel);
    return;
} else {
    message.channel.send("Cohne no know this one");
}
    console.log(message.content);   //End Processing
});

/**client.on("messageDelete", message => {
    console.log(message.content);
    console.log("I saw that");
    message.channel.send("A message was deleted by " + message.author.username + ": " + message.content);
});

client.on("voiceStateUpdate", (oldState, newState) => {
    console.log("updated");
    if(oldState.speaking !== newState.speaking) {
        console.log(newState.member.username + " started speaking");
     }
});
*/

client.login(config.token);
