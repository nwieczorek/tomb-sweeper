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
   var line, cell;
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
   this.contents = null;
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
TombCell.EMPTY = 0;
TombCell.WALL = 1;

TombCell.EMPTY_TILES =  [ new Point(0,0), new Point(1,0), new Point(2,0) ];
TombCell.WALL_TILES = [ new Point(0,1), new Point(1,1), new Point(2,1) ];

/*---------------------------------------------------------------
 * Tomb class
 */
function Tomb( inputMaze){
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
}

Tomb.prototype.addCharacters = function(){
   var mid = new Point( Math.floor(this.width / 2), Math.floor(this.height / 2) );
   var odd_mid = new Point( mid.x % 2 == 0 ? mid.x - 1 : mid.x,
                            mid.y % 2 == 0 ? mid.y - 1 : mid.y);
   this.cells[odd_mid.y][odd_mid.x].contents = makeWarrior();

}

Tomb.prototype.isValid = function(pt){
   return (pt.x >= 0 && pt.x < this.width && pt.y >= 0 && pt.y < this.height);
}

Tomb.prototype.getCell = function(x,y){
   return this.cells[y][x];
}
