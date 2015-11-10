var gl;
var canvas;
var context;
var player;
var shark;

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

var cage_top;
var ct_vPosition;
var ct_thetaLoc;
var ct_xLoc;
var ct_yLoc;
var ct_colLoc;

var cage_bottom;
var cb_vPosition;
var cb_thetaLoc;
var cb_xLoc;
var cb_yLoc;
var cb_colLoc;

var cage_left;
var cl_vPosition;
var cl_thetaLoc;
var cl_xLoc;
var cl_yLoc;
var cl_colLoc;

var cage_right;
var cr_vPosition;
var cr_thetaLoc;
var cr_xLoc;
var cr_yLoc;
var cr_colLoc;

var player_vPosition;
var shark_vPosition;
var ct_Buffer;
var cb_Buffer;
var cl_Buffer;
var cr_Buffer;
var player_Buffer;
var shark_Buffer;
var turnLeft = false;
var turnRight = false;
var sTheta;

var laser;
var laser_prog;
var laser_vPos;
var laser_Buffer;
var laser_thetaLoc;
var laser_colLoc;
var isShooting = false;
var laser_fade = 5;

var sharkfin;
var sharkfin_prog;
var sharkfin_vPos;
var sharkfin_Buffer;
var sharkfin_thetaLoc;
var sharkfin_colLoc;
var sharkfin_xLoc;
var sharkfin_yLoc;

var sharkScare = 0; // scare shark from wall (every 3 hits)
var sharkMax = 30 // total hits to kill shark
var sharkHealth;

var playerDead = false;
var sharkDead = false;

// cage strength
var c_maxStr = 300;
var c_topStr;
var c_bottomStr;
var c_leftStr;
var c_rightStr;

// text variables
var topNode;
var bottomNode;
var leftNode;
var rightNode;
var hpNode;
var endNode;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
	
	// configure webgl
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 1.0, 1.0 );
	
	// event listeners
	document.onkeyup = handleKeyUp;
	canvas.onclick = shootWeapon;
	
    // load shaders and initialize attribute buffers
    ct_prog = initShaders( gl, "vertex-shader", "fragment-shader" );
	cb_prog = initShaders( gl, "vertex-shader", "fragment-shader" );
	cl_prog = initShaders( gl, "vertex-shader", "fragment-shader" );
	cr_prog = initShaders( gl, "vertex-shader", "fragment-shader" );
	player_prog = initShaders( gl, "vertex-shader", "player-fs" );
	shark_prog = initShaders( gl, "vertex-shader", "shark-fs" );
	laser_prog = initShaders( gl, "vertex-shader", "fragment-shader" );
	sharkfin_prog = initShaders( gl, "vertex-shader", "fragment-shader" );
	
	// top
	cage_top = [
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
    ct_colLoc = gl.getUniformLocation(ct_prog, "u_colour");

	// bottom
	cage_bottom = [
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
    cb_colLoc = gl.getUniformLocation(cb_prog, "u_colour");

	// left
	cage_left = [
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
    cl_colLoc = gl.getUniformLocation(cl_prog, "u_colour");
	
	// right
	cage_right = [
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
    cr_colLoc = gl.getUniformLocation(cr_prog, "u_colour");
	
	// player
	player = [
        vec2(-0.15, -0.05 ),
        vec2( 0.0, 0.1 ),
        vec2( 0.15, -0.05 )
    ];
	player_Buffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, player_Buffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(player), gl.STATIC_DRAW );
	player_vPosition = gl.getAttribLocation( player_prog, "vPosition" );
	thetaLoc1 = gl.getUniformLocation( player_prog, "theta" );
	
	// shark
	shark = [
        vec2( 0.0, 0.0),
        vec2(-0.12, 0.2),
        vec2( 0.12, 0.2),
		vec2( 0.0, 0.6),
		vec2( 0.0, 0.6),
		vec2(  0.1, 0.7),
		vec2( -0.1, 0.7)
    ];
	shark_Buffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, shark_Buffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(shark), gl.STATIC_DRAW );
	shark_vPosition = gl.getAttribLocation( shark_prog, "vPosition" );
	sharkxLoc = gl.getUniformLocation( shark_prog, "xPos" );
	sharkyLoc = gl.getUniformLocation( shark_prog, "yPos" );
	thetaLoc2 = gl.getUniformLocation( shark_prog, "theta" );

	// laser
	laser = [
		vec2(-0.01, 0),
		vec2(-0.01, 1.0),
		vec2(0.01, 1.0),
		vec2(0.01, 0)
	];
	laser_Buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, laser_Buffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(laser), gl.STATIC_DRAW);
	laser_vPos = gl.getAttribLocation(laser_prog, "vPosition");
	laser_thetaLoc = gl.getUniformLocation(laser_prog, "theta");
	laser_colLoc = gl.getUniformLocation(laser_prog, "u_colour");

	sharkfin = [
		vec2(-0.01, 0.1),
		vec2(0, 0.15),
		vec2(0.01, 0.1)
	];
	sharkfin_Buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, sharkfin_Buffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(sharkfin), gl.STATIC_DRAW);
	sharkfin_vPos = gl.getAttribLocation(sharkfin_prog, "vPosition");
	sharkfin_thetaLoc = gl.getUniformLocation(sharkfin_prog, "theta");
	sharkfin_colLoc = gl.getUniformLocation(sharkfin_prog, "u_colour");
	sharkfin_xLoc = gl.getUniformLocation(sharkfin_prog, "xPos");
    sharkfin_yLoc = gl.getUniformLocation(sharkfin_prog, "yPos");
	
	initText();
	sharkEnter();
	render();

};

