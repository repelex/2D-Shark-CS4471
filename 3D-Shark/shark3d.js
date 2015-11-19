var canvas;
var gl;

//color reference   
/* var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 1.0, 1.0 ),  // cyan
    vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
]; */

var lightPosition = vec4(-0.2, 0.3, 0.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 0.0, 1.0, 0.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialShininess = 100.0;

var ctm;
var ambientColor, diffuseColor, specularColor;
var modelView, projection;
var program;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;
var theta =[0, 0, 0];

var modelViewMatrixLoc, projectionMatrixLoc;

var turnLeft = false;
var turnRight = false;
var turning = false;
var turnRate = 2.0;
var degToTurn;

const eye = vec3(0.0, 0.0, 0.0);
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);
var near = 0.3;
var far = 3.0;
var fov = 110.0;  // Field-of-view in Y direction angle (in degrees)
var aspect;

// cage strength
var c_maxStr = 300;
var c_northStr;
var c_southStr;
var c_eastStr;
var c_westStr;
var c_topStr;
var c_bottomStr;

var sharkCount = 10; // sharks to attack (no scare/health)

var cn_pointsArray = [];
var cs_pointsArray = [];
var ce_pointsArray = [];
var cw_pointsArray = [];
var ct_pointsArray = [];
var cb_pointsArray = [];

var cn_normalsArray = [];
var cs_normalsArray = [];
var ce_normalsArray = [];
var cw_normalsArray = [];
var ct_normalsArray = [];
var cb_normalsArray = [];

var shark_pointsArray = [];
var shark_normalsArray = [];

var pointsArray = [];
var normalsArray = [];

// text variables
var northNode;
var southNode;
var eastNode;
var westNode;
var topNode;
var bottomNode;
var sharkNode;
var endNode;

var playerDead = false;

window.onload = function init() {
    
    canvas = document.getElementById( "gl-canvas" );
    
    // configure webgl
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    gl.viewport( 0, 0, canvas.width, canvas.height );
    aspect =  canvas.width/canvas.height;
    gl.clearColor( 0.0, 0.0, 1.0, 1.0 );
    gl.enable(gl.DEPTH_TEST);
    
    //event listeners
    document.onkeyup = handleKeyUp;
    
    // Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
	initText();
	colorShark(); 
    colorCage();
	
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    projection = ortho(-1, 1, -1, 1, -100, 100);
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct) );  
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition) );
       
    gl.uniform1f(gl.getUniformLocation(program, "shininess"),materialShininess);
    
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projection));

	axis = yAxis; //or xAxis, zAxis
	
    render();
}

function render(){
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	// draw and update text
	northNode.nodeValue = ((c_northStr/c_maxStr)*100).toFixed(0) + "%";
	southNode.nodeValue = ((c_southStr/c_maxStr)*100).toFixed(0) + "%";
	eastNode.nodeValue = ((c_eastStr/c_maxStr)*100).toFixed(0) + "%";
	westNode.nodeValue = ((c_westStr/c_maxStr)*100).toFixed(0) + "%";
	topNode.nodeValue = ((c_topStr/c_maxStr)*100).toFixed(0) + "%";
	bottomNode.nodeValue = ((c_bottomStr/c_maxStr)*100).toFixed(0) + "%";
	sharkNode.nodeValue = sharkCount;
	endNode.nodeValue = "";
    
	/* gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.uniform1f(program.alphaUniform, 0.9); */
	
    rotateView();

    modelView = lookAt(eye, at, up);
    modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0] ));
    modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0] ));
    modelView = mult(modelView, rotate(theta[zAxis], [0, 0, 1] ));
	
	projection = perspective(fov, aspect, 0.1, 10);
    
    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelView) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projection) );
    
	/* if (c_northStr > 0){
		gl.drawArrays( gl.TRIANGLES, 0, cn_pointsArray.length);
	}
	if (c_southStr > 0){
		gl.drawArrays( gl.TRIANGLES, 0, cs_pointsArray.length);
	}
	if (c_eastStr > 0){
		gl.drawArrays( gl.TRIANGLES, 0, ce_pointsArray.length);
	}
	if (c_westStr > 0){
		gl.drawArrays( gl.TRIANGLES, 0, cw_pointsArray.length);
	}
	if (c_topStr > 0){
		gl.drawArrays( gl.TRIANGLES, 0, ct_pointsArray.length);
	}
	if (c_bottomStr > 0){
		gl.drawArrays( gl.TRIANGLES, 0, cb_pointsArray.length);
	}
	if (sharkCount > 0){
		gl.drawArrays( gl.TRIANGLES, 0, shark_pointsArray.length);
	} */
	
	gl.drawArrays( gl.TRIANGLES, 0, pointsArray.length);
	
	if (sharkCount < 1){
		endNode.nodeValue = "YOU WIN! PRESS [ENTER] TO RETRY.";
	}
	
	if (playerDead){
		endNode.nodeValue = "YOU LOSE! PRESS [ENTER] TO RETRY.";
	}
	
    requestAnimFrame(render);
}

