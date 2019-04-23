const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./farm_config.json");
const SQLite = require("better-sqlite3");
const sql = new SQLite('./player_data.sqlite');

//Datos del juego
const CommandConfig = require("./farmdata/commands.json");
const items = require("./farmdata/items.json");
const monsters = require("./data/monsters.json");

//Delays y cooldowns
const delay3 = new Set();
const cd3 = 3;
const delay5 = new Set();
const cd5 = 5;
const delay10 = new Set();
const cd10 = 5;

client.on("ready", () => {
    const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'player_data';").get();

    let data0 = "id TEXT PRIMARY KEY," +
                "user TEXT," +
                "guild TEXT," +
                "class TEXT," +
                "experience INTEGER," +
                "maxexperience INTEGER," +
                "level INTEGER," +
                "money INTEGER," +
                "inventory TEXT," +
                "equipment TEXT," +
                "crates INTEGER";

    if (!table['count(*)']) {
        sql.prepare("CREATE TABLE player_data (" + data0 + ");").run();
        sql.prepare("CREATE UNIQUE INDEX idx_scores_id ON player_data (id);").run();
        sql.pragma("synchronous = 1");
        sql.pragma("journal_mode = wal");
    }

    client.getData = sql.prepare("SELECT * FROM player_data WHERE user = ? AND guild = ?");
    let data1 = "id," +
                "user," +
                "guild," +
                "class," +
                "experience," +
                "maxexperience," +
                "level," +
                "money," +
                "inventory," +
                "equipment," +
                "crates";

    let data2 = "@id," +
                "@user," +
                "@guild," +
                "@class," +
                "@experience," +
                "@maxexperience," +
                "@level," +
                "@money," +
                "@inventory," +
                "@equipment," +
                "@crates";

    client.setData = sql.prepare("INSERT OR REPLACE INTO player_data (" + data1 + ") VALUES (" + data2 + ");");

    console.log("Done loading player data SQL.");
});

client.on("message", message => {
    if (message.author.bot || !message.guild) return;
    
    //Variables
    let data;

    let cmd = CommandConfig.Commands;
    
    if (message.guild) {
        data = client.getData.get(message.author.id, message.guild.id); //Cargar datos del jugador

        // Si no existe, crear default.
        if (!data) {
            data = { id: `${message.guild.id}-${message.author.id}`,
            user: message.author.id,
            guild: message.guild.id,
            class: "None",
            experience: 0,
            maxexperience: 10,
            level: 1,
            money: 0,
            inventory: "[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]",
            equipment: "[0,0,0]",
            crates: 0};
        }
    }
    
    // Save data to the sqlite table. 
    // This looks super simple because it's calling upon the prepared statement!
    client.setData.run(data);

    if (message.content.indexOf(config.prefix) !== 0) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    console.log("Comando: " + command);
    console.log("Argumentos: " + args);
    
    /*if(getRandomInt(0, 100) >= 0){
        addItem(message, args);
    }*/
    
    switch(command){
        case cmd[0].name:
            if(message.member.roles.find(r => r.name === "owner")){
                addCrate(message);
            }
            break;
        case cmd[1].name:
            if(checkDelay(message, delay5, cd5)){ helpFunction(message); };
            break;
        case cmd[2].name:
            if(checkDelay(message, delay3, cd3)){ invFunction(message); };
            break;
        case cmd[3].name:
            if(checkDelay(message, delay5, cd5)){ itemInfo(message, args); };
            break;
        case cmd[4].name:
            if(checkDelay(message, delay10, cd10)){ statsFunction(message); };
            break;
        case cmd[5].name:
            if(checkDelay(message, delay5, cd5)){ equipItem(message, args); };
            break;
        case cmd[6].name:
            if(checkDelay(message, delay3, cd3)){ openCrate(message); };
            break;
        default:
            message.channel.send("I didn't understand what you said, partner. Try '" + config.prefix + cmd[1].name + "'.")
            break;
    }
});

