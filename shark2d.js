var canvas;
var gl;

var theta = 0.0;
var ptheta = 0.0;
var thetaLoc1;
var thetaLoc2;


var c_color = vec4( 0.0, 1.0, 0.0, 1.0 );

var ct_prog;
var cb_prog;
var cl_prog;
var cr_prog;
var player_prog;
var shark_prog;
var ct_vPosition;
var cb_vPosition;
var cl_vPosition;
var cr_vPosition;
var player_vPosition;
var shark_vPosition;
var ct_Buffer;
var cb_Buffer;
var cl_Buffer;
var cr_Buffer;
var player_Buffer;
var shark_Buffer;
var cBuffer;
var vColor;
var turnLeft = false;
var turnRight = false;
var sTheta;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
	
	document.onkeydown = handleKeyDown;
	
    //  Load shaders and initialize attribute buffers
    ct_prog = initShaders( gl, "vertex-shader", "fragment-shader" );
	cb_prog = initShaders( gl, "vertex-shader", "fragment-shader" );
	cl_prog = initShaders( gl, "vertex-shader", "fragment-shader" );
	cr_prog = initShaders( gl, "vertex-shader", "fragment-shader" );
	player_prog = initShaders( gl, "player-vs", "player-fs" );
	shark_prog = initShaders( gl, "vertex-shader", "fragment-shader" );
	
	// top
	var cage_top = [
        vec2(  0.25, 0.25 ),
        vec2(  0.25, 0.20 ),
        vec2( -0.25,  0.25 ),
        vec2( -0.25, 0.20 )
    ];
	ct_Buffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, ct_Buffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(cage_top), gl.STATIC_DRAW );
	ct_vPosition = gl.getAttribLocation( ct_prog, "vPosition" );
    
	// bottom
	var cage_bottom = [
        vec2(  0.25, -0.20 ),
        vec2(  0.25, -0.25 ),
        vec2( -0.25,  -0.20 ),
        vec2( -0.25, -0.25 )
    ];
	cb_Buffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, cb_Buffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(cage_bottom), gl.STATIC_DRAW );
	cb_vPosition = gl.getAttribLocation( cb_prog, "vPosition" );

	// left
	var cage_left = [
        vec2(  -0.20, 0.25 ),
        vec2(  -0.20, -0.25 ),
        vec2( -0.25,  0.25 ),
        vec2( -0.25, -0.25 )
    ];
	cl_Buffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, cl_Buffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(cage_left), gl.STATIC_DRAW );
	cl_vPosition = gl.getAttribLocation( cl_prog, "vPosition" );

	// right
	var cage_right = [
        vec2(  0.25, 0.25 ),
        vec2(  0.25, -0.25 ),
        vec2( 0.20,  0.25 ),
        vec2( 0.20, -0.25 )
    ];
	cr_Buffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, cr_Buffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(cage_right), gl.STATIC_DRAW );
	cr_vPosition = gl.getAttribLocation( cr_prog, "vPosition" );
	
	// player
	var player = [
        vec2(  -0.2, 0.0 ),
        vec2(  0.0, 0.15 ),
        vec2( 0.2,  0.0 )
    ];
	player_Buffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, player_Buffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(player), gl.STATIC_DRAW );
	player_vPosition = gl.getAttribLocation( player_prog, "vPosition" );
	thetaLoc1 = gl.getUniformLocation( player_prog, "theta" );
	
	var shark = [
        vec2(  -0.25, 0.0 ),
        vec2(  -0.5, 0.1 ),
		vec2( -0.5,  -0.1 ),
        vec2( -1.0,  0.0 )
    ];
	shark_Buffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, shark_Buffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(shark), gl.STATIC_DRAW );
	shark_vPosition = gl.getAttribLocation( shark_prog, "vPosition" );
	thetaLoc2 = gl.getUniformLocation( shark_prog, "theta" );
	
	// Create a buffer object, initialize it, and associate it with the
    //  associated attribute variable in our vertex shader
	/* cBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(c_color), gl.STATIC_DRAW );
	vColor = gl.getAttribLocation( program, "vColor" );
    gl.enableVertexAttribArray( vColor ); */

    render();
};

function handleKeyDown(event) {
    //You can uncomment the next line to find out each key's code
    //alert(event.keyCode);
 
    if (event.keyCode == 37) {
        //Left Arrow Key
        sTheta = ptheta;
        turnLeft = true;
    } else if (event.keyCode == 38) {
        //Up Arrow Key
    } else if (event.keyCode == 39) {
        //Right Arrow Key
        sTheta = ptheta;
        turnRight = true;
    } else if (event.keyCode == 40) {
        //Down Arrow Key
    } else if (event.keyCode == 32) {
        //Spacebar
        alert(ptheta)
    }
}

function render() {
    
	gl.clear( gl.COLOR_BUFFER_BIT);
	
	gl.useProgram( ct_prog );
	gl.enableVertexAttribArray( ct_vPosition );
	gl.bindBuffer( gl.ARRAY_BUFFER, ct_Buffer );
	gl.vertexAttribPointer( ct_vPosition, 2, gl.FLOAT, false, 0, 0 );
	gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
	
	gl.useProgram( cb_prog );
	gl.enableVertexAttribArray( cb_vPosition );
	gl.bindBuffer( gl.ARRAY_BUFFER, cb_Buffer );
	gl.vertexAttribPointer( cb_vPosition, 2, gl.FLOAT, false, 0, 0 );
	gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
	
	gl.useProgram( cl_prog );
	gl.enableVertexAttribArray( cr_vPosition );
	gl.bindBuffer( gl.ARRAY_BUFFER, cr_Buffer );
	gl.vertexAttribPointer( cr_vPosition, 2, gl.FLOAT, false, 0, 0 );
	gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
	
	gl.useProgram( cr_prog );
	gl.enableVertexAttribArray( cl_vPosition );
	gl.bindBuffer( gl.ARRAY_BUFFER, cl_Buffer );
	gl.vertexAttribPointer( cl_vPosition, 2, gl.FLOAT, false, 0, 0 );
	gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
	
	rotatePlayer();
	gl.useProgram( player_prog );
	gl.enableVertexAttribArray( player_vPosition );
	gl.bindBuffer( gl.ARRAY_BUFFER, player_Buffer );
	gl.vertexAttribPointer( player_vPosition, 2, gl.FLOAT, false, 0, 0 );
	
	theta += 0.1;
	
    gl.uniform1f( thetaLoc1, ptheta );
	gl.drawArrays( gl.TRIANGLE_STRIP, 0, 3 );
	
	gl.useProgram( shark_prog );
	gl.enableVertexAttribArray( shark_vPosition );
	gl.bindBuffer( gl.ARRAY_BUFFER, shark_Buffer );
	gl.vertexAttribPointer( shark_vPosition, 2, gl.FLOAT, false, 0, 0 );
	
    gl.uniform1f( thetaLoc2, theta );
	gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
	
    window.requestAnimFrame(render);
}

function rotatePlayer(){
	if (turnLeft){
		if (ptheta - sTheta < Math.PI/2)
			ptheta += Math.PI/10
		else
			turnLeft = false;
	}
	if (turnRight){
		if (-1*(ptheta - sTheta) < Math.PI/2)
			ptheta -= Math.PI/10
		else
			turnRight = false;
	}
}