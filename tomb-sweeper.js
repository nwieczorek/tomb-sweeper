
window.addEventListener('load', eventWindowLoaded, false);
function eventWindowLoaded() {
   canvasApp();
}
function canvasSupport () {
   return Modernizr.canvas;
}

function canvasApp() {

   const INPUT_MAZE_WIDTH = 6;
   const INPUT_MAZE_HEIGHT = 6;
   const ANIMATION_SPEED = 6;
   const TOMB_OFFSET = new Point(10,10);
   const TILE_SIZE = new Point( 32, 32);
   const TILE_DRAW_SIZE = new Point(32,32);
   const HOVER_TILE = new Point(0,2);
   const SELECTED_TILE = new Point(1,2);
   const ACTION_TILE = new Point(2,2);
   const NO_ACTION_TILE = new Point(3,2);

   const HIDDEN_TILE = new Point(0,3);
   const STATE_LOADING = 'loading';
   const STATE_PLAYING = 'playing';
   const STATE_ACTION = 'animation';

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
   var selectedPt = new Point(-1,-1);
   var selectedPaths = null;

   var actionQueue = [];
   var currentAction = null;

   var tilesLoaded = 0;
   const NUMBER_OF_TILESHEETS = 2;
   tombTileSheet.addEventListener('load',eventSheetLoaded, false);
   tombTileSheet.src="resources/tomb-tiles.png";

   characterTileSheet.addEventListener('load',eventSheetLoaded,false);
   characterTileSheet.src="resources/character-tiles.png";

   var iMaze = new InputMaze(INPUT_MAZE_WIDTH,INPUT_MAZE_HEIGHT);
   //iMaze.print();


   var tomb = new Tomb( iMaze);
   
   /*---------------------------------------------------------------------------
    * Action class 
    */
   function Action( sourcePt, targetPt, character){
      'use strict';
      this.sourcePt = sourcePt;
      this.targetPt = targetPt;
      this.character = character;
      this.sourceActualPt = cellToActual(sourcePt);
      this.targetActualPt = cellToActual(targetPt);
      this.direction = Point.getDirection(sourcePt,targetPt);
      this.stepPt = this.direction.multiply( ANIMATION_SPEED);
      this.currentPt = this.sourceActualPt.copy();
   }

   Action.prototype.step = function(){
      if (this.direction){
         this.currentPt = this.currentPt.add( this.stepPt);
         if ( (this.direction == Point.UP && this.currentPt.y < this.targetActualPt.y) ||
               (this.direction == Point.DOWN && this.currentPt.y > this.targetActualPt.y) ||
               (this.direction == Point.LEFT && this.currentPt.x < this.targetActualPt.x) ||
               (this.direction == Point.RIGHT && this.currentPt.x > this.targetActualPt.x)){
            this.currentPt = this.targetActualPt;
            this.direction = null;
         }
      }
   }

   Action.prototype.complete = function(){
      return !(this.direction)
   }
   Action.prototype.toString = function(){
      return '[Action: ' + this.sourcePt + ' to ' + this.targetPt + ',' + this.currentPt + ']';
   }


   /*---------------------------------------------------------------------------
    */
   function onMouseMove(e){
      var pos = getMousePos(theCanvas,e);
      var cell =actualToCell(pos); 
      hoverPt.x = cell.x
      hoverPt.y = cell.y;

   }

   function onMouseClick(e){
      if (appState == STATE_PLAYING){
         var pos = getMousePos(theCanvas,e);
         var cellPt = actualToCell(pos);
         var cell;
         if (tomb.isValid(cellPt)){
            cell = tomb.getCell(cellPt.x,cellPt.y);
            if (cell.character != null && cell.character.isPlayerControlled()){
               selectedPt = cell;
               selectedPaths = tomb.getPaths(cell);
            }else if (selectedPt && selectedPaths){
               var pathKey = cellPt.toString();
               if (selectedPaths.hasOwnProperty(pathKey) ){
                  var path = selectedPaths[pathKey];
                  var lastPt = selectedPt;
                  for( var i = 0; i < path.length; i++){
                     var a = new Action( lastPt, path[i], selectedPt.character);
                     actionQueue.push(a);
                     lastPt = path[i];
                  }

                  selectedPt = null;
               }
            }
         }
       }
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
            if (actionQueue.length > 0){
               appState = STATE_ACTION;
            }
            drawScreen();
            break;
         case STATE_ACTION:
            handleAction();
            drawScreen();
            break;
      }
   }
   gameLoop();


   function handleAction(){
      if (currentAction == null && actionQueue.length > 0){
         currentAction = actionQueue.shift();
         log('current action now ' + currentAction);
      }
      if (currentAction != null && currentAction.complete()){
         log('moving for ' + currentAction);
         var sourceCell = tomb.getCell( currentAction.sourcePt.x, currentAction.sourcePt.y); 
         if (sourceCell && sourceCell.character){
            var targetCell = tomb.getCell( currentAction.targetPt.x, currentAction.targetPt.y);
            if (targetCell){
               //Move the character from source into target
               targetCell.character = sourceCell.character;
               sourceCell.character = null;
            }
         }
         currentAction = null;
      } else if (currentAction != null){
         log('stepping ' + currentAction);
         currentAction.step(); 
      }else if (actionQueue.length == 0){
         log('reverting state');
         appState = STATE_PLAYING;
      }
   }

   function cellToActual( pt){
      return new Point( (pt.x * TILE_SIZE.x) + TOMB_OFFSET.x, (pt.y * TILE_SIZE.y) + TOMB_OFFSET.y);
   }

   function actualToCell(pt){
      return new Point( Math.floor((pt.x - TOMB_OFFSET.x) / TILE_SIZE.x),
            Math.floor((pt.y - TOMB_OFFSET.y) / TILE_SIZE.y));
   }

   function drawCharacter( cell){
      var character = cell.character;
      if (character){
         var actual = cellToActual(cell); 
         //if (currentAction){
         //log( 'Character ' + character + ',' + currentAction.character);
        // }
         if (currentAction && currentAction.character == character ){
            actual = currentAction.currentPt;
         }
         context.drawImage( characterTileSheet, character.tileOnSheet.x * TILE_SIZE.x, 
               character.tileOnSheet.y * TILE_SIZE.y,
               TILE_SIZE.x, TILE_SIZE.y,
               actual.x, actual.y, TILE_DRAW_SIZE.x, TILE_DRAW_SIZE.y);
      }
   }

   function drawCell( cell){
      var actual = cellToActual(cell); 
      var tileOnSheet = cell.tileOnSheet();
      context.drawImage(tombTileSheet, tileOnSheet.x * TILE_SIZE.x, 
            tileOnSheet.y * TILE_SIZE.y, 
            TILE_SIZE.x, TILE_SIZE.y,actual.x,actual.y,
            TILE_DRAW_SIZE.x,TILE_DRAW_SIZE.y);

   }


   function drawHover(){
      'use strict';
      var tile;
      if (tomb.isValid(hoverPt)){
         var actual = cellToActual( hoverPt);
         var pathKey = hoverPt.toString();
         if (tomb.isValid(selectedPt)){
            if (selectedPaths &&
                  selectedPaths.hasOwnProperty(pathKey) ){
               tile = ACTION_TILE;
            }else {
               tile = NO_ACTION_TILE;
            }
         }else{
               tile = HOVER_TILE;
         }
         context.drawImage(tombTileSheet, tile.x * TILE_SIZE.x, tile.y * TILE_SIZE.y, 
               TILE_SIZE.x, TILE_SIZE.y,actual.x,actual.y,
               TILE_SIZE.x,TILE_SIZE.y);
      }
   }

   function drawSelected(){
      if (tomb.isValid( selectedPt)){
         var actual = cellToActual(selectedPt);
         context.drawImage(tombTileSheet, SELECTED_TILE.x * TILE_SIZE.x, SELECTED_TILE.y * TILE_SIZE.y, 
               TILE_SIZE.x, TILE_SIZE.y,actual.x,actual.y,
               TILE_SIZE.x,TILE_SIZE.y);
      }
   }

   function drawScreen() {
      var x, y, posX, posY, tileRow, tileCol;
      context.fillStyle = '#aaaaaa';
      context.fillRect(0,0, theCanvas.width, theCanvas.height);

      tomb.forEach( drawCell);
      tomb.forEach( drawCharacter);

      drawHover();
      drawSelected();

   }
}