addCrate = message => {
    let data = client.getData.get(message.author.id, message.guild.id);
    
    data.crates++;
    message.channel.send("Successfully added a crate to your stash");

    client.setData.run(data);
}

checkDelay = (message, delay, cooldown) => {
    if(delay.has(message.author.id)){
        message.channel.send("Tenes que esperar " + (cooldown) + " segundos antes de repetir el comando.")
        return false;
    } else {
        delay.add(message.author.id);
        setTimeout(() => {
        delay.delete(message.author.id);
    }, cooldown * 1000);
        return true;
    }
}

helpFunction = (message) => {
    console.log(message.author.username + " asked for help.")

    let com = CommandConfig.Commands;
    let fieldsArray = [];

    let f;
    for(let i = 0; i < com.length; i++){
        if(!com[i].private){
            f = {
                name: config.prefix + com[i].name,
                value: com[i].desc
            }
        }

        fieldsArray.push(f);
    }

    message.channel.send({
        embed: {
            color: 0xffffff,
            
            author: {
                name: client.user.name,
                icon_url: client.user.avatarURL
            },

            title: "Command list",

            fields: fieldsArray
        }
    })
}

invFunction = (message) => {
    console.log(message.author.username + " opened their inventory.")
    let data = client.getData.get(message.author.id, message.guild.id);
    let inv = [];

    if(data.inventory == null || data.inventory == ""){
        message.channel.send("Your inventory is empty");
        return;
    } else {
        inv = decodeURI(data.inventory);
        inv = JSON.parse(inv);
    }

    let invEmpty = true;
    for(let y = 0; y < inv.length; y++){
        if(inv[y] <= 1){
            invEmpty = false;
        }
    }

    if(invEmpty){
        message.channel.send("Your inventory is empty");
        return;
    }

    if(client.guilds.get("432405093279858688").available) console.log("Main server is online");

    let fieldsArray = [];

    console.log(inv);

    let f;
    console.log("largo inventario: " + inv.length)
    for(let i = 0; i < inv.length; i++){
        if(inv[i] != 0){
            f = {
                name: items.Items[inv[i]].name,
                value: items.Items[inv[i]].desc,
                inline: true
            }
            fieldsArray.push(f);
        }
    }

    message.channel.send({
        embed: {
            color: 0xfff00,
            
            author: {
                name: client.user.name,
                icon_url: client.user.avatarURL
            },

            title: message.author.username + "'s inventory",

            fields: fieldsArray
        }
    })
}

openCrate = (message) => {
    let data = client.getData.get(message.author.id, message.guild.id);

    if(!data.crates >= 1){
        message.channel.send("You don't have any crates to open.")
        return;
    }
    let inventory = [];

    inventory = data.inventory;
    inventory = decodeURI(inventory);
    inventory = JSON.parse(inventory);

    let type = getRandomInt(0, 4);

    let item;
    switch(type){
        case 0: //Armor
            item = getRandomInt(0, items.armor.length);
            item = items.armor[item];
            break;
        case 1: //Sword
            item = getRandomInt(0, items.sword.length);
            item = items.sword[item];
            break;
        case 2: //Bow
            item = getRandomInt(0, items.bow.length);
            item = items.bow[item];
            break;
        case 3: //Staff
            item = getRandomInt(0, items.staff.length);
            item = items.staff[item];
            break;
        case 4: //Ring
            item = getRandomInt(0, items.ring.length);
            item = items.ring[item];
            break;
        default:
            break;
    }

    if(item != null) addItem(message, item);

    message.channel.send("Picked up a " + item.icon + " " + item.name)

    inventory = JSON.stringify(inventory);
    inventory = encodeURI(inventory);
    data.inventory = inventory;
    client.setData.run(data);
}

addItem = (message, item) => {
    let data = client.getData.get(message.author.id, message.guild.id);
    let inventory = [];

    inventory = data.inventory;
    inventory = decodeURI(inventory);
    inventory = JSON.parse(inventory);

    for(let i = 0; i < data.inventory.length; i++) {
        if(inventory[i] == 0){
            inventory[i] = item;
            break;
        }
    }

    inventory = JSON.stringify(inventory);
    inventory = encodeURI(inventory);
    data.inventory = inventory;
    client.setData.run(data);
}

