var canvas;
var gl;

var theta = 0.0;
var ptheta = 0.0;

var sharkx = 0.0; 
var sharky = 0.0;
var sharkxSpd = 0.0;
var sharkySpd = 0.0;
var sharkSide = 0;

var thetaLoc1;
var thetaLoc2;

var ct_prog;
var cb_prog;
var cl_prog;
var cr_prog;
var player_prog;
var shark_prog;

var ct_vPosition;
var ct_thetaLoc;
var ct_xLoc;
var ct_yLoc;

var cb_vPosition;
var cb_thetaLoc;
var cb_xLoc;
var cb_yLoc;

var cl_vPosition;
var cl_thetaLoc;
var cl_xLoc;
var cl_yLoc;

var cr_vPosition;
var cr_thetaLoc;
var cr_xLoc;
var cr_yLoc;

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

//scare shark from wall (every 3 hits)
var sharkScare = 0;

//total hits to kill shark
var sharkHP = 30;

//cage strength
var c_topStr = 600;
var c_bottomStr = 600;
var c_leftStr = 600;
var c_rightStr = 600;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 1.0, 1.0 );
	
	document.onkeyup = handleKeyUp;
	
    //  Load shaders and initialize attribute buffers
    ct_prog = initShaders( gl, "vertex-shader", "fragment-shader" );
	cb_prog = initShaders( gl, "vertex-shader", "fragment-shader" );
	cl_prog = initShaders( gl, "vertex-shader", "fragment-shader" );
	cr_prog = initShaders( gl, "vertex-shader", "fragment-shader" );
	player_prog = initShaders( gl, "player-vs", "player-fs" );
	shark_prog = initShaders( gl, "vertex-shader", "shark-fs" );
	
	// top
	var cage_top = [
        vec2(0.0, 0.0),
        vec2(0.0, 0.05),
        vec2(0.5, 0.05),
        vec2(0.5, 0.0)
    ];
	ct_Buffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, ct_Buffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(cage_top), gl.STATIC_DRAW );
	ct_vPosition = gl.getAttribLocation(ct_prog, "vPosition" );
    ct_thetaLoc = gl.getUniformLocation(ct_prog, "theta");
    ct_xLoc = gl.getUniformLocation(ct_prog, "xPos");
    ct_yLoc = gl.getUniformLocation(ct_prog, "yPos");

	// bottom
	var cage_bottom = [
        vec2(0.0, 0.0),
        vec2(0.0, 0.05),
        vec2(0.5, 0.05),
        vec2(0.5, 0.0)
    ];
	cb_Buffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, cb_Buffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(cage_top), gl.STATIC_DRAW );
	cb_vPosition = gl.getAttribLocation(cb_prog, "vPosition" );
    cb_thetaLoc = gl.getUniformLocation(cb_prog, "theta");
    cb_xLoc = gl.getUniformLocation(cb_prog, "xPos");
    cb_yLoc = gl.getUniformLocation(cb_prog, "yPos");

	// left
	var cage_left = [
        vec2(0.0, 0.0),
        vec2(0.0, 0.05),
        vec2(0.5, 0.05),
        vec2(0.5, 0.0)
    ];
	cl_Buffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, cl_Buffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(cage_left), gl.STATIC_DRAW );
	cl_vPosition = gl.getAttribLocation( cl_prog, "vPosition" );
	cl_thetaLoc = gl.getUniformLocation(cl_prog, "theta");
    cl_xLoc = gl.getUniformLocation(cl_prog, "xPos");
    cl_yLoc = gl.getUniformLocation(cl_prog, "yPos");
	

	// right
	var cage_right = [
        vec2(0.0, 0.0),
        vec2(0.0, 0.05),
        vec2(0.5, 0.05),
        vec2(0.5, 0.0)
    ];
	cr_Buffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, cr_Buffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(cage_right), gl.STATIC_DRAW );
	cr_vPosition = gl.getAttribLocation( cr_prog, "vPosition" );
    cr_thetaLoc = gl.getUniformLocation(cr_prog, "theta");
    cr_xLoc = gl.getUniformLocation(cr_prog, "xPos");
    cr_yLoc = gl.getUniformLocation(cr_prog, "yPos");
	
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
	
	// shark
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
	sharkxLoc = gl.getUniformLocation( shark_prog, "xPos" );
	sharkyLoc = gl.getUniformLocation( shark_prog, "yPos" );
	thetaLoc2 = gl.getUniformLocation( shark_prog, "theta" );
	
	sharkEnter();
	
    render();
};

