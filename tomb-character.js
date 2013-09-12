

/*---------------------------------------------------------------
 * Character class
 */
function Character(name, movement, health, tileOnSheet, playerControlled ){
   this.name = name;
   this.movement = movement;
   this.health = health;
   this.tileOnSheet = tileOnSheet;
   this.playerControlled = playerControlled;
}

Character.prototype.isPlayerControlled = function(){
   return this.playerControlled;
}

Character.prototype.toString = function(){
   return "[" + this.name + "]";
}


function makeWarrior(){
   return new Character('Warrior',3,3,new Point(0,0),true);
}

function makeSorcerer(){
   return new Character('Sorcerer',3,2,new Point(0,1),true);
}
function makeElf(){
   return new Character('Elf',3,2,new Point(0,2),true);
}
function makeRogue(){
   return new Character('Rogue',3,2,new Point(0,3),true);
}


function makeDemon(){
   return new Character('Demon',3,5,new Point(0,4),false);
}