function quad(v, a, b, c, d, nA, pA) {

     var t1 = subtract(v[b], v[a]);
     var t2 = subtract(v[c], v[b]);
     var normal = cross(t1, t2);
     var normal = vec3(normal);
     normal = normalize(normal);

     pA.push(v[a]);
     nA.push(normal); 
     pA.push(v[b]);  
     nA.push(normal); 
     pA.push(v[c]);
     nA.push(normal);   
     pA.push(v[a]);      
     nA.push(normal); 
     pA.push(v[c]);  
     nA.push(normal); 
     pA.push(v[d]); 
     nA.push(normal);    
}

function colorCage(){
	//cage south
	for (i = 0; i < 10; i++){
		if ((i%2 > 0)||(i==0)){
		quad([	vec4( 0.4 - (i*0.1), -0.5,  0.5, 1.0 ),
				vec4( 0.4 - (i*0.1),  0.5,  0.5, 1.0 ),
				vec4( 0.5 - (i*0.1), 0.5,  0.5, 1.0 ),
				vec4( 0.5 - (i*0.1), -0.5,  0.5, 1.0 )],
				1, 0, 3, 2, normalsArray, pointsArray); //cs_normalsArray, cs_pointsArray
		}
	}
	
	//cage east
	for (i = 0; i < 10; i++){
		if ((i%2 > 0)||(i==0)){
		quad([	vec4( 0.5, -0.5, -0.5 + (i*0.1), 1.0 ),
				vec4( 0.5,  0.5, -0.5 + (i*0.1), 1.0 ),
				vec4( 0.5,  0.5, -0.4 + (i*0.1), 1.0 ),
				vec4( 0.5, -0.5, -0.4 + (i*0.1), 1.0 )],
				0, 1, 2, 3, normalsArray, pointsArray); //ce_normalsArray, ce_pointsArray
		}
	}
	
	//cage west
	for (i = 0; i < 10; i++){
		if ((i%2 > 0)||(i==0)){
		quad([	vec4( -0.5, -0.5, 0.5 - (i*0.1), 1.0 ),
				vec4( -0.5,  0.5, 0.5 - (i*0.1), 1.0 ),
				vec4( -0.5,  0.5, 0.4 - (i*0.1), 1.0 ),
				vec4( -0.5, -0.5, 0.4 - (i*0.1), 1.0 )],
				0, 1, 2, 3, normalsArray, pointsArray); //cw_normalsArray, cw_pointsArray
		}
	}
	
	//cage top
	for (i = 0; i < 10; i++){
		if ((i%2 > 0)||(i==0)){
		quad([	vec4( -0.5, 0.5, 0.4- (i*0.1), 1.0 ),
				vec4( -0.5, 0.5, 0.5 - (i*0.1), 1.0 ),
				vec4( 0.5,  0.5, 0.5 - (i*0.1), 1.0 ),
				vec4( 0.5, 0.5, 0.4 - (i*0.1), 1.0 )],
				1, 0, 3, 2, normalsArray, pointsArray); //ct_normalsArray, ct_pointsArray
		}
	}
	
	//cage bottom
	for (i = 0; i < 10; i++){
		if ((i%2 > 0)||(i==0)){
		quad([	vec4( -0.5, -0.5, -0.5 + (i*0.1), 1.0 ),
				vec4( -0.5, -0.5, -0.4 + (i*0.1), 1.0 ),
				vec4( 0.5,  -0.5, -0.4 + (i*0.1), 1.0 ),
				vec4( 0.5, -0.5, -0.5 + (i*0.1), 1.0 )],
				1, 0, 3, 2, normalsArray, pointsArray); //cb_normalsArray, cb_pointsArray
		}
	}
	
	//cage north
	for (i = 0; i < 10; i++){
		if ((i%2 > 0)||(i==0)){
		quad([	vec4( -0.5 + (i*0.1), -0.5, -0.5, 1.0 ),
				vec4( -0.5 + (i*0.1),  0.5, -0.5, 1.0 ),
				vec4( -0.4 + (i*0.1),  0.5, -0.5, 1.0 ),
				vec4( -0.4 + (i*0.1), -0.5, -0.5, 1.0 )], 
				0, 1, 2, 3, normalsArray, pointsArray); //cn_normalsArray, cn_pointsArray
		}
	}
}