function handleKeyUp(event) {
    //You can uncomment the next line to find out each key's code
    //alert(event.keyCode);
 
    if (event.keyCode == 37) {
        //Left Arrow Key
        sTheta = ptheta;
        turnLeft = true;
    } else if (event.keyCode == 39) {
        //Right Arrow Key
        sTheta = ptheta;
        turnRight = true;
    } else if (event.keyCode == 32) {
		//Spacebar
		shootWeapon();
    }
	
	//reset shark after being hit 3 times
	if (sharkScare > 2 && sharkHP > 0){
		sharkEnter();
		sharkScare = 0;
	}
	
	// shark dead
	if (sharkHP < 1){
		//TODO: hide shark after killed
		alert("Shark is dead. RIP.");
	}
	
}

function render() {
    
	gl.clear( gl.COLOR_BUFFER_BIT);
	
	//draw top cage if still strong
	if (c_topStr > 0){
		gl.useProgram( ct_prog );
		gl.enableVertexAttribArray( ct_vPosition );
		gl.bindBuffer( gl.ARRAY_BUFFER, ct_Buffer );
		gl.vertexAttribPointer( ct_vPosition, 2, gl.FLOAT, false, 0, 0 );
		gl.uniform1f(ct_thetaLoc, (Math.PI/2));
		gl.uniform1f(ct_xLoc, 0.25);
		gl.uniform1f(ct_yLoc, -0.25);
		gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );
	}
	
	//draw bottom cage if still strong
	if (c_bottomStr > 0){
		gl.useProgram( cb_prog );
		gl.enableVertexAttribArray( cb_vPosition );
		gl.bindBuffer( gl.ARRAY_BUFFER, cb_Buffer );
		gl.vertexAttribPointer( cb_vPosition, 2, gl.FLOAT, false, 0, 0 );
		gl.uniform1f(cb_thetaLoc, (Math.PI/2));
		gl.uniform1f(cb_xLoc, 0.25);
		gl.uniform1f(cb_yLoc, 0.2);
		gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );
	}
	
	//draw right cage if still strong
	if (c_rightStr > 0){
		gl.useProgram( cr_prog );
		gl.enableVertexAttribArray( cr_vPosition );
		gl.bindBuffer( gl.ARRAY_BUFFER, cr_Buffer );
		gl.vertexAttribPointer( cr_vPosition, 2, gl.FLOAT, false, 0, 0 );
		gl.uniform1f(cr_thetaLoc, 0.0);
		gl.uniform1f(cr_xLoc, 0.2);
		gl.uniform1f(cr_yLoc, -0.25);
		gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );
	}
	
	//draw left cage if still strong
	if (c_leftStr > 0){
		gl.useProgram( cl_prog );
		gl.enableVertexAttribArray( cl_vPosition );
		gl.bindBuffer( gl.ARRAY_BUFFER, cl_Buffer );
		gl.vertexAttribPointer( cl_vPosition, 2, gl.FLOAT, false, 0, 0 );
		gl.uniform1f(cl_thetaLoc, 0.0);
		gl.uniform1f(cl_xLoc, -0.25);
		gl.uniform1f(cl_yLoc, -0.25);
		gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );
	}
	
	
	//player
	rotatePlayer();
	gl.useProgram( player_prog );
	gl.enableVertexAttribArray( player_vPosition );
	gl.bindBuffer( gl.ARRAY_BUFFER, player_Buffer );
	gl.vertexAttribPointer( player_vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.uniform1f( thetaLoc1, ptheta );
	gl.drawArrays( gl.TRIANGLE_STRIP, 0, 3 );
	
	

	//shark
	if (sharkHP > 0){
		gl.useProgram( shark_prog );
		gl.enableVertexAttribArray( shark_vPosition );
		gl.bindBuffer( gl.ARRAY_BUFFER, shark_Buffer );
		gl.vertexAttribPointer( shark_vPosition, 2, gl.FLOAT, false, 0, 0 );
		
		if(sharkSide==0 && c_topStr < 1){
			//top broke
			if (sharky < -0.5){
				sharkySpd = 0;
				alert("You lose!");
			} else {
				sharky += sharkySpd;
			}
		} else if(sharkSide==2 && c_bottomStr < 1){
			//bottom broke
			if (sharky > 0.5){
				sharkySpd = 0;
				alert("You lose!");
			} else {
				sharky += sharkySpd;
			}
		} else {
			//weaken y value wall
			if (sharky > -0.01 && sharky < 0.01){
				sharkySpd = 0;
				if (sharkSide==0){
					//c_topStr -=1;
				}
				else{
					//c_bottomStr -=1;
				}
			} else {
				sharky += sharkySpd;
			}
		}
		gl.uniform1f( sharkyLoc, sharky );
		
		if(sharkSide==1 && c_rightStr < 1){
			//right broke
			if (sharkx < -0.5){
				sharkxSpd = 0;
				alert("You lose!");
			} else {
				sharkx += sharkxSpd;
			}
		} else if(sharkSide==3 && c_leftStr < 1){
			//left broke
			if (sharkx > 0.5){
				sharkxSpd = 0;
				alert("You lose!");
			} else {
				sharkx += sharkxSpd;
			}
		} else {
			//weaken x value wall
			if (sharkx > -0.01 && sharkx < 0.01){
				sharkxSpd = 0;
				if (sharkSide==1){
					//c_rightStr -=1;
				}
				else{
					//c_leftStr -=1;
				}
			} else {
				sharkx += sharkxSpd;
			}
		}
		gl.uniform1f( sharkxLoc, sharkx );
		
		
		gl.uniform1f( thetaLoc2, theta );
		gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
	}
	
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

function sharkEnter(){
	
	sharkSide = randomInt(4);
	
	if (sharkSide == 0){
		sharky = 1;
		sharkx = 0;
		theta = Math.PI;
		sharkySpd = -0.01;
		sharkxSpd = 0;
	} else if (sharkSide == 1){
		sharky = 0;
		sharkx = 1;
		theta = Math.PI/2;
		sharkySpd = 0;
		sharkxSpd = -0.01;
	} else if (sharkSide == 2){
		sharky = -1;
		sharkx = 0;
		theta = 0;
		sharkySpd = 0.01;
		sharkxSpd = 0;
	} else if (sharkSide == 3){
		sharky = 0;
		sharkx = -1;
		theta = Math.PI*3/2;
		sharkySpd = 0;
		sharkxSpd = 0.01;
	}
}

function shootWeapon(){
	
	if (ptheta > -1 && ptheta < 1){
		//shoot right
		if (sharkSide == 1){
			//hit
			sharkScare+=1;
			sharkHP-=1;
		}
	} else if (ptheta > 1 && ptheta < 2){
		//shoot up
		if (sharkSide == 0){
			//hit
			sharkScare+=1;
			sharkHP-=1;
		}
	} else if (ptheta > 3 && ptheta < 4){
		//shoot left
		if (sharkSide == 3){
			//hit
			sharkScare+=1;
			sharkHP-=1;
		}
	} else if (ptheta > 4 && ptheta < 5){
		//shoot down
		if (sharkSide == 2){
			//hit
			sharkScare+=1;
			sharkHP-=1;
		}
	}
}

function randomInt(range) {
  return Math.floor(Math.random() * range);
}