
function log(message){
   try{
      console.log(message);
   } catch (exception){
      return;
   }
}
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function randomArrayItem(array){
   var len = array.length;
   var idx = Math.floor( Math.random() * len);
   return array[idx];
}

function getMousePos(canvas, evt){
   var rect = canvas.getBoundingClientRect();
   return new Point(  evt.clientX - rect.left, evt.clientY - rect.top);
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

Point.prototype.copy = function(){
   return new Point( this.x, this.y);
}

Point.prototype.add = function(other){
   return new Point( this.x + other.x, this.y + other.y);
}

Point.prototype.multiply = function( scalar){
   return new Point( this.x * scalar, this.y * scalar);
}

Point.prototype.equals = function(other){
   return this.x == other.x && this.y == other.y;
}

Point.UP = new Point(0,-1);
Point.DOWN = new Point(0,1);
Point.LEFT = new Point(-1,0);
Point.RIGHT = new Point(1,0);
Point.ORTHOGONAL = [ Point.UP, Point.RIGHT, Point.DOWN, Point.LEFT];

Point.getDirection = function( origin, target){
   if (target.x == origin.x){
      if (target.y < origin.y){
         return Point.UP;
      } else if (target.y > origin.y){
         return Point.DOWN;
      }
   }else if (target.y == origin.y){
      if (target.x < origin.x){
         return Point.LEFT;
      }else if (target.x > origin.x){
         return Point.RIGHT;
      }
   }
   return null;
}
Point.getDistance = function( origin, target){
   return Math.abs( origin.x - target.x) + Math.abs(origin.y - target.y);
}

