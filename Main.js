//Size of the brush strokes
var maxBrushSize = 12,
		minBrushSize = 2;


var detailDetectionThreshold = 60;//Max edge detection threshold
var detailEase = [27, 2];//this controls the number of passes
var stepAmounts = [2, 4];

var strokeThreshold = 37,//max diff between color HSB
		maxStrokeLength = 10,//Number of steps the brush stroke can take
		strokeDetectionDist = 4,//Radius of similar color Detection 
		strokeAlphaEase = [15, 185];//Alpha values of brush strokes [First - last]


var img;
var iw, ih;//Image width/height

var input;
var img;
var slider = [];

function setup() {
	
	createCanvas(800, 400);
	button = createButton('render');
	button.position(0, 279);
	button.mousePressed(startup);
  input = createFileInput(handleFile);
  input.position(0, 0);
	
	slider[0] = createSlider(5, 50, maxBrushSize);
  slider[0].position(10, 35);
  slider[0].style('width', '200px');
	text("Max Brush Size",220,50);
	
	slider[1] = createSlider(2, 10, minBrushSize);
  slider[1].position(10, 55);
  slider[1].style('width', '200px');
	text("Min Brush Size",220,70);

	slider[2] = createSlider(5, 50, strokeThreshold);
  slider[2].position(10, 75);
  slider[2].style('width', '200px');
	text("max diff between color HSB",220,90);
	
	slider[3] = createSlider(2, 30, strokeDetectionDist);
  slider[3].position(10, 95);
  slider[3].style('width', '200px'); 
	text("Radius of similar color Detection",220,110);
	
	slider[4] = createSlider(2, 30, maxStrokeLength);
  slider[4].position(10, 115);
  slider[4].style('width', '200px');
	text("Number of steps the brush stroke can take",220,130);
	
	slider[5] = createSlider(2, 50, detailEase[0]);
  slider[5].position(10, 135);
  slider[5].style('width', '200px');
	text("this controls the number of passes",220,150);
	
	slider[6] = createSlider(1, 100, strokeAlphaEase[0]);
  slider[6].position(10, 155);
  slider[6].style('width', '90px');
	slider[7] = createSlider(100, 255, strokeAlphaEase[1]);
  slider[7].position(110, 155);
  slider[7].style('width', '90px');
	text("Brush Strokes alpha value",220,170);
	
	slider[8] = createSlider(2, 4, stepAmounts[0]);
  slider[8].position(10, 175);
  slider[8].style('width', '90px');
	slider[9] = createSlider(4, 15, stepAmounts[1]);
  slider[9].position(110, 175);
  slider[9].style('width', '90px');
	text("min/max density of the steps passes",220,190);
	
	text("Larger images tend to work better, \nthe settings will need to be changed to get a good result",100,230);
	
	
}

function handleFile(file) {
  if (file.type === 'image') {
    img = createImg(file.data);
    img.hide();
  }
}

var started = false;
function startup(){
	maxBrushSize=slider[0].value();
	minBrushSize=slider[1].value();
	strokeThreshold=slider[2].value();
	strokeDetectionDist=slider[3].value();
	maxStrokeLength=slider[4].value();
	detailEase[0]=slider[5].value();
	strokeAlphaEase = [slider[6].value(),slider[7].value()];
	stepAmounts=[slider[8].value(),slider[9].value()];
	if(img){
		started = true;
			iw = ~~img.width;
			ih = ~~img.height;
			createCanvas(iw, ih);
			background(250);
			image(img, 0, 0, iw, ih);
			loadPixels();
			frameRate(Infinity);
	}else{
		println("you need to pick an image");
	}	
}




function getIx(x, y) {return ~~x + ~~y * iw << 2;}//gets pixel index
var x = 0;
var th = 1;