removeItem = (message, item) => {
    if(args.length < 2){
        return;
    }

    let data = client.getData.get(message.author.id, message.guild.id);
    let inventory = [];
    
    inventory = data.inventory;
    inventory = decodeURI(inventory);
    inventory = JSON.parse(inventory);

    for(let i = 0; i < data.inventory.length; i++){
        if(inventory[i] == item){
            inventory[i] = 0;
            return;
        }
    }
    
    inventory = JSON.stringify(inventory);
    inventory = encodeURI(inventory);
    data.inventory = inventory;
    client.setData.run(data);
}

equipItem = (message, args) => {
    if(args.length < 2){
        message.channel.send("Some parameters are missing.")
        return;
    }

    let data = client.getData.get(message.author.id, message.guild.id);
    let equipment = [];
    let inventory = [];
    
    equipment = data.equipment;
    equipment = decodeURI(equipment);
    equipment = JSON.parse(equipment);
    inventory = data.inventory;
    inventory = decodeURI(inventory);
    inventory = JSON.parse(inventory);

    if(args[0] != "armor" && args[0] != "weapon" && args[0] != "ring"){
        message.channel.send("Wrong equipment type.")
        return;
    }

    let newItem = args[1];
    let slot = 0;

    switch(args[0]){
        /*case "armor":
            newItem = items.armor[newItem];
            break;*/
        case "sword":
            newItem = items.sword[newItem]
            slot = 1;
            break;
        case "bow":
            newItem = items.bow[newItem]
            slot = 1;
            break;
        case "staff":
            newItem = items.staff[newItem]
            slot = 1;
            break;
        /*case "ring":
            newItem = items.ring[newItem]
            slot = 2;
            break;*/
        default:
            break;
    }

    for(let i = 0; i < inventory.length; i++){
        if(inventory[i] == newItem){
            removeItem(message, newItem);
            break;
        }
    }

    let oldItem;
    if(equipment[args[1]] != 0){
        oldItem = equipment[slot];
        addItem(message, oldItem);
    }
    
    inventory = JSON.stringify(inventory);
    inventory = encodeURI(inventory);
    data.inventory = inventory;
    equipment = JSON.stringify(equipment);
    equipment = encodeURI(equipment);
    data.equipment = equipment;
    client.setData.run(data);
}

itemInfo = (message, args) => {
    if(args.length <= 1){
        message.channel.send("Parameters missing");
        return;
    }

    if(args[0] > items.length){
        message.channel.send("Item ID out of range");
        return;
    }

    if(args[0] == 0){
        message.channel.send("ID can't be 0");
        return;
    }

    let item;
    switch(args[1]){
        case "sword":
            item = items.sword[args[0]];
            break;
        case "bow":
            item = items.bow[args[0]];
            break;
        case "staff":
            item = items.staff[args[0]];
            break;
        default:
            message.channel.send("You must choose a weapon type");
            return;
    }

    message.channel.send("Icono: " + item.icon + "\nNombre: " + item.name);
}

statsFunction = (message) => {
    let userdata = client.getScore.get(message.author.id, message.guild.id)
    if(userdata.maxexperience == 0){
        userdata.maxexperience = 10;
        client.setScore.run(userdata);
    }
  
    const embed = new Discord.RichEmbed()
        .setTitle("Cuenta de " + message.author.username)
        .setAuthor(client.user.username, client.user.avatarURL)
        .setThumbnail(message.author.avatarURL)
        .addField("📖 **Nivel**: " + userdata.level, "**" + userdata.experience + "**/**" + userdata.maxexperience + "** experience points.", false)
        .addField("❤️ **Vida**: " + userdata.health, "Si llega a 0 sos boleta bro", false)
        .addField("❤️ **Mana**: " + userdata.health, "asd", false)
        .setColor(0x00AE86);
  
    return message.channel.send({embed});
  }

getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

client.login(config.token);