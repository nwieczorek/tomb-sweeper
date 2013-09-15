
window.addEventListener('load', eventWindowLoaded, false);
function eventWindowLoaded() {
   canvasApp();
}
function canvasSupport () {
   return Modernizr.canvas;
}

function canvasApp() {
   'use strict';
   var INITIAL_INPUT_MAZE_WIDTH = 5;
   var INITIAL_INPUT_MAZE_HEIGHT = 5;
   var ANIMATION_SPEED = 9;
   var TILE_SIZE = new Point( 32, 32);
   var BORDER_OFFSET = new Point(10,10);
   var TOMB_OFFSET = TILE_SIZE.add(BORDER_OFFSET)  ;

   /*
    * 0-3 are stored as the number
    * 9 is used for 3+
    * 100 is used for unknown
    */
   var NUMBER_TILES = { 1: new Point(0,6),
      2: new Point(1,6), 3: new Point(2,6),
      9: new Point(3,6), 100: new Point(4,6),
      0: new Point(5,6)};

   var TILE_DRAW_SIZE = new Point(32,32);
   var HOVER_TILE = new Point(0,2);
   var BORDER_TILE = new Point(3,1);
   var KEY_TILE = new Point(0,4);
   var SELECTED_TILE = new Point(1,2);
   var ACTION_TILE = new Point(2,2);
   var NO_ACTION_TILE = new Point(3,2);

   var HIDDEN_TILE = new Point(0,3);
   var STATE_LOADING = 'loading';
   var STATE_PLAYING = 'playing';
   var STATE_ACTION = 'animation';

   var theCanvas;
   var context;

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
      'use strict';
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
    * VisitTracker class
    * Track which rows/columns are revealed
    */

   function VisitTracker (width ,height){
      'use strict';
      this.width = width;
      this.height = height;
      this.cols = [];
      this.rows = [];
      for (var i = 0; i < width; i++){
         this.cols.push( false);
      }
      for (var i = 0; i < height; i++){
         this.rows.push( false);
      }
   }

   VisitTracker.prototype.visit = function(pt){
      'use strict';
      this.rows[pt.y] = true;
      this.cols[pt.x] = true;
   }
   VisitTracker.prototype.hasRow = function( r){
      return this.rows[r];
   }
   VisitTracker.prototype.hasCol = function(c){
      return this.cols[c];
   }


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
   var NUMBER_OF_TILESHEETS = 2;
   tombTileSheet.addEventListener('load',eventSheetLoaded, false);
   tombTileSheet.src="resources/tomb-tiles.png";

   characterTileSheet.addEventListener('load',eventSheetLoaded,false);
   characterTileSheet.src="resources/character-tiles.png";

  
   var tomb;
   var level = 1;
   var visited;
   var playerKeys;

   rebuildMaze(0);

   /*---------------------------------------------------------------------------
    */
   function rebuildMaze( size_increase ){
      'use strict';
      var iMaze = new InputMaze(INITIAL_INPUT_MAZE_WIDTH + size_increase,
                              INITIAL_INPUT_MAZE_HEIGHT + size_increase);

      tomb = new Tomb( iMaze, level);
      visited = new VisitTracker( tomb.width,tomb.height);
      var pcells = tomb.getPlayerCells();
      setSelected(pcells[0]);
      visited.visit( pcells[0]);

      playerKeys = 0;
   }

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
               setSelected(cell);
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


   function setSelected( cell){
      selectedPt = cell;
      selectedPaths = tomb.getPaths(cell);
   }


   function move( sourceCell, targetCell){
      targetCell.character = sourceCell.character;
      sourceCell.character = null;
      setSelected(targetCell);
      visited.visit(targetCell);
      if (targetCell.key){
         targetCell.key = false;
         playerKeys++;
      }
   }
   function handleAction(){
      if (currentAction == null && actionQueue.length > 0){
         currentAction = actionQueue.shift();
         //log('current action now ' + currentAction);
      }
      if (currentAction != null){
         //log('stepping ' + currentAction);
         currentAction.step(); 
         if (currentAction.complete()){
            //log('moving for ' + currentAction);
            var sourceCell = tomb.getCell( currentAction.sourcePt.x, currentAction.sourcePt.y); 
            if (sourceCell && sourceCell.character){
               var targetCell = tomb.getCell( currentAction.targetPt.x, currentAction.targetPt.y);
               if (targetCell){
                  //Move the character from source into target
                  move(sourceCell, targetCell);
               }
            }
            currentAction = null;
         }
      }else if (actionQueue.length == 0){
         //log('reverting state');
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


   function draw( tileSheet, tileCoord, actual){
      context.drawImage(tileSheet, tileCoord.x * TILE_SIZE.x, tileCoord.y * TILE_SIZE.y,
            TILE_SIZE.x, TILE_SIZE.y,
            actual.x, actual.y,
            TILE_DRAW_SIZE.x, TILE_DRAW_SIZE.y);
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
         draw( characterTileSheet, character.tileOnSheet, actual);
      }
   }

   function drawKey(cell){
      var actual = cellToActual(cell); 
      draw(tombTileSheet, KEY_TILE, actual);
   }

   function drawBorder(){
      var width = tomb.width + 2;
      var height= tomb.height + 2;
      function borderCellToActual( pt){
         return new Point( (pt.x * TILE_SIZE.x) + BORDER_OFFSET.x, 
               (pt.y * TILE_SIZE.y) + BORDER_OFFSET.y);
      }
      for (var x = 0; x < width; x++){
         for (var y = 0; y < height; y++){
            if (x == 0 || x == (width - 1) || y == 0 || y == (height - 1)){
               var pt = new Point(x,y);
               var actual = borderCellToActual(pt);
               draw(tombTileSheet, BORDER_TILE, actual);
               
               //draw indicators along side
               if (x == 0 && y > 0 && y < (height - 1)){
                  var rowToShow = y - 1;
                  var indicator = 100;
                  if (visited.hasRow( rowToShow)){
                     indicator = 2;
                  }
                  draw(tombTileSheet, NUMBER_TILES[indicator], actual);    
               //draw indicators along top
               }else if (y == 0 && x > 0 && x < (width - 1)){
                  var colToShow = x - 1;
                  var indicator = 100;
                  if (visited.hasCol(colToShow)){
                     indicator = 3;
                  }
                  draw(tombTileSheet, NUMBER_TILES[indicator], actual);    
               }
            }
         }
      }
      //draw keys found
      for (var i = 0 ; i < playerKeys; i++){
         var pt = new Point( i + 1, height - 1);
         var actual = borderCellToActual(pt);
         draw(tombTileSheet, KEY_TILE, actual);
      }
   }

   function drawCell( cell){
      var actual = cellToActual(cell); 
      var tileOnSheet = cell.tileOnSheet();
      draw(tombTileSheet, tileOnSheet, actual);
      if (cell.key){
         drawKey(cell);
      }

   }


   function drawHover(){
      'use strict';
      var tile = null;
      if (tomb.isValid(hoverPt)){
         var actual = cellToActual( hoverPt);
         var pathKey = hoverPt.toString();
         if (tomb.isValid(selectedPt)){
            if (selectedPaths &&
                  selectedPaths.hasOwnProperty(pathKey) ){
               tile = HOVER_TILE;
            }
         }
         if (tile != null){
            draw(tombTileSheet, tile, actual);
         }
      }
   }

   function drawSelected(){
      if (tomb.isValid( selectedPt)){
         var actual = cellToActual(selectedPt);
         draw(tombTileSheet, SELECTED_TILE, actual);
      }
   }

   function drawScreen() {
      var x, y, posX, posY, tileRow, tileCol;
      context.fillStyle = '#aaaaaa';
      context.fillRect(0,0, theCanvas.width, theCanvas.height);

      drawBorder();

      tomb.forEach( drawCell);
      tomb.forEach( drawCharacter);

      drawHover();
      //drawSelected();

   }
}
