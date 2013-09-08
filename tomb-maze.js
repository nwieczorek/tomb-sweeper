
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
