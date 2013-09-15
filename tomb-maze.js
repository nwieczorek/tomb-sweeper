/*---------------------------------------------------------------
 * InputPoint class
 */
function InputPoint(x,y){
   Point.call(this,x,y);
   this.right = null;
   this.down = null;
}
InputPoint.prototype = Object.create(Point.prototype);
InputPoint.prototype.constructor = InputPoint;


/*---------------------------------------------------------------
 * InputEdge class
 */
function InputEdge( cell, direction){
   this.cell = cell;
   this.direction = direction;
}

InputEdge.prototype.getOther = function(){
   return this.cell.add( this.direction);
}


/*---------------------------------------------------------------
 * InputMaze class
 */
function InputMaze( width, height){
   this.width = width;
   this.height = height;
   this.cells = [];
   this.initialize();
}

InputMaze.prototype.initialize = function(){
   'use strict';
   var x,y,cellRow;
   var edges = [];
   var connections = {};
   var cell, edge, cellB;

   function addConnection( cell){
      var key = cell.toString();
      if (!(key in connections)){
         connections[key] = {};
         connections[key][key] = true;
      }
   }

   function areConnected( cellA, cellB){
      var keyA = cellA.toString(), keyB = cellB.toString();
      //log("are connected " + keyA + "," + keyB);
      return keyB in connections[keyA] || keyA in connections[keyB];
   }

   function connect( cellA, cellB){
      var keyA = cellA.toString(), keyB = cellB.toString();
      for (var k in connections[keyB]){
         connections[keyA][k] = true;
      }
      connections[keyB] = connections[keyA];
   }

   //create the cells
   for (y = 0; y < this.height; y++){
      cellRow = [];
      for (x = 0; x < this.width; x++){
         cell = new InputPoint(x,y);
         addConnection(cell); 
         cellRow.push(cell);
      }
      this.cells.push( cellRow);
   }


   //initialize the edges -- the right and down connections
   for (y = 0; y < this.height; y++){
      for (x = 0; x < this.width; x++){
         cell = this.cells[y][x];
         if (x < (this.width - 1)){
            edges.push( new InputEdge(cell, Point.RIGHT));
         }
         if (y < (this.height - 1)){
            edges.push(new InputEdge(cell,Point.DOWN));
         }
      }
   }
   shuffleArray( edges);

   for (var i = 0, len = edges.length; i < len; i++){
      edge = edges[i];
      cellB = edge.getOther();
      if (!(areConnected(edge.cell, cellB))){
         connect(edge.cell, cellB);   
         if (edge.direction == Point.RIGHT){
            edge.cell.right = cellB;
         } else if (edge.direction == Point.DOWN){
            edge.cell.down = cellB;
         }
      }
   }
}


InputMaze.prototype.print = function(){
   'use strict';
   var line, cell, x, y;
   for (y = 0; y < this.height; y++){
      //print actual line
      line = "";
      for (x = 0; x < this.width; x++){
         cell = this.cells[y][x];
         line +=  "" + x; 
         line += (cell.right) ? "-" : "#";
         line += (cell.down) ? "." : "_";
      }
      log(y + ":" + line);
   }
}




/*---------------------------------------------------------------
 * TombCell class
 */
function TombCell(x,y){
   Point.call(this,x,y);
   this.structure = TombCell.EMPTY;
   this.character = null;
   this.key = false;
   this.revealed = false;
   this.tileSet = {};
   this.tileSet.empty = randomArrayItem(TombCell.EMPTY_TILES);
   this.tileSet.wall = randomArrayItem(TombCell.WALL_TILES);
}

TombCell.prototype = Object.create(Point.prototype);
TombCell.prototype.constructor = TombCell;

TombCell.prototype.tileOnSheet = function(){
   switch (this.structure){
      case TombCell.WALL:
         return this.tileSet.wall;
      default:
         return this.tileSet.empty;
   }
}

TombCell.prototype.toString = function(){
   return "[Cell:" + this.x + "," + this.y + "]";
}

