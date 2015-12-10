var canvas;
var gl;
var program;

var numTimesToSubdivide = 4;

var earth_pointsArray = [];
var earth_normalsArray = [];
var earthgrid_pointsArray = [];
var earthgrid_normalsArray = [];
var moon_pointsArray = [];
var moon_normalsArray = [];
var comet_pointsArray = [];
var comet_normalsArray = [];
var tail_pointsArray = [];
var tail_normalsArray = [];

var near = -100;
var far = 100;
var radius = 1.5;
var theta  = 0.0;
var phi    = 0.0;
var dr = 5.0 * Math.PI/180.0;

var earthDeg = 0;
var impact = 5;
var ctheta = 0;

var left = -5.0;
var right = 5.0;
var ytop = 5.0;
var bottom = -5.0;

var comet_scale = 0.2;
var explode = false;
var numTailParticles = 30;

var lightPosition = vec4(0.0, 0.0, 1.0, 1.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 0.1, 0.1, 0.1, 1.0 );

var materialAmbient;
var materialDiffuse;
var materialSpecular;
var materialShininess;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var eye = vec3(-1.0, 0.25, 0.0);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var earth_nBuffer;
var earth_vNormal;
var earth_vBuffer;
var earth_vPosition;
var earthgrid_nBuffer;
var earthgrid_vNormal;
var earthgrid_vBuffer;
var earthgrid_vPosition;
var moon_nBuffer;
var moon_vNormal;
var moon_vBuffer;
var moon_vPosition;
var comet_nBuffer;
var comet_vNormal;
var comet_vBuffer;
var comet_vPosition;
var tail_nBuffer;
var tail_vNormal;
var tail_vBuffer;
var tail_vPosition;

var cometPos;
var tailDir;

var tail_colourArray = [
	vec4(1.0, 0.0, 0.0, 1.0),
	vec4(1.0, 0.5, 0.0, 1.0),
	vec4(1.0, 1.0, 0.0, 1.0)
]

function populateTail(){
	for (var i = 0; i < numTailParticles; i++){
		tail_pointsArray.push(vec3(0,0,0));
		tail_normalsArray.push(vec3(0,0,0));
	}
}

function triangle(a, b, c, nA, pA){
	n1=vec4(a)
	n2=vec4(b)
	n3=vec4(c)
	n1[3]=0.0; n2[3]=0.0; n3[3]=0.0;

	nA.push(n1);
	nA.push(n2);
    nA.push(n3);

	pA.push(a);
    pA.push(b);      
    pA.push(c);
}

function divideTriangle(a, b, c, count, nA, pA){
    if ( count > 0 ) {
                
        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);
                
        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);
                                
        divideTriangle( a, ab, ac, count - 1 , nA, pA);
        divideTriangle( ab, b, bc, count - 1 , nA, pA);
        divideTriangle( bc, c, ac, count - 1 , nA, pA);
        divideTriangle( ab, bc, ac, count - 1 , nA, pA);
    }
    else { 
        triangle( a, b, c , nA, pA);
    }
}

function tetrahedron(a, b, c, d, n, nA, pA){
    divideTriangle(a, b, c, n, nA, pA);
    divideTriangle(d, c, b, n, nA, pA);
    divideTriangle(a, d, b, n, nA, pA);
    divideTriangle(a, c, d, n, nA, pA);
}

window.onload = function init(){

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    gl.enable(gl.DEPTH_TEST);
	
	//event handler
	document.onkeyup = handleKeyUp;

    //load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
	
	initObjects();
    initBuffers();
    
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    render();
}