function draw() {
	if(started){
	var ms = millis();
	while (millis() - ms < 5) {
		if (th <= detailDetectionThreshold) {
			strokeWeight(map(th, 0, detailDetectionThreshold, maxBrushSize, minBrushSize));//sets brush stroke weight
			
			//loop through y
			for (var y = 0; y < ih; y += map(th, detailDetectionThreshold, 0, stepAmounts[0], stepAmounts[1])) {
				
				var i = getIx(x, y), i1 = getIx(x - 1, y);//gets indexs
				
				//get rgb values of points
				var r  = pixels[i],  g = pixels[i + 1],  b = pixels[i + 2];
				var r1 = pixels[i1],g1 = pixels[i1 + 1],b1 = pixels[i1 + 2];
				
				//get color dist of 2 pixels ( this is edge detection )
				var cldist = sqrt(sq(r - r1) + sq(g - g1) + sq(b - b1));
				
				//If the point is within the threshold
				if (cldist > th) {
					
					//Finds the most similar nearby pixel
					var si = strokeDetectionDist;
					var cldtb = 100000;
					var rt = 0;
					for (var ro = 30; ro < 390; ro += 5) {
						var i1 = getIx(x + cos(ro) * si, y + sin(ro) * si);//gets index
						var r1 = pixels[i1],g1 = pixels[i1 + 1],b1 = pixels[i1 + 2];//gets rgb data
						var cldist1 = sqrt(sq(r - r1) + sq(g - g1) + sq(b - b1));//finds the color dist
						if (cldist1 < cldtb) {
							rt = ro;
							cldtb = cldist1;
						}
					}
					
					//sets the stroke color
					stroke(pixels[i], pixels[i + 1], pixels[i + 2], map(th, 0, detailDetectionThreshold, strokeAlphaEase[0], strokeAlphaEase[1]));
					
					//gets the stroke color
					var StrokeColor = color(pixels[i], pixels[i + 1], pixels[i + 2]);
					
					var nx = x,ny = y;//new point cords
					var stp = 0;//step counter
					
					//Draws the brush stroke
					var c = true;
					while (c) {
						var StrokeColor2;//new point color
						var cldtb2 = 100000;//color dist to beat
						var rt2 = 0;//new rotation
						
						//gets similar pixels while following the original vector
						for (var ro = -20; ro < 20; ro += 2) {
							var i1 = getIx(nx + cos(rt + ro) * si, ny + sin(rt + ro) * si);//gets index
							var r1 = pixels[i1],g1 = pixels[i1 + 1],b1 = pixels[i1 + 2];//gets pixels rgb value
							var cldist = sqrt(sq(r - r1) + sq(g - g1) + sq(b - b1));//gets color dist
							if (cldist < cldtb2) {
								rt2 = rt + ro;//sets new rotation vector
								cldtb2 = cldist;//update the color dist to beat
								StrokeColor2 = color(r1, g1, b1);//update the new point color
							}
						}
						
						//if the color delta is within the threshold & the number of steps has not ben reached
						if (
							abs(hue(StrokeColor2) - hue(StrokeColor)) < strokeThreshold &&
							abs(saturation(StrokeColor2) - saturation(StrokeColor)) < strokeThreshold &&
							abs(brightness(StrokeColor2) - brightness(StrokeColor)) < strokeThreshold && 
							stp < maxStrokeLength
						) {
							
							//draws the step counter
							line(nx, ny, nx + cos(rt2) * si, ny + sin(rt2) * si);
							
							//inc step counter
							stp++;
							
							//update the cords
							nx = nx + cos(rt2) * si;
							ny = ny + sin(rt2) * si;
							
							//update the rotation
							rt = rt2;
						} else {
							c = false;
						}
					}
				}
			}
		} else { noLoop(); }
		
		if (x < iw) {
			//steps x
			x += map(th, detailDetectionThreshold, 0, stepAmounts[0], stepAmounts[1]);
		} else {
			//increases threshold
			th += map(th, 0, detailDetectionThreshold, detailEase[0], detailEase[1]);
			x = 0;//reset x
		}
	}
	}
}
