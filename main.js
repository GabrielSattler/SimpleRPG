const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const SQLite = require("better-sqlite3");
const sql = new SQLite('./player_data.sqlite');

//Datos del juego
const monsters = require("./data/monsters.json");
const gear = require("./data/gear.json");

const helpDelay = new Set();
const helpCD = 15000;
const gayDelay = new Set();
const gayCD = 15000;
const insultDelay = new Set();
const insultCD = 15000;
const statDelay = new Set();
const statCD = 6000;
const moneyDelay = new Set();
const moneyCD = 6000;
const battleDelay = new Set();
const battleCD = 10000;
const shopDelay = new Set();
const shopCD = 5000;
const buyDelay = new Set();
const buyCD = 10000;

client.on("ready", () => {
  // Check if the table "points" exists.
  const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'player_data';").get();
  if (!table['count(*)']) {
    // If the table isn't there, create it and setup the database correctly.
    sql.prepare("CREATE TABLE player_data (id TEXT PRIMARY KEY, user TEXT, guild TEXT, experience INTEGER, maxexperience INTEGER, level INTEGER, money INTEGER, class TEXT, subclass TEXT, weapon INTEGER, armor INTEGER, health INTEGER);").run();
    // Ensure that the "id" row is always unique and indexed.
    sql.prepare("CREATE UNIQUE INDEX idx_scores_id ON player_data (id);").run();
    sql.pragma("synchronous = 1");
    sql.pragma("journal_mode = wal");
  }

  console.log("Cargando tablas.");
  // And then we have two prepared statements to get and set the score data.
  client.getScore = sql.prepare("SELECT * FROM player_data WHERE user = ? AND guild = ?");
  client.setScore = sql.prepare("INSERT OR REPLACE INTO player_data (id, user, guild, experience, maxexperience, level, money, class, subclass, weapon, armor, health) VALUES (@id, @user, @guild, @experience, @maxexperience, @level, @money, @class, @subclass, @weapon, @armor, @health);");

  console.log("Done loading.");
});

client.on("message", message => {
  if (message.author.bot || !message.guild) return;
  
  //Variables
  let score;
  
  if (message.guild) {
    score = client.getScore.get(message.author.id, message.guild.id); //Cargar datos del jugador
    
    // Si no existe, crear default.
    if (!score) {
      score = { id: `${message.guild.id}-${message.author.id}`,
      user: message.author.id,
      guild: message.guild.id,
      experience: 0,
      maxexperience: 10,
      level: 1,
      money: 0,
      class: 'None',
      subclass: 'None',
      weapon: 0,
      armor: 0,
      health: 10};
    }

    if(score.maxexperience === 0){
      score.maxexperience = 10;
      client.setScore.run(score);
    }

    // Save data to the sqlite table. 
    // This looks super simple because it's calling upon the prepared statement!
    client.setScore.run(score);
  }

  if (message.content.indexOf(config.prefix) !== 0) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  console.log("Comando: " + command);

  switch(command){
    case commandList.helpCommand:
      if(checkDelay(message, helpDelay, helpCD)){ helpFunction(message); };
      break;
    case commandList.helpShort:
      if(checkDelay(message, helpDelay, helpCD)){ helpFunction(message); };
      break;
    case commandList.gayCommand:
      if(checkDelay(message, gayDelay, gayCD)){ gaymeterFunction(message); }
      break;
    case commandList.insultCommand:
      if(checkDelay(message, insultDelay, insultCD)){ insultFunction(message); }
      break;
    case commandList.statsCommand:
      if(checkDelay(message, statDelay, statCD)){ statsFunction(message); }
      break;
    case commandList.statsShort:
      if(checkDelay(message, statDelay, statCD)){ statsFunction(message); }
      break;
    case commandList.moneyCommand:
      if(checkDelay(message, moneyDelay, moneyCD)){ moneyFunction(message); }
      break;
    case commandList.moneyShort:
      if(checkDelay(message, moneyDelay, moneyCD)){ moneyFunction(message); }
      break;
    case commandList.battleCommand:
      if(checkDelay(message, battleDelay, battleCD)){ battleFunction(message, args); }
      break;
    case commandList.battleShort:
      if(checkDelay(message, battleDelay, battleCD)){ battleFunction(message, args); }
      break;
    case commandList.shopCommand:
      if(checkDelay(message, shopDelay, shopCD)){ shopFunction(message, args); }
      break;
    case commandList.shopShort:
      if(checkDelay(message, shopDelay, shopCD)){ shopFunction(message, args); }
      break;
    case commandList.buyCommand:
      if(checkDelay(message, buyDelay, buyCD)){ buyFunction(message, args); }
      break;
    case commandList.buyShort:
      if(checkDelay(message, buyDelay, buyCD)){ buyFunction(message, args); }
      break;
    default:
      message.channel.send("No te entendi un pomo, proba '" + config.prefix + commandList.helpCommand + "'.")
      break;
  }
});