function handleKeyUp(event) {
	
    if (event.keyCode == 37 || event.keyCode ==  65) {
        // left arrow key or A
        sTheta = ptheta;
        turnLeft = true;
    } else if (event.keyCode == 39 || event.keyCode == 68) {
        // right arrow key or D
        sTheta = ptheta;
        turnRight = true;
    } else if (event.keyCode == 32) {
		// spacebar
		shootWeapon();
		
	} else if (event.keyCode == 13) {
		// reload game
		location.reload();
	}
}

function render(){
    var cb_colMod = 0;
	var ct_colMod = 0;
	var cl_colMod = 0;
	var cr_colMod = 0;
	
	gl.clear( gl.COLOR_BUFFER_BIT);
	
	// draw and update text
	topNode.nodeValue = ((c_topStr/c_maxStr)*100).toFixed(0) + "%";
	bottomNode.nodeValue = ((c_bottomStr/c_maxStr)*100).toFixed(0) + "%";
	leftNode.nodeValue = ((c_leftStr/c_maxStr)*100).toFixed(0) + "%";
	rightNode.nodeValue = ((c_rightStr/c_maxStr)*100).toFixed(0) + "%";
	hpNode.nodeValue = sharkHealth.toFixed(0) + "/" + sharkMax;
	endNode.nodeValue = "";
	
	// draw top cage if still strong
	if (c_topStr > 0){
		ct_colMod = c_topStr/c_maxStr;
		gl.useProgram( ct_prog );
		gl.enableVertexAttribArray( ct_vPosition );
		gl.bindBuffer( gl.ARRAY_BUFFER, ct_Buffer );
		gl.vertexAttribPointer( ct_vPosition, 2, gl.FLOAT, false, 0, 0 );
		gl.uniform1f(ct_thetaLoc, 0);
		gl.uniform1f(ct_xLoc, -0.25);
		gl.uniform1f(ct_yLoc, 0.2);
		gl.uniform4fv(ct_colLoc, vec4(1.0-ct_colMod,ct_colMod,0,1.0))
		gl.drawArrays( gl.TRIANGLE_FAN, 0, cage_top.length );
	}
	
	// draw bottom cage if still strong
	if (c_bottomStr > 0){
		cb_colMod = c_bottomStr/c_maxStr;
		gl.useProgram( cb_prog );
		gl.enableVertexAttribArray( cb_vPosition );
		gl.bindBuffer( gl.ARRAY_BUFFER, cb_Buffer );
		gl.vertexAttribPointer( cb_vPosition, 2, gl.FLOAT, false, 0, 0 );
		gl.uniform1f(cb_thetaLoc, 0);
		gl.uniform1f(cb_xLoc, -0.25);
		gl.uniform1f(cb_yLoc, -0.25);
		gl.uniform4fv(cb_colLoc, vec4(1.0-cb_colMod,cb_colMod,0,1.0));
		gl.drawArrays( gl.TRIANGLE_FAN, 0, cage_bottom.length );
	}
	
	// draw right cage if still strong
	if (c_rightStr > 0){
		cr_colMod = c_rightStr/c_maxStr;
		gl.useProgram( cr_prog );
		gl.enableVertexAttribArray( cr_vPosition );
		gl.bindBuffer( gl.ARRAY_BUFFER, cr_Buffer );
		gl.vertexAttribPointer( cr_vPosition, 2, gl.FLOAT, false, 0, 0 );
		gl.uniform1f(cr_thetaLoc, (Math.PI/2));
		gl.uniform1f(cr_xLoc, 0.25);
		gl.uniform1f(cr_yLoc, -0.25);
		gl.uniform4fv(cr_colLoc, vec4(1.0-cr_colMod,cr_colMod,0,1.0));
		gl.drawArrays( gl.TRIANGLE_FAN, 0, cage_right.length );
	}
	
	// draw left cage if still strong
	if (c_leftStr > 0){
		cl_colMod = c_leftStr/c_maxStr;
		gl.useProgram( cl_prog );
		gl.enableVertexAttribArray( cl_vPosition );
		gl.bindBuffer( gl.ARRAY_BUFFER, cl_Buffer );
		gl.vertexAttribPointer( cl_vPosition, 2, gl.FLOAT, false, 0, 0 );
		gl.uniform1f(cl_thetaLoc, (Math.PI/2));
		gl.uniform1f(cl_xLoc, -0.2);
		gl.uniform1f(cl_yLoc, -0.25);
		gl.uniform4fv(cl_colLoc, vec4(1.0-cl_colMod,cl_colMod,0,1.0));
		gl.drawArrays( gl.TRIANGLE_FAN, 0, cage_left.length );
	}

	// laser
	if (isShooting){
		gl.useProgram(laser_prog);
		gl.enableVertexAttribArray(laser_vPos);
		gl.bindBuffer(gl.ARRAY_BUFFER, laser_Buffer);
		gl.vertexAttribPointer(laser_vPos, 2, gl.FLOAT, false, 0, 0 );
		gl.uniform1f(laser_thetaLoc, ptheta );
		gl.uniform4fv(laser_colLoc, vec4(1.0, 0.0, 1.0, 1.0));
		gl.drawArrays( gl.TRIANGLE_FAN, 0, laser.length );
		laser_fade--;
		if (laser_fade == 0){
			isShooting = false;
		}
	}
	
	// player
	if (!playerDead){
		
		rotatePlayer();
		gl.useProgram( player_prog );
		gl.enableVertexAttribArray( player_vPosition );
		gl.bindBuffer( gl.ARRAY_BUFFER, player_Buffer );
		gl.vertexAttribPointer( player_vPosition, 2, gl.FLOAT, false, 0, 0 );
		gl.uniform1f( thetaLoc1, ptheta );
		gl.drawArrays( gl.TRIANGLE_STRIP, 0, player.length );
		
	}
	
	// shark
	if (!sharkDead){
		gl.useProgram( shark_prog );
		gl.enableVertexAttribArray( shark_vPosition );
		gl.bindBuffer( gl.ARRAY_BUFFER, shark_Buffer );
		gl.vertexAttribPointer( shark_vPosition, 2, gl.FLOAT, false, 0, 0 );

		switch(sharkSide){
			case(0):
			// shark coming from top
			if (c_topStr > 0 && sharky < 0.25){
				sharkySpd = 0;
				c_topStr--;
			} else {
				sharkySpd = -0.01;
			}
			sharky += sharkySpd;
			if (sharky < 0.15){
				playerDead = true;
			}
			break;

			case(1):
			// shark coming from right
			if (c_rightStr > 0 && sharkx < 0.25){
				sharkxSpd = 0;
				c_rightStr--;
			} else {
				sharkxSpd = -0.01;
			}
			sharkx += sharkxSpd;
			if (sharkx < 0.15){
				playerDead = true;
			}
			break;

			case(2):
			// shark coming from bot
			if (c_bottomStr > 0 && sharky > -0.25){
				sharkySpd = 0;
				c_bottomStr--;
			} else {
				sharkySpd = 0.01;
			}
			sharky += sharkySpd;
			if (sharky > -0.15){
				playerDead = true;
			}
			break;
			
			case(3):
			// shark coming from left
			if (c_leftStr > 0 && sharkx > -0.25){
				sharkxSpd = 0;
				c_leftStr--;
			} else {
				sharkxSpd = 0.01;
			}
			sharkx += sharkxSpd;
			if (sharkx > -0.15){
				playerDead = true;
			}
			break;
		}

		gl.uniform1f( sharkyLoc, sharky );
		gl.uniform1f( sharkxLoc, sharkx );
		gl.uniform1f( thetaLoc2, theta );
		gl.drawArrays( gl.TRIANGLE_STRIP, 0, shark.length );

		gl.useProgram(sharkfin_prog);
		gl.enableVertexAttribArray(sharkfin_vPos);
		gl.bindBuffer(gl.ARRAY_BUFFER, sharkfin_Buffer);
		gl.vertexAttribPointer(sharkfin_vPos, 2, gl.FLOAT, false, 0, 0 );
		gl.uniform1f(sharkfin_thetaLoc, theta );
		gl.uniform1f(sharkfin_xLoc, sharkx);
		gl.uniform1f(sharkfin_yLoc, sharky);
		gl.uniform4fv(sharkfin_colLoc, vec4(1.0, 0.0, 1.0, 1.0));
		gl.drawArrays( gl.TRIANGLE_FAN, 0, sharkfin.length );
	}
	
	if (sharkDead){
		endNode.nodeValue = "YOU WIN! PRESS [ENTER] TO RETRY.";
	}
	
	if (playerDead){
		endNode.nodeValue = "YOU LOSE! PRESS [ENTER] TO RETRY.";
	}
	
    window.requestAnimFrame(render);
}

