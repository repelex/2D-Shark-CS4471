/* /* 
1. 	The planet is centered at the origin
2. 	The planet is rotating (So some surface detail is needed)
3. 	A moon is orbiting around the planet
4. 	The comet movement on its trajectory (use a line, ignoring
	the finer physics of orbits and gravity) is animated as it 
	approaches and impacts the planet.
5. 	Some graphic depiction of the impact is presented (for 
	example a sphere that
	diminishes to zero radius or a particle system explosion. 
	This feature must rotate with the planet.)
6.	Use Particle system methods for comet tail (pointing away 
	from the sun)
7.	Include lighting where the light comes from the sun 
*/

//useful rotating demo: http://learningwebgl.com/lessons/lesson13/index.html
//maps for earth and moon: http://maps.jpl.nasa.gov/
//useful particles demo: http://jeshua.me/content/demos/webglTutorial01/particleDemoLive.html

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

var near = -100;
var far = 100;
var radius = 1.5;
var theta  = 0.0;
var phi    = 0.0;
var dr = 5.0 * Math.PI/180.0;

var earthDeg = 0;

var left = -5.0;
var right = 5.0;
var ytop = 5.0;
var bottom = -5.0;

var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
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
    earthDeg += 2;
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
	
    window.requestAnimFrame(render);
}

function initObjects(){
	//earth
	var va = vec4(0.0, 0.0, -1.0,1);
	var vb = vec4(0.0, 0.942809, 0.333333, 1);
	var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
	var vd = vec4(0.816497, -0.471405, 0.333333,1);
	
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide, earth_normalsArray, earth_pointsArray);
	
	//earth grid
	var va1 = vec4(0.0, 0.0, -1.0,1);
	var vb1 = vec4(0.0, 0.942809, 0.333333, 1);
	var vc1 = vec4(-0.816497, -0.471405, 0.333333, 1);
	var vd1 = vec4(0.816497, -0.471405, 0.333333,1);
	
    tetrahedron(va1, vb1, vc1, vd1, numTimesToSubdivide, earthgrid_normalsArray, earthgrid_pointsArray);

	//moon
    var v1 = vec4(0.0, 0.0, -1.0,1);
	var v2 = vec4(0.0, 0.942809, 0.333333, 1);
	var v3 = vec4(-0.816497, -0.471405, 0.333333, 1);
	var v4 = vec4(0.816497, -0.471405, 0.333333,1);
	
	tetrahedron(v1, v2, v3, v4, numTimesToSubdivide, moon_normalsArray, moon_pointsArray);
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
    updateLights();
    
	gl.bindBuffer(gl.ARRAY_BUFFER, moon_nBuffer);
	gl.vertexAttribPointer(moon_vNormal, 4, gl.FLOAT, false, 0, 0 );
	gl.bindBuffer(gl.ARRAY_BUFFER, moon_vBuffer );
	gl.vertexAttribPointer(moon_vPosition, 4, gl.FLOAT, false, 0, 0);
    
	for( var i=0; i<moon_normalsArray.length; i+=3) 
        gl.drawArrays(gl.TRIANGLES, i, 3 );
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