const TOMB_OFFSET_X = 10;
const TOMB_OFFSET_Y = 10;
const TILE_WIDTH = 32;
const TILE_HEIGHT = 32;

const STATE_LOADING = 'loading';
const STATE_PLAYING = 'playing';

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

   Tomb.prototype.isValid = function(pt){
      return (pt.x >= 0 && pt.x < this.width && pt.y >= 0 && pt.y < this.height);
   }

   Tomb.EMPTY = 0;
   Tomb.WALL = 1;

//---- END CLASSES --------------------------------------------------
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

   var appState = STATE_LOADING;
   var hoverPt = new Point(-1,-1);
   var theText = "unclicked";

   var tilesLoaded = false;
   tileSheet.addEventListener('load',eventSheetLoaded, false);
   tileSheet.src="resources/tomb-tiles.png";

   var iMaze = new InputMaze(5,5);
   iMaze.print();


   var tomb = new Tomb( iMaze);

   /*---------------------------------------------------------------
    */

   function onMouseMove(e){
      var mouseX;
      var mouseY;
      var gridX,gridY;
      mouseX = e.offsetX - theCanvas.offsetLeft;
      gridX = Math.floor((mouseX - TOMB_OFFSET_X) / TILE_WIDTH);
      mouseY = e.offsetY - theCanvas.offsetTop;
      gridY = Math.floor((mouseY - TOMB_OFFSET_Y) / TILE_HEIGHT);
      theText = "hovered " + gridX + "," + gridY + " (" + mouseX + "," + mouseY; + ")";
      hoverPt.x = gridX;
      hoverPt.y = gridY;

   }

   function onMouseClick(e){
      theText = "clicked " + mouseX + "," + mouseY;
   }

   function eventSheetLoaded() {
      tilesLoaded =true;
   }


   function gameLoop(){
      window.setTimeout(gameLoop, 100);
      switch (appState){
         case STATE_LOADING:
            if (tilesLoaded){
               appState = STATE_PLAYING;
            }
            break;
         case STATE_PLAYING:
            drawScreen();
            break;
      }
   }


   gameLoop();

   function drawScreen() {
      var x, y, posX, posY, tileRow, tileCol;
      context.fillStyle = '#aaaaaa';
      context.fillRect(0,0, theCanvas.width, theCanvas.height);

      for (y = 0; y < tomb.height; y++){
         for (x = 0; x < tomb.width; x++){
            tileRow = (tomb.cells[y][x].contents == Tomb.WALL)? TILE_HEIGHT : 0;
            posX = (x * TILE_WIDTH) + TOMB_OFFSET_X;
            posY = (y * TILE_WIDTH) + TOMB_OFFSET_Y;
            tileCol = 0;
            context.drawImage(tileSheet, tileCol, tileRow, TILE_WIDTH, TILE_HEIGHT,posX,posY,TILE_WIDTH,TILE_HEIGHT);
         }
      }

      if (tomb.isValid(hoverPt)){
         log("drawing hover: " + hoverPt);
         posX = (hoverPt.x * TILE_WIDTH) + TOMB_OFFSET_X;
         posY = (hoverPt.y * TILE_WIDTH) + TOMB_OFFSET_Y;
         context.drawImage(tileSheet, 3 * 32, 0, TILE_WIDTH, TILE_HEIGHT,posX,posY,TILE_WIDTH,TILE_HEIGHT);
      }

      context.fillStyle = '#000000';
      context.font = '20px sans-serif';
      context.textBaseline = 'top';
      context.fillText(theText, 400, 0);
         

   }
}