function rotatePlayer(){
	if (turnLeft){
		if (ptheta - sTheta < Math.PI/2)
			ptheta += Math.PI/10
		else {
			turnLeft = false;
			ptheta = ptheta%(Math.PI*2);
		}
	}
	if (turnRight){
		if (-1*(ptheta - sTheta) < Math.PI/2)
			ptheta -= Math.PI/10
		else {
			turnRight = false;
			ptheta += 2*Math.PI;
			ptheta = ptheta%(Math.PI*2);
		}
	}
}

function sharkEnter(){
	sharkSide = randomInt(4);
	if (sharkSide == 0){
		sharky = 1;
		sharkx = 0;
		theta = 0;
		sharkySpd = -0.01;
		sharkxSpd = 0;
	} else if (sharkSide == 1){
		sharky = 0;
		sharkx = 1;
		theta = 3*Math.PI/2;
		sharkySpd = 0;
		sharkxSpd = -0.01;
	} else if (sharkSide == 2){
		sharky = -1;
		sharkx = 0;
		theta = Math.PI;
		sharkySpd = 0.01;
		sharkxSpd = 0;
	} else if (sharkSide == 3){
		sharky = 0;
		sharkx = -1;
		theta = Math.PI/2;
		sharkySpd = 0;
		sharkxSpd = 0.01;
	}
}