function render(){
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    //earth transformations
    modelViewMatrix = lookAt(eye, at , up);
    modelViewMatrix = mult(modelViewMatrix, rotate(earthDeg, [0,1,0]));
    earthDeg -= 2;
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
	drawEarth();
	modelViewMatrix = mult(modelViewMatrix, scale2(1.01,1.01,1.01));
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
	drawEarthGrid();
	
    //moon transformations
	theta +=1;
    modelViewMatrix = lookAt(eye, at , up);    
    modelViewMatrix = mult(modelViewMatrix, rotate(theta, [0,1,0]));
    modelViewMatrix = mult(modelViewMatrix, translate(0,0,3));
    modelViewMatrix = mult(modelViewMatrix, scale2(0.4,0.4,0.4));
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
	drawMoon();
	
	//comet transformations
	if (impact < 0.7){
		ctheta -=2;
		if (comet_scale > 0.7){
			explode = true;
		} else {
			comet_scale +=0.0025;
		}
	} else {
		impact -=0.01;
	}
	
	if (!explode){
		cometPos = vec3(-0.5,impact-0.5,impact);
		tailDir = subtract(cometPos, vec3(0,0,5));


		modelViewMatrix = lookAt(eye, at , up);
		modelViewMatrix = mult(modelViewMatrix, rotate(ctheta, [0,1,0]));	
		modelViewMatrix = mult(modelViewMatrix, translate(-0.5,impact-0.5,impact));
		modelViewMatrix = mult(modelViewMatrix, scale2(comet_scale,comet_scale,comet_scale));
		gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
		drawComet();
	}
	
	//comet tail particles
	gl.bindBuffer(gl.ARRAY_BUFFER, tail_nBuffer);
	gl.vertexAttribPointer(tail_vNormal, 3, gl.FLOAT, false, 0, 0 );
	gl.bindBuffer(gl.ARRAY_BUFFER, tail_vBuffer );
	gl.vertexAttribPointer(tail_vPosition, 3, gl.FLOAT, false, 0, 0);
	if (impact >0.7){
		for (var i = 0; i<tail_normalsArray.length; i++){
			materialAmbient = tail_colourArray[i%3];
		    materialDiffuse = tail_colourArray[i%3];
		    materialSpecular = tail_colourArray[i%3];
			materialShininess = 100;
			updateLights();
			modelViewMatrix = mult(modelViewMatrix, translate(tailDir[0]*Math.random(),tailDir[1]*Math.random(),tailDir[2]*Math.random()));
			gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
			gl.drawArrays(gl.GL_POINTS, i, i+1);
		}
	}
    window.requestAnimFrame(render);
}

function initObjects(){
	//sphere
	var va = vec4(0.0, 0.0, -1.0,1);
	var vb = vec4(0.0, 0.942809, 0.333333, 1);
	var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
	var vd = vec4(0.816497, -0.471405, 0.333333,1);
	
	//earth
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide, earth_normalsArray, earth_pointsArray);
	
	//earth grid
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide, earthgrid_normalsArray, earthgrid_pointsArray);

	//moon
	tetrahedron(va, vb, vc, vd, numTimesToSubdivide, moon_normalsArray, moon_pointsArray);
	
	//comet
	tetrahedron(va, vb, vc, vd, numTimesToSubdivide, comet_normalsArray, comet_pointsArray);
	populateTail();
}

function initBuffers(){
	//earth
	earth_nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, earth_nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(earth_normalsArray), gl.STATIC_DRAW );
    
    earth_vNormal = gl.getAttribLocation(program, "vNormal" );
    gl.vertexAttribPointer(earth_vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(earth_vNormal);

    earth_vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, earth_vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(earth_pointsArray), gl.STATIC_DRAW);
    
    earth_vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(earth_vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(earth_vPosition);
	
	//earth center
	earthgrid_nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, earthgrid_nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(earthgrid_normalsArray), gl.STATIC_DRAW );
    
    earthgrid_vNormal = gl.getAttribLocation(program, "vNormal" );
    gl.vertexAttribPointer(earthgrid_vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(earthgrid_vNormal);

    earthgrid_vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, earthgrid_vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(earthgrid_pointsArray), gl.STATIC_DRAW);
    
    earthgrid_vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(earthgrid_vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(earthgrid_vPosition);
	
	//moon
	moon_nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, moon_nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(moon_normalsArray), gl.STATIC_DRAW );
    
    moon_vNormal = gl.getAttribLocation(program, "vNormal" );
    gl.vertexAttribPointer(moon_vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(moon_vNormal);

    moon_vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, moon_vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(moon_pointsArray), gl.STATIC_DRAW);
    
    moon_vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(moon_vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(moon_vPosition);
	
	//comet
	comet_nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, comet_nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(comet_normalsArray), gl.STATIC_DRAW );
    
    comet_vNormal = gl.getAttribLocation(program, "vNormal" );
    gl.vertexAttribPointer(comet_vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(comet_vNormal);

    comet_vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, comet_vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(comet_pointsArray), gl.STATIC_DRAW);
    
    comet_vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(comet_vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(comet_vPosition);

    //tail
    tail_nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tail_nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(tail_normalsArray), gl.STATIC_DRAW );
    
    tail_vNormal = gl.getAttribLocation(program, "vNormal" );
    gl.vertexAttribPointer(tail_vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(tail_vNormal);

    tail_vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tail_vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(tail_pointsArray), gl.STATIC_DRAW);
    
    tail_vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(tail_vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(tail_vPosition);
}

