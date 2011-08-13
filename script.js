var video;
var copy;
var copycanvas;
var draw;
 
var TILE_WIDTH = 32;
var TILE_HEIGHT = 24;
var TILE_CENTER_WIDTH = 16;
var TILE_CENTER_HEIGHT = 12;
var SOURCERECT = {x:0, y:0, width:0, height:0};
var PAINTRECT = {x:0, y:0, width:1000, height:600};
var blowUp = /blowup=absolutely/.test(location.href);

if(blowUp){
  var sourcevid = document.getElementById("sourcevid");
  var videoplayer = document.getElementById("videoplayer");
  var instructions = document.getElementById("instructions");
  instructions.style.display="block";
  // hide the video player when blowing stuff up
  videoplayer.style.display="none";
  sourcevid.play();
  init();
}
else{
  var play = document.getElementById("play");
  var pause = document.getElementById("pause");
  var controls = document.getElementById("controls");
  controls.style.display="block";
  var movie = document.getElementById("sourcevid");

  play.onclick = function(){
    if(movie.paused){
      movie.play();
    }
    return false;
  };
  pause.onclick = function(){
    if(!movie.paused)
    {
      movie.pause();
    }
    return false;
  };
}
 
function init(){
	video = document.getElementById('sourcevid');
	copycanvas = document.getElementById('sourcecopy');
	copy = copycanvas.getContext('2d');
	var outputcanvas = document.getElementById('output');
	draw = outputcanvas.getContext('2d');
	setInterval("processFrame()", 33);
}
function createTiles(){
	var offsetX = TILE_CENTER_WIDTH+(PAINTRECT.width-SOURCERECT.width)/2;
	var offsetY = TILE_CENTER_HEIGHT+(PAINTRECT.height-SOURCERECT.height)/2;
	var y=0;
	while(y < SOURCERECT.height){
		var x=0;
		while(x < SOURCERECT.width){
			var tile = new Tile();
			tile.videoX = x;
			tile.videoY = y;
			tile.originX = offsetX+x;
			tile.originY = offsetY+y;
			tile.currentX = tile.originX;
			tile.currentY = tile.originY;
			tiles.push(tile);
			x+=TILE_WIDTH;
		}
		y+=TILE_HEIGHT;
	}
}
 
