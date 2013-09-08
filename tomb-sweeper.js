const INPUT_MAZE_WIDTH = 6;
const INPUT_MAZE_HEIGHT = 6;
const TOMB_OFFSET = new Point(10,10);
const TILE_SIZE = new Point( 32, 32);

const STATE_LOADING = 'loading';
const STATE_PLAYING = 'playing';




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
      var pos = getMousePos(theCanvas,e);
      var cell =actualToCell(pos); 
      theText = "hovered " + pos + "=" + cell; 
      hoverPt.x = cell.x
      hoverPt.y = cell.y;

   }

   function onMouseClick(e){
      var pos = getMousePos(theCanvas,e);
      log("Clicked " + pos + "=" + actualToCell(pos));
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
      return new Point( (pt.x * TILE_SIZE.x) + TOMB_OFFSET.x, (pt.y * TILE_SIZE.y) + TOMB_OFFSET.y);
   }

   function actualToCell(pt){
      return new Point( Math.floor((pt.x - TOMB_OFFSET.x) / TILE_SIZE.x),
            Math.floor((pt.y - TOMB_OFFSET.y) / TILE_SIZE.y));
   }

   function drawCharacter( character,cell){
      var actual = cellToActual(cell); 
      context.drawImage( characterTileSheet, character.tileOnSheet.x * TILE_SIZE.x, 
            character.tileOnSheet.y * TILE_SIZE.y,
            TILE_SIZE.x, TILE_SIZE.y,
            actual.x, actual.y, TILE_SIZE.x, TILE_SIZE.y);
   }

   function drawCell( cell){
      var actual = cellToActual(cell); 
      var tileOnSheet = cell.tileOnSheet();
      context.drawImage(tombTileSheet, tileOnSheet.x * TILE_SIZE.x, 
            tileOnSheet.y * TILE_SIZE.y, 
            TILE_SIZE.x, TILE_SIZE.y,actual.x,actual.y,TILE_SIZE.x,TILE_SIZE.y);
      if (cell.contents != null){
         drawCharacter( cell.contents, cell);
      }
   }



   function drawScreen() {
      var x, y, posX, posY, tileRow, tileCol;
      context.fillStyle = '#aaaaaa';
      context.fillRect(0,0, theCanvas.width, theCanvas.height);

      for (y = 0; y < tomb.height; y++){
         for (x = 0; x < tomb.width; x++){
            drawCell( tomb.getCell(x,y));
         }
      }

      if (tomb.isValid(hoverPt)){
         var actual = cellToActual( hoverPt);
         context.drawImage(tombTileSheet, 3 * 32, 0, TILE_SIZE.x, TILE_SIZE.y,actual.x,actual.y,TILE_SIZE.x,TILE_SIZE.y);
      }

      //drawCharacter( warrior, hoverPt);
      context.fillStyle = '#000000';
      context.font = '20px sans-serif';
      context.textBaseline = 'top';
      context.fillText(theText, 400, 0);
   }
}
