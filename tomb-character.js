

/*---------------------------------------------------------------
 * Character class
 */
function Character(name, movement, health, tileOnSheet ){
   this.name = name;
   this.movement = movement;
   this.health = health;
   this.tileOnSheet = tileOnSheet;
}


function makeWarrior(){
   return new Character('Warrior',3,3,new Point(0,0));
}

function makeSorcerer(){
   return new Character('Sorcerer',3,2,new Point(0,1));
}
function makeElf(){
   return new Character('Elf',3,2,new Point(0,2));
}
function makeRogue(){
   return new Character('Rogue',3,2,new Point(0,3));
}


function makeDemon(){
   return new Character('Demon',3,5,new Point(0,4));
}