TombCell.prototype.canPass = function() {
   return this.structure == TombCell.EMPTY && 
      (this.character == null || this.character.playerControlled);
}

TombCell.EMPTY = 0;
TombCell.WALL = 1;

TombCell.EMPTY_TILES =  [ new Point(0,0), new Point(1,0), new Point(2,0) ];
TombCell.WALL_TILES = [ new Point(0,1), new Point(1,1), new Point(2,1) ];

/*---------------------------------------------------------------
 * Tomb class
 */
function Tomb( inputMaze, level){
   'use strict';
   var x,y,iy,ix,cellRow;
   this.width = (inputMaze.width * 2) + 1;
   this.height = (inputMaze.height * 2) + 1;
   this.cells = [];
   var cell;

   for (y = 0; y < this.height; y++){
      cellRow = [];
      for (x = 0; x < this.width; x++){
         cell = new TombCell(x,y);
         //the outer border is all wall cells
         if (x == 0 || x == (inputMaze.width * 2) || y == 0 || y == (inputMaze.height * 2)){
            cell.structure = TombCell.WALL;
         //the odd/odd spaces are the open cells in the input maze
         }else if ((x % 2) == 1 && (y % 2) == 1){
            null;
         //for odd/even, look at the connection to the cell above
         }else if ((x % 2) == 1 && (y % 2) == 0){
            iy = (y - 2) / 2;
            ix = (x - 1) / 2;
            if (!(inputMaze.cells[iy][ix].down)){
               cell.structure = TombCell.WALL;
            }
         //for even/odd, look at the connection to the cell to the left
         }else if ((x % 2) == 0 && (y % 2) == 1){
            iy = (y - 1) / 2;
            ix = (x - 2) / 2;
            if (!(inputMaze.cells[iy][ix].right)){
               cell.structure = TombCell.WALL;
            }
         //otherwise it is a wall
         }else {
            cell.structure = TombCell.WALL;
         }
         cellRow.push(cell);
      }
      this.cells.push( cellRow);
   }

   this.addCharacters();
   this.addKeys();

   var demonsToAdd = level + 2;
   this.addDemons(demonsToAdd);
}
Tomb.NUMBER_OF_KEYS = 3;


Tomb.prototype.addCharacters = function(){
   'use strict';
   var mid = new Point( Math.floor(this.width / 2), Math.floor(this.height / 2) );
   var odd_mid = new Point( mid.x % 2 == 0 ? mid.x - 1 : mid.x,
                            mid.y % 2 == 0 ? mid.y - 1 : mid.y);
   var cell = this.cells[odd_mid.y][odd_mid.x];
   cell.character = makeWarrior();
}

Tomb.prototype.randomCell = function(){
   return new Point( Math.floor(Math.random() * (this.width - 1)) + 1, //random in range 1 to width - 1 
                        Math.floor( Math.random() * (this.height - 1)) + 1); //random in range 1 to height - 1
}

Tomb.prototype.addKeys = function(){
   var keys = [];
   while (keys.length < Tomb.NUMBER_OF_KEYS){
      var k = this.randomCell();
      var cell = this.getCell(k.x,k.y);
      if (cell.structure != TombCell.EMPTY || cell.character != null){
         continue;
      }
      var adj = this.getAdjacent(k);
      if (adj.some( function(c) { return (c.character != null); })){
         continue;
      }
      var matches = false;
      for (var i = 0, len = keys.length; i < len; i++){
         if (k.x == keys[i].x || k.y == keys[i].y){
            matches = true;
         }
      }
      if (matches){
         continue;
      }
      //key is good
      keys.push(k);
      cell.key = true;
   }
}

Tomb.prototype.addDemons = function( numToAdd){
   var numAdded = 0;
   while (numAdded < numToAdd){
      var k = this.randomCell();
      var cell = this.getCell(k.x,k.y);
      if (cell.structure != TombCell.EMPTY || cell.character != null || cell.key){
         continue;
      }
      var adj = this.getAdjacent(k);
      if (adj.some( function(c) { return (c.character != null); })){
         continue;
      }
      cell.character = makeDemon();
      numAdded++;
   }
}