function updateLights(){
	ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    
	gl.uniform4fv(gl.getUniformLocation(program, 
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, 
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, 
       "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv(gl.getUniformLocation(program, 
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f(gl.getUniformLocation(program, 
       "shininess"),materialShininess );
}

function drawEarth(){
	materialAmbient = vec4( 0.0, 0.0, 0.1, 1.0 );
    materialDiffuse = vec4( 0.0, 0.0, 1.0, 1.0 );
    materialSpecular = vec4( 0.0, 0.0, 0.0, 1.0 );
	materialShininess = 100;
	updateLights();

	gl.bindBuffer(gl.ARRAY_BUFFER, earth_nBuffer);
	gl.vertexAttribPointer(earth_vNormal, 4, gl.FLOAT, false, 0, 0 );
	gl.bindBuffer(gl.ARRAY_BUFFER, earth_vBuffer );
	gl.vertexAttribPointer(earth_vPosition, 4, gl.FLOAT, false, 0, 0);
    
	for( var i=0; i<earth_normalsArray.length; i+=3) 
        gl.drawArrays(gl.TRIANGLES, i, 3 );
}

function drawEarthGrid(){
	materialAmbient = vec4( 0.0, 1.0, 0.0, 1.0 );
    materialDiffuse = vec4( 0.0, 0.1, 0.0, 1.0 );
    materialSpecular = vec4( 0.0, 1.0, 0.0, 0.0 );
	materialShininess = 100;
	updateLights();
	
	gl.bindBuffer(gl.ARRAY_BUFFER, earthgrid_nBuffer);
	gl.vertexAttribPointer(earthgrid_vNormal, 4, gl.FLOAT, false, 0, 0 );
	gl.bindBuffer(gl.ARRAY_BUFFER, earthgrid_vBuffer );
	gl.vertexAttribPointer(earthgrid_vPosition, 4, gl.FLOAT, false, 0, 0);
    
	for( var i=0; i<earthgrid_normalsArray.length; i+=3) 
        gl.drawArrays(gl.LINE_LOOP, i, 3 );
}

function drawMoon(){
    materialAmbient = vec4( 0.1, 0.1, 0.1, 1.0 );
    materialDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
    materialSpecular = vec4( 0.0, 0.0, 0.0, 1.0 );
	materialShininess = 100;
	lightPosition = vec4(1.0 + theta/10, 0.0, 0.5, 0.0 );
    updateLights();
    
	gl.bindBuffer(gl.ARRAY_BUFFER, moon_nBuffer);
	gl.vertexAttribPointer(moon_vNormal, 4, gl.FLOAT, false, 0, 0 );
	gl.bindBuffer(gl.ARRAY_BUFFER, moon_vBuffer );
	gl.vertexAttribPointer(moon_vPosition, 4, gl.FLOAT, false, 0, 0);
    
	for( var i=0; i<moon_normalsArray.length; i+=3) 
        gl.drawArrays(gl.TRIANGLES, i, 3 );
}

function drawComet(){
	
	if (comet_scale == 0.2){
		materialAmbient = vec4( 0.0, 0.0, 0.1, 1.0 );
		materialDiffuse = vec4( 0.5, 0.5, 1.0, 1.0 );
		materialSpecular = vec4( 1.0, 0.0, 1.0, 1.0 );
		materialShininess = 100;
	} else {
		materialAmbient = vec4(1.0, 0.0, 0.0, 1.0);
		materialDiffuse = vec4(1.0, 1.0, 0.0, 1.0);
		materialSpecular = vec4( 1.0, 0.0, 1.0, 1.0 );
		materialShininess = 100;
	}
	
	updateLights();

	gl.bindBuffer(gl.ARRAY_BUFFER, comet_nBuffer);
	gl.vertexAttribPointer(comet_vNormal, 4, gl.FLOAT, false, 0, 0 );
	gl.bindBuffer(gl.ARRAY_BUFFER, comet_vBuffer );
	gl.vertexAttribPointer(comet_vPosition, 4, gl.FLOAT, false, 0, 0);
	for( var i=0; i<comet_normalsArray.length; i+=3) 
        gl.drawArrays(gl.TRIANGLES, i, 3 );
}

function handleKeyUp(event){
	alert(tailDir);
	if (event.keyCode == 13) {
        // reload game
        location.reload();
    }
}
//modified scale 
function scale2(x, y, z){
	if ( Array.isArray(x) && x.length == 3 ) {
		z = x[2];
        y = x[1];
        x = x[0];
    }

    var result = mat4();
    result[0][0] = x;
    result[1][1] = y;
    result[2][2] = z;

    return result;
}