function colorShark(){
	
	var shark = [
		vec4( -0.3, -0.3, -0.6, 1.0 ),
        vec4( -0.45,  0.45, -0.6, 1.0 ),
        vec4( 0.45,  0.45, -0.6, 1.0 ),
        vec4( 0.3, -0.3, -0.6, 1.0 )
	];
	var sharkmouth = [
		vec4( -0.1, -0.1, -0.6, 1.0 ),
        vec4( -0.2,  0.2, -0.6, 1.0 ),
        vec4( 0.2,  0.2, -0.6, 1.0 ),
        vec4( 0.1, -0.1, -0.6, 1.0 )
	];
	var sharkeye1 = [
		vec4( -0.4, 0.4, -0.6, 1.0 ),
        vec4( -0.35,  0.4, -0.6, 1.0 ),
        vec4( -0.25,  0.4, -0.6, 1.0 ),
        vec4( -0.35, 0.3, -0.6, 1.0 )
	];
	var sharkeye2 = [
		vec4( 0.4, 0.4, -0.6, 1.0 ),
        vec4( 0.35,  0.4, -0.6, 1.0 ),
        vec4( 0.25,  0.4, -0.6, 1.0 ),
        vec4( 0.35, 0.3, -0.6, 1.0 )
	];
	
	quad(shark, 1, 0, 3, 2, normalsArray, pointsArray); //shark_normalsArray, shark_pointsArray
	quad(sharkmouth, 0, 1, 2, 3, normalsArray, pointsArray);
	quad(sharkeye1, 0, 1, 2, 3, normalsArray, pointsArray);
	quad(sharkeye2, 0, 1, 2, 3, normalsArray, pointsArray);
}

function handleKeyUp(event) {
	
	if (event.keyCode == 37 || event.keyCode ==  65) {
        // left arrow key or A
		axis = yAxis;
        if (!turning){
            turnRight = false;
            turnLeft = true;
            degToTurn = 90;
            turning = true;
        }
    } else if (event.keyCode == 39 || event.keyCode == 68) {
        // right arrow key or D
		axis = yAxis;
        if (!turning){
            turnLeft = false;
            turnRight = true;
            degToTurn = 90;
            turning = true;
        }
    } else if (event.keyCode == 38 || event.keyCode == 87) {
        // up key or W
		axis = xAxis;
		if (!turning){
            turnLeft = false;
            turnRight = true;
            degToTurn = 90;
            turning = true;
        }
    } else if (event.keyCode == 40 || event.keyCode == 83) {
        // down key or S
		axis = xAxis;
        if (!turning){
            turnLeft = false;
            turnRight = true;
            degToTurn = 90;
            turning = true;
        }
    } else if (event.keyCode == 32) {
        // spacebar
        normalsArray.pop();
		pointsArray.pop();
    } else if (event.keyCode == 13) {
        // reload game
        location.reload();
    }
}

function rotateView(){
    if (turnLeft){
        theta[axis] -= turnRate;
        degToTurn -= turnRate;
        if (degToTurn == 0) {
            turnLeft=false;
            turning = false;
        }
    }
    if (turnRight){
        theta[axis] += turnRate;
        degToTurn -= turnRate;
        if (degToTurn == 0){ 
            turnRight=false;
            turning = false;
        }
    }
}

function initText(){
	
	var northElement = document.getElementById("north");
	var southElement = document.getElementById("south");
	var eastElement = document.getElementById("east");
	var westElement = document.getElementById("west");
	var topElement = document.getElementById("top");
	var bottomElement = document.getElementById("bottom");
	var sharkElement = document.getElementById("shark");
	var endElement = document.getElementById("end");
	
	northNode= document.createTextNode("");
	southNode = document.createTextNode("");
	eastNode = document.createTextNode("");
	westNode = document.createTextNode("");
	topNode = document.createTextNode("");
	bottomNode = document.createTextNode("");
	sharkNode = document.createTextNode("");
	endNode = document.createTextNode("");
	
	northElement.appendChild(northNode);
	southElement.appendChild(southNode);
	eastElement.appendChild(eastNode);
	westElement.appendChild(westNode);
	topElement.appendChild(topNode);
	bottomElement.appendChild(bottomNode);
	sharkElement.appendChild(sharkNode);
	endElement.appendChild(endNode);
	
	c_northStr = c_maxStr;
	c_southStr = c_maxStr;
	c_eastStr = c_maxStr;
	c_westStr = c_maxStr;
	c_topStr = c_maxStr;
	c_bottomStr = c_maxStr;
}