/**************************
 * Return an object storing all possible paths as a dictionary where the keys
 * are the destination coordinates
 */
Tomb.prototype.getPaths = function(fromPt){
   'use strict';
   var fromCell = this.getCell(fromPt.x,fromPt.y);
   log(fromCell);
   if (fromCell.character == null){
      throw "getPaths called on null cell character";
   }

   var paths = {};
   var currentPaths, currentPath;

   function extendPath( tomb, pathToExtend, extendPt){
      var newPath;
      for (var d = 0; d < 4; d++){
         var direction = Point.ORTHOGONAL[d];
         var newPt = extendPt.add(direction);
         if (tomb.isValid(newPt)){
            var newCell = tomb.getCell(newPt.x,newPt.y);
            if (!paths.hasOwnProperty( newPt.toString()) &&
                  !newPt.equals(fromPt) &&
                  newCell.canPass()){
               newPath = pathToExtend.slice(0);
               newPath.push( newPt);
               //log('adding path for ' + newPt + ' length ' + newPath.length);
               paths[ newPt.toString() ] = newPath;
            }
         }
      }
   }

   for (var length = 1; length <= fromCell.character.movement; length ++){
      if (length == 1){
         extendPath(this, [], fromPt);
      }else {
         for (var k in paths){
            if (paths.hasOwnProperty(k)){
               currentPath = paths[k];
               var lastPt = currentPath[currentPath.length - 1];
               extendPath(this, currentPath, lastPt);
            }
         }
      }
   }
   return paths;
}

            


/**************************
 * Reveal the cells after character movement
 */
Tomb.prototype.reveal = function( fromCell){
   'use strict';
   var adj = this.getAdjacent(fromCell);
   for (var i = 0; i < adj.length; i++){
      adj[i].revealed = true;
      if (adj[i].character){
         adj[i].character.awake = true;
      }
   }
}

Tomb.prototype.isValid = function(pt){
   if (pt){
      return (pt.x >= 0 && pt.x < this.width && pt.y >= 0 && pt.y < this.height);
   }else{
      return false;
   }
}

Tomb.prototype.getCell = function(x,y){
   return this.cells[y][x];
}

Tomb.prototype.getAdjacent = function(iPt){
   'use strict';
   var adj = [];
   for (var x = -1; x <= 1; x++){
      for (var y = -1; y <= 1; y++){
         if (x != 0 || y != 0){
            var p = new Point( iPt.x + x, iPt.y + y);
            if (this.isValid( p)){
               adj.push( this.getCell(p.x,p.y));
            }
         }
      }
   }
   return adj;
}

Tomb.prototype.filter = function(f){
   'use strict';
   var result = [];
   for (var y = 0; y < this.height; y++){
      for (var x = 0; x < this.width; x++){
         var c = this.getCell(x,y);
         if (f(c)){
            result.push(c);
         }
      }
   }
   return result;
}

Tomb.prototype.filterRow = function(rowIndex, f){
   var result = [];
   for (var x = 0; x < this.width; x++){
      var c = this.getCell(x,rowIndex);
      if (f(c)){
         result.push(c);
      }
   }
   return result;
}

Tomb.prototype.filterColumn = function(colIndex, f){
   var result = [];
   for (var y = 0; y < this.height; y++){
      var c = this.getCell(colIndex,y);
      if (f(c)){
         result.push(c);
      }
   }
   return result;
}

Tomb.prototype.getPlayerCells = function(){
   return this.filter( function(c) { return c.character != null && c.character.playerControlled})
}
Tomb.prototype.getDemonCells = function(){
   return this.filter( function(c) { return c.character != null && !c.character.playerControlled})
}

Tomb.prototype.forEach = function(f){
   'use strict';
   for (var y = 0; y < this.height; y++){
      for (var x = 0; x < this.width; x++){
         f( this.getCell(x,y));
      }
   }
}