var RAD = Math.PI/180;
var randomJump = false;
var tiles = [];
var debug = false;
function processFrame(){
	if(!isNaN(video.duration)){
		if(SOURCERECT.width == 0){
			SOURCERECT = {x:0,y:0,width:video.videoWidth,height:video.videoHeight};
			createTiles();
		}
		//this is to keep my sanity while developing
		if(randomJump){
			randomJump = false;
			video.currentTime = Math.random()*video.duration;
		}
		//loop
		if(video.currentTime == video.duration){
			video.currentTime = 0;
		}
	}
	var debugStr = "";
	//copy tiles
	copy.drawImage(video, 0, 0);
	draw.clearRect(PAINTRECT.x, PAINTRECT.y,PAINTRECT.width,PAINTRECT.height);
	
	for(var i=0; i<tiles.length; i++){
		var tile = tiles[i];
		if(tile.force > 0.0001){
			//expand
			tile.moveX *= tile.force;
			tile.moveY *= tile.force;
			tile.moveRotation *= tile.force;
			tile.currentX += tile.moveX;
			tile.currentY += tile.moveY;
			tile.rotation += tile.moveRotation;
			tile.rotation %= 360;
			tile.force *= 0.9;
			if(tile.currentX <= 0 || tile.currentX >= PAINTRECT.width){
				tile.moveX *= -1;
			}
			if(tile.currentY <= 0 || tile.currentY >= PAINTRECT.height){
				tile.moveY *= -1;
			}
		}else if(tile.rotation != 0 || tile.currentX != tile.originX || tile.currentY != tile.originY){
			//contract
			var diffx = (tile.originX-tile.currentX)*0.2;
			var diffy = (tile.originY-tile.currentY)*0.2;
			var diffRot = (0-tile.rotation)*0.2;
			
			if(Math.abs(diffx) < 0.5){
				tile.currentX = tile.originX;
			}else{
				tile.currentX += diffx;
			}
			if(Math.abs(diffy) < 0.5){
				tile.currentY = tile.originY;
			}else{
				tile.currentY += diffy;
			}
			if(Math.abs(diffRot) < 0.5){
				tile.rotation = 0;
			}else{
				tile.rotation += diffRot;
			}
		}else{
			tile.force = 0;
		}
		draw.save();
		draw.translate(tile.currentX, tile.currentY);
		draw.rotate(tile.rotation*RAD);
		draw.drawImage(copycanvas, tile.videoX, tile.videoY, TILE_WIDTH, TILE_HEIGHT, -TILE_CENTER_WIDTH, -TILE_CENTER_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
		draw.restore();
	}
	if(debug){
		debug = false;
		document.getElementById('trace').innerHTML = debugStr;
	}
}
 
function explode(x, y){
	for(var i=0; i<tiles.length; i++){
		var tile = tiles[i];
		
		var xdiff = tile.currentX-x;
		var ydiff = tile.currentY-y;
		var dist = Math.sqrt(xdiff*xdiff + ydiff*ydiff);
		
		var randRange = 220+(Math.random()*30);
		var range = randRange-dist;
		var force = 3*(range/randRange);
		if(force > tile.force){
			tile.force = force;
			var radians = Math.atan2(ydiff, xdiff);
			tile.moveX = Math.cos(radians);
			tile.moveY = Math.sin(radians);
			tile.moveRotation = 0.5-Math.random();
		}
	}
	tiles.sort(zindexSort);
	processFrame();
}
function zindexSort(a, b){
	return (a.force-b.force);
}
 
function dropBomb(evt, obj){
	var posx = 0;
	var posy = 0;
	var e = evt || window.event;
	if (e.pageX || e.pageY){
		posx = e.pageX;
		posy = e.pageY;
	}else if (e.clientX || e.clientY) {
		posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
		posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
	}
	var canvasX = posx-obj.offsetLeft;
	var canvasY = posy-obj.offsetTop;
	explode(canvasX, canvasY);
}
 
function Tile(){
	this.originX = 0;
	this.originY = 0;
	this.currentX = 0;
	this.currentY = 0;
	this.rotation = 0;
	this.force = 0;
	this.z = 0;
	this.moveX= 0;
	this.moveY= 0;
	this.moveRotation = 0;
	
	this.videoX = 0;
	this.videoY = 0;
}
 
 
/*
	getPixel
	return pixel object {r,g,b,a}
*/
function getPixel(imageData, x, y){
	var data = imageData.data;
	var pos = (x + y * imageData.width) * 4;
	return {r:data[pos], g:data[pos+1], b:data[pos+2], a:data[pos+3]}
}
/*
	setPixel
	set pixel object {r,g,b,a}
*/
function setPixel(imageData, x, y, pixel){
	var data = imageData.data;
	var pos = (x + y * imageData.width) * 4;
	data[pos] = pixel.r;
	data[pos+1] = pixel.g;
	data[pos+2] = pixel.b;
	data[pos+3] = pixel.a;
}
/*
	copyPixel
	faster then using getPixel/setPixel combo
*/
function copyPixel(sImageData, sx, sy, dImageData, dx, dy){
	var spos = (sx + sy * sImageData.width) * 4;
	var dpos = (dx + dy * dImageData.width) * 4;
	dImageData.data[dpos] = sImageData.data[spos];     //R
	dImageData.data[dpos+1] = sImageData.data[spos+1]; //G
	dImageData.data[dpos+2] = sImageData.data[spos+2]; //B
	dImageData.data[dpos+3] = sImageData.data[spos+3]; //A
}