checkDelay = (message, command, cooldown) => {
  if(command.has(message.author.id)){
    message.channel.send("Tenes que esperar " + (cooldown / 1000) + " segundos antes de repetir el comando.")
    return;
  } else {
    command.add(message.author.id);
    setTimeout(() => {
      command.delete(message.author.id);
    }, cooldown);
    return true;
  }
}

const commandList = {
  helpCommand : "halp",
  helpShort : "h",
  gayCommand : "gay",
  insultCommand : "puto",
  statsCommand : "stats",
  statsShort : "s",
  moneyCommand : "gold",
  moneyShort : "g",
  battleCommand : "battle",
  battleShort : "b",
  shopCommand : "shop",
  shopShort : "s",
  buyCommand : "buy"
}

helpFunction = (message) => {
  let helpText = "**" + config.prefix + commandList.helpCommand + "** o **" + config.prefix + commandList.helpShort + "**";
  let gayText = "**" + config.prefix + commandList.gayCommand + "**";
  let insultText = "**" + config.prefix + commandList.insultCommand + "**";
  let statsText = "**" + config.prefix + commandList.statsCommand + "** o **" + config.prefix + commandList.statsShort + "**";
  let moneyText = "**" + config.prefix + commandList.moneyCommand + "** o **" + config.prefix + commandList.moneyShort + "**";
  let battleText = "**" + config.prefix + commandList.battleCommand + "** o **" + config.prefix + commandList.battleShort + "**";
  let shopText = "**" + config.prefix + commandList.shopCommand + "** o **" + config.prefix + commandList.shopShort + "**";

  const embed = new Discord.RichEmbed()
      .setTitle("Lista de Comandos")
      .setAuthor(client.user.username, client.user.avatarURL)
      .addField(helpText, "Muestra este menú.", false)
      .addField(gayText, "Te dice que tan GAYmer sos.", false)
      .addField(insultText, "Sorpresa sorpresa bro.", false)
      .addField(statsText, "Mira tu perfil de RPG.", false)
      .addField(moneyText, "Mira que tanto oro tenes.", false)
      .addField(battleText + " + *<facil/medio/dificil>*", "Pelea contra un monstruo.", false)
      .addField(shopText, "Revisa la tienda para mejorar a tu personaje.", false)
      .setColor(0x00AE86);

    return message.channel.send({embed});
}

gaymeterFunction = (message) => {
  let percent = Math.floor((message.author.discriminator * 100) / 9999);
  message.channel.send(message.author.toString() + " es %" + percent + " gay.");
}

insultFunction = (message) => {
  message.channel.send("***Puto el que lee jaja caiste gatubela cosmica :9.***");
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
      .addField("📖 **Nivel**: " + userdata.level, "**" + userdata.experience + "**/**" + userdata.maxexperience + "** de experiencia.", false)
      .addField("❤️ **Vida**: " + userdata.health, "Si llega a 0 sos boleta bro", false)
      .addField("🤺 **Arma**: " + gear.Armas[userdata.weapon].name, "**" + gear.Armas[userdata.weapon].minDamage + "** a **" + gear.Armas[userdata.weapon].maxDamage + "** de daño.", false)
      .addField("🛡️ **Armadura**: " + gear.Armor[userdata.armor].name, "**" + gear.Armor[userdata.armor].defense + "** de defensa.", false)
      .setColor(0x00AE86);

  return message.channel.send({embed});
}

moneyFunction = (message) => {
  let userdata = client.getScore.get(message.author.id, message.guild.id);
  message.channel.send(message.author.username + " tiene " + userdata.money + " monedas de oro.");
}

battleFunction = (message, args) => {
  if(args[0] == null){
    message.channel.send("Tenes que seleccionar entre /pelea facil, /pelea medio o /pelea dificil");
    return;
  }

  args[0] = args[0].toLowerCase();
  if(args[0] != "facil"){
    if(args[0] != "medio"){
      if(args[0] != "dificil"){
        message.channel.send("Tenes que seleccionar entre /pelea facil, /pelea medio o /pelea dificil");
        return;
      }
    }
  }
  let userdata = client.getScore.get(message.author.id, message.guild.id);
  let m = monsters.Monstruos[getRandomInt(0, monsters.Monstruos.length-1)];
  let monster = {
    name : m.name,
    icon : m.icon,
    level : m.level,
    health : m.health,
    minAttack : m.minAttack,
    maxAttack : m.maxAttack,
    defense : m.defense
  };
  let won = false;
  let dif = args[0];

  let lv = 0;
  switch(dif){
    case 'facil':
      lv = userdata.level;
      levelMonster(monster, lv);
      break;
    case 'medio':
      if(userdata.level > 1){
        lv = getRandomInt(userdata.level - 1, userdata.level + 2);
      } else {
        lv = getRandomInt(1, userdata.level + 2);
      }
      levelMonster(monster, lv);
      break;
    case 'dificil':
      if(userdata.level > 1){
        lv = getRandomInt(userdata.level - 1, userdata.level + 5);
      } else {
          lv = getRandomInt(1, userdata.level + 2);
      }
      levelMonster(monster, lv);
      break;
    default:
      break;
  }
  console.log("nivel de monstruo: " + lv);

  //Calculo pelea
  let turns = 1;
  let maxTurns = 20;
  var tempHP = userdata.health;
  for(let i = 0; i < maxTurns; i++){
    if(tempHP > 0 || monster.health > 0){
      console.log("Turno " + i);
      console.log(monster.health);

      monster.health -= playerAttack(userdata);
      if(monster.health < 0) monster.health = 0;
      
      tempHP -= monsterAttack(monster, userdata);
      if(tempHP < 0) tempHP = 0;

      turns++;
    }
    if(tempHP <= 0 && monster.health <= 0){
      won = 2;
      console.log("FIN PELEA, DURO " + turns);
      break;
    }
    if(tempHP <= 0){
      won = 1;
      console.log("FIN PELEA, DURO " + turns);
      break;
    }
    if(monster.health <= 0) {
      won = 0;
      console.log("FIN PELEA, DURO " + turns);
      break;
    }
  }

  //Variables de color e imagen del embed
  let thumb;
  let color;
  let footer;
  if(won == 0){
    thumb = "https://cdn.shopify.com/s/files/1/1061/1924/products/Thumbs_Up_Hand_Sign_Emoji_large.png?v=1480481047";
    color = 0x00ff3b;
    footer = "⭐ Ganaste en " + turns + " turnos ⭐ Ganaste 25 monedas de oro y 2 de experiencia!"
    userdata.money += 25;
    userdata.experience += 2;
  } else if(won == 1){
    thumb = "https://cdn.shopify.com/s/files/1/1061/1924/products/White_Thumbs_Down_Sign_Emoji_large.png?v=1480481028";
    color = 0xff0000;
    footer = "💩 Perdiste en " + turns + " turnos 💩 No ganaste oro ni experiencia."
  } else if(won == 2){
    thumb = "https://www.emoji.co.uk/files/phantom-open-emojis/smileys-people-phantom/12305-raised-hand.png";
    color = 0xffff00;
    footer = "🤔 Empataste en " + turns + " turnos 🤔" + " Ganaste 5 monedas de oro y 1 de experiencia.";
    userdata.money += 5;
    userdata.experience += 1;
  }

  if(userdata.experience >= userdata.maxexperience){
    userdata.experience -= userdata.maxexperience;
    userdata.maxexperience *= 2;
    userdata.level++;

    userdata.health = Math.floor(userdata.health * 1.5);
  }

  client.setScore.run(userdata);


  //Se ve como el culo en fono
  const embed = new Discord.RichEmbed()
      .setAuthor(message.author.username + " va a pelear!", message.author.avatarURL)
      .setThumbnail(thumb)
      .addField("**Vos** Nivel " + userdata.level,
                "❤️ Vida ``" + tempHP + "hp``\n"
                + "⚔️ Ataque ``" + gear.Armas[userdata.weapon].minDamage + "ap``\n"
                + "🛡️ Defensa ``" + gear.Armor[userdata.armor].defense + "dp``", true)
      .addField(monster.icon + "**" + monster.name + "** Nivel " + lv,
                "❤️ Vida ``" + monster.health + "hp``\n"
                + "⚔️ Ataque ``" + monster.minAttack + "ap``\n"
                + "🛡️ Defensa ``" + monster.defense + "dp``", true)
      .setFooter(footer)
      .setColor(color);

  return message.channel.send({embed});
}

levelMonster = (m, l) => {
  if(l != 1){
    m.attack = (Math.floor(m.attack * 1.15)) * (l-1);
    m.defense = (Math.floor(m.defense * 1.2)) * (l-1);
    m.health = (Math.floor(m.health * 1.25)) * (l-1);
    m.minAttack = (Math.floor(m.minAttack * 1.15)) * (l-1);
    m.maxAttack = (Math.floor(m.maxAttack * 1.15)) * (l-1);

    if(m.minAttack < 2) { m.minAttack = 2 };
    if(m.maxAttack < 3) { m.maxAttack = 3 };
  }
}

playerAttack = (user) => {
  let damage;

  damage = getRandomInt(gear.Armas[user.weapon].minDamage, gear.Armas[user.weapon].maxDamage);

  console.log("Golpe de jugador: " + damage)
  return damage;
}

monsterAttack = (monster, user) => {
  let damage = 0;

  damage = getRandomInt(monster.minAttack, monster.maxAttack) - gear.Armor[user.armor].defense;

  console.log("Golpe de monstruo: " + damage)
  return damage;
}

shopFunction = (message, args) => {
  if(args[0] != null) { args[0] = args[0].toLowerCase() };

  if(!args || args.length == 0){
    //Menu inicial
    const embed = new Discord.RichEmbed()
      .setTitle("Tienda")
      .setThumbnail("https://banner2.kisspng.com/20180228/ave/kisspng-money-bag-coin-gold-gold-bag-5a97613ff15510.4535065515198702719885.jpg")
      .addField("Armas", "Para ver las armas usa /shop armas", true)
      .addField("Armadura", "Para ver las armaduras usa /shop armaduras", true)
      .setColor(0xffff00);
    return message.channel.send({embed});

  } else if(args[0] == "armas"){
    //Armas
    const embed = new Discord.RichEmbed()
      .setTitle("Tienda de Armas")
      .setThumbnail("https://banner2.kisspng.com/20180217/xqq/kisspng-bag-gold-coin-stock-photography-canvas-canvas-bag-gold-coins-5a87c13869a897.4157481615188462644328.jpg")
      .addField("👊Puño: 1 a 2 de daño, 0 de oro", "Compra con /comprar arma 0", true)
      .addField("💪Brazo Trabado: 2 a 4 de daño, 200 de oro", "Compra con /comprar arma 1", true)
      .addField("🌵Cactus del Dolor: 5 a 10 de daño, 2.5k de oro", "Compra con /comprar arma 2", true)
      .addField("🥖Baguette de hace una semana: 10 a 15 de daño, 7.5k de oro", "Compra con /comprar arma 3", true)
      .addField("🔪Tiro tiro tiro puñalada puñalada: 15 a 25 de daño, 20k de oro", "Compra con /comprar arma 4", true)
      .setColor(0xffff00);
    return message.channel.send({embed});

  } else if(args[0] == "armaduras"){
    //Armaduras
    const embed = new Discord.RichEmbed()
      .setTitle("Tienda de Armadura")
      .setThumbnail("https://banner2.kisspng.com/20180217/xqq/kisspng-bag-gold-coin-stock-photography-canvas-canvas-bag-gold-coins-5a87c13869a897.4157481615188462644328.jpg")
      .addField("👕Remera: 1 de defensa, 0 de oro", "Compra con /buy armadura 0", true)
      .addField("🧥Saco: 2 de defensa, 250 de oro", "Compra con /buy armadura 1", true)
      .addField("👔Camisa: 4 de defensa, 1.5k de oro", "Compra con /buy armadura 2", true)
      .addField("👘Kimono: 7 de defensa, 5k de oro", "Compra con /buy armadura 3", true)
      .addField("👙Bikini Sexy: 15 de defensa, 15k de oro", "Compra con /buy armadura 4", true)
      .setColor(0xffff00);
    return message.channel.send({embed});

  } else {
    message.channel.send("No entendí que parte de la tienda queres ver");
  }
}

buyFunction = (message, args) => {
  let userdata = client.getScore.get(message.author.id, message.guild.id);

  if(args[0] == "arma"){
    if(userdata.money >= gear.Armas[args[1]].price){
      userdata.weapon = args[1];
      userdata.money -= gear.Armas[args[1]].price;
      message.channel.send("Compraste " + gear.Armas[args[1]].name);
    } else {
      message.channel.send("No tienes suficiente oro para comprar este arma.");
    }
  } else if(args[0] == "armadura"){
    if(userdata.money >= gear.Armor[args[1]].price){
      userdata.armor = args[1];
      userdata.money -= gear.Armor[args[1]].price;
      message.channel.send("Compraste " + gear.Armor[args[1]].name);
    } else {
      message.channel.send("No tienes suficiente oro para comprar esta armadura.");
    }
  }
  client.setScore.run(userdata);
}

getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is exclusive and the minimum is inclusive
}

  client.login(config.token);