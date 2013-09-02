
function log(message){
   try{
      console.log(message);
   } catch (exception){
      return;
   }
}

window.addEventListener('load', eventWindowLoaded, false);
function eventWindowLoaded() {
   canvasApp();
}
function canvasSupport () {
   return Modernizr.canvas;
}

function canvasApp() {
   var theCanvas;
   var context;
   if (!canvasSupport()) {
      return;
   }
   else {
      theCanvas = document.getElementById("canvas");
      context = theCanvas.getContext("2d");
   }

   theCanvas.addEventListener("mousemove",onMouseMove, false);
   theCanvas.addEventListener("click",onMouseClick,false);

   var tileSheet = new Image();
   var counter = 0;

   var mouseX;
   var mouseY;
   var theText = "unclicked";

   tileSheet.addEventListener('load',eventSheetLoaded, false);
   tileSheet.src="resources/tomb-tiles.png";

   function shuffleArray(array) {
       for (var i = array.length - 1; i > 0; i--) {
           var j = Math.floor(Math.random() * (i + 1));
           var temp = array[i];
           array[i] = array[j];
           array[j] = temp;
       }
       return array;
   }




   /*---------------------------------------------------------------
    * Point class
    */
   function Point(x,y){
      this.x = x;
      this.y = y;
   }
   Point.prototype.toString = function(){
      return "(" + this.x + "," + this.y + ")";
   }
   Point.prototype.adjacent = function(other){
      return (((this.x == other.x) && ((this.y + 1 == other.y) || (this.y - 1 == other.y))) || 
               ((this.y == other.y) && ((this.x + 1 == other.x) || (this.x - 1 == other.x))));
   }

   Point.prototype.add = function(other){
      return new Point( this.x + other.x, this.y + other.y);
   }

   Point.prototype.equal = function(other){
      return this.x == other.x && this.y == other.y;
   }

   Point.UP = new Point(0,-1);
   Point.DOWN = new Point(0,1);
   Point.LEFT = new Point(-1,0);
   Point.RIGHT = new Point(1,0);


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

   InputMaze.prototype.isValid = function(pt){
      return (pt.x >= 0 && pt.x < this.width && pt.y >= 0 && pt.y < this.height);
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
            line += (cell.bottom) ? "." : "_";
         }
         log(y + ":" + line);
      }
   }


   var iMaze = new InputMaze(5,5);
   iMaze.print();

   /*---------------------------------------------------------------
    * TombCell class
    */
   function TombCell(x,y){
      Point.call(this,x,y);
      this.contents = Tomb.EMPTY;
   }
   TombCell.prototype = Object.create(Point.prototype);
   TombCell.prototype.constructor = TombCell;


   /*---------------------------------------------------------------
    * Tomb class
    */
   function Tomb( inputMaze){
      var x,y,iy,ix,cellRow;
      this.width = (inputMaze.width * 2) + 1;
      this.height = (inputMaze.height * 2) + 1;
      this.cells = []

      for (y = 0; y < this.height; y++){
         cellRow = [];
         for (x = 0; x < this.width; x++){
            cell = new TombCell(x,y);
            if (x == 0 || x == (inputMaze.width * 2) || y == 0 || y == (inputMaze.height * 2)){
               cell.contents = Tomb.WALL;
            }else if ((x % 2) == 1 && (y % 2) == 1){
               null;
            }else if ((x % 2) == 1 && (y % 2) == 0){
               iy = (y - 2) / 2;
               ix = (x - 1) / 2;
               if (!(inputMaze.cells[iy][ix].down)){
                  cell.contents = Tomb.WALL;
               }
            }else if ((x % 2) == 0 && (y % 2) == 1){
               iy = (y - 1) / 2;
               ix = (x - 2) / 2;
               if (!(inputMaze.cells[iy][ix].right)){
                  cell.contents = Tomb.WALL;
               }
            }else {
               cell.contents = Tomb.WALL;
            }
            cellRow.push(cell);
         }
         this.cells.push( cellRow);
      }
   }

   Tomb.EMPTY = 0;
   Tomb.WALL = 1;


   var tomb = new Tomb( iMaze);

   /*---------------------------------------------------------------
    */

   function onMouseMove(e){
      mouseX = e.clientX - theCanvas.offsetLeft;
      mouseY = e.clientY - theCanvas.offsetTop;
   }

   function onMouseClick(e){
      theText = "clicked " + mouseX + "," + mouseY;
   }

   function eventSheetLoaded() {
      startUp();
   }

   function startUp(){
      gameLoop();
   }

   function gameLoop(){
      window.setTimeout(gameLoop, 100);
      drawScreen();
   }



   function drawScreen() {
      var x, y, posX, posY, tileRow, tileCol;
      context.fillStyle = '#aaaaaa';
      context.fillRect(0,0, theCanvas.width, theCanvas.height);

      for (y = 0; y < tomb.height; y++){
         for (x = 0; x < tomb.width; x++){
            tileRow = (tomb.cells[y][x].contents == Tomb.WALL)? 32 : 0;
            posX = x * 32;
            posY = y * 32;
            tileCol = 0;
            context.drawImage(tileSheet, tileCol, tileRow, 32, 32,posX,posY,32,32);
         }
      }



      context.fillStyle = '#000000';
      context.font = '20px sans-serif';
      context.textBaseline = 'top';
      context.fillText(theText, 400, 0);
         

   }
}
