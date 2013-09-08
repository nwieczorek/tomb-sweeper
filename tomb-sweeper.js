const INPUT_MAZE_WIDTH = 6;
const INPUT_MAZE_HEIGHT = 6;
const TOMB_OFFSET_X = 10;
const TOMB_OFFSET_Y = 10;
const TILE_WIDTH = 32;
const TILE_HEIGHT = 32;

const STATE_LOADING = 'loading';
const STATE_PLAYING = 'playing';


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

   var tombTileSheet = new Image();
   var characterTileSheet = new Image();
   var counter = 0;

   var appState = STATE_LOADING;
   var hoverPt = new Point(-1,-1);
   var theText = "unclicked";

   var tilesLoaded = 0;
   const NUMBER_OF_TILESHEETS = 2;
   tombTileSheet.addEventListener('load',eventSheetLoaded, false);
   tombTileSheet.src="resources/tomb-tiles.png";

   characterTileSheet.addEventListener('load',eventSheetLoaded,false);
   characterTileSheet.src="resources/character-tiles.png";

   var iMaze = new InputMaze(INPUT_MAZE_WIDTH,INPUT_MAZE_HEIGHT);
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
      tilesLoaded++;
   }


   function gameLoop(){
      window.setTimeout(gameLoop, 100);
      switch (appState){
         case STATE_LOADING:
            if (tilesLoaded >= NUMBER_OF_TILESHEETS){
               appState = STATE_PLAYING;
            }
            break;
         case STATE_PLAYING:
            drawScreen();
            break;
      }
   }


   gameLoop();

   function cellToActual( pt){
      return new Point( (pt.x * TILE_WIDTH) + TOMB_OFFSET_X, (pt.y * TILE_HEIGHT) + TOMB_OFFSET_Y);
   }

   function drawCharacter( character,cell){
      var actual = cellToActual(cell); 
      context.drawImage( characterTileSheet, character.tileOnSheet.x * TILE_WIDTH, character.tileOnSheet.y * TILE_HEIGHT,
            TILE_WIDTH, TILE_HEIGHT,
            actual.x, actual.y, TILE_WIDTH, TILE_HEIGHT);
   }

   function drawScreen() {
      var x, y, posX, posY, tileRow, tileCol;
      context.fillStyle = '#aaaaaa';
      context.fillRect(0,0, theCanvas.width, theCanvas.height);

      warrior = makeWarrior();
      for (y = 0; y < tomb.height; y++){
         for (x = 0; x < tomb.width; x++){
            tileRow = (tomb.cells[y][x].contents == Tomb.WALL)? TILE_HEIGHT : 0;
            var actual = cellToActual( new Point(x,y));
            tileCol = 0;
            context.drawImage(tombTileSheet, tileCol, tileRow, TILE_WIDTH, TILE_HEIGHT,actual.x,actual.y,TILE_WIDTH,TILE_HEIGHT);
         }
      }

      if (tomb.isValid(hoverPt)){
         log("drawing hover: " + hoverPt);
         var actual = cellToActual( hoverPt);
         context.drawImage(tombTileSheet, 3 * 32, 0, TILE_WIDTH, TILE_HEIGHT,actual.x,actual.y,TILE_WIDTH,TILE_HEIGHT);
      }

      drawCharacter( warrior, hoverPt);

      context.fillStyle = '#000000';
      context.font = '20px sans-serif';
      context.textBaseline = 'top';
      context.fillText(theText, 400, 0);
         

   }
}