function initText(){
	var topElement = document.getElementById("top");
	var bottomElement = document.getElementById("bottom");
	var leftElement = document.getElementById("left");
	var rightElement = document.getElementById("right");
	var hpElement = document.getElementById("hp");
	var endElement = document.getElementById("end");
	
	topNode = document.createTextNode("");
	bottomNode = document.createTextNode("");
	leftNode = document.createTextNode("");
	rightNode = document.createTextNode("");
	hpNode = document.createTextNode("");
	endNode = document.createTextNode("");
	
	topElement.appendChild(topNode);
	bottomElement.appendChild(bottomNode);
	leftElement.appendChild(leftNode);
	rightElement.appendChild(rightNode);
	hpElement.appendChild(hpNode);
	endElement.appendChild(endNode);
	
	c_topStr = c_maxStr;
	c_bottomStr = c_maxStr;
	c_leftStr = c_maxStr;
	c_rightStr = c_maxStr;
	sharkHealth = sharkMax;
}

function shootWeapon(){
	
	if ((!playerDead)&&(!sharkDead)){
	
		if (!isShooting){
			isShooting = true;
			laser_fade = 5;
		}

		if (ptheta == theta) {
			sharkScare++;
			sharkHealth--;
		}
		// reset shark after being hit 3 times
		if (sharkScare > 2 && sharkHealth > 0){
			sharkEnter();
			sharkScare = 0;
		}
	
		if (sharkHealth < 1){
			sharkDead = true;
		}
	}
}

function randomInt(range) {
  return Math.floor(Math.random() * range);
}