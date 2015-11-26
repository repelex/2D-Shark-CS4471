var canvas;
var gl;

var lightPosition = vec4(-0.2, 0.3, 0.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 0.0, 0.0, 0.0, 0.0 );
var materialDiffuse = vec4( 1.0, 0.9, 1.0, 1.0);
var materialSpecular = vec4( 1.0, 0.9, 1.0, 1.0 );
var materialShininess = 100.0;

var ctm;
var ambientColor, diffuseColor, specularColor;
var modelView, projection;
var program;
var fColor;

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
var playerSide = 0;

const eye = vec3(0.0, 0.0, 0.0);
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);
var near = 0.3;
var far = 3.0;
var fov = 110.0;  // Field-of-view in Y direction angle (in degrees)
var aspect;

// cage strength
var cn_maxStr;
var cs_maxStr;
var ce_maxStr;
var cw_maxStr;
var ct_maxStr;
var cb_maxStr;

var playerDead = false;
var isSlashing = false;
var slash_fade = 5;
var sharkCount = 10; // sharks to attack (no scare/health)
var sharkSide = 0;
var sharkPrev = 0;
var sharkAxis = [];
var sharkDeg = 0;
var attack_delay = 0;

// arrays
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
var shadow_pointsArray = [];
var shadow_normalsArray = [];
var slash_pointsArray = [];
var slash_normalsArray = [];

// text variables
var northNode;
var southNode;
var eastNode;
var westNode;
var topNode;
var bottomNode;
var sharkNode;
var endNode;

// buffers
var cn_nBuffer;
var cs_nBuffer;
var ce_nBuffer;
var cw_nBuffer;
var ct_nBuffer;
var cb_nBuffer;
var shark_nBuffer;
var shadow_nBuffer;
var slash_nBuffer;
var cn_vNormal;
var cs_vNormal;
var ce_vNormal;
var cw_vNormal;
var ct_vNormal;
var cb_vNormal;
var shark_vNormal;
var shadow_vNormal;
var slash_vNormal;
var cn_vBuffer;
var cs_vBuffer;
var ce_vBuffer;
var cw_vBuffer;
var ct_vBuffer;
var cb_vBuffer;
var shark_vBuffer;
var shadow_vBuffer;
var slash_vBuffer;
var cn_vPosition;
var cs_vPosition;
var ce_vPosition;
var cw_vPosition;
var ct_vPosition;
var cb_vPosition;
var shark_vPosition;
var shadow_vPosition;
var slash_vPosition;

window.facing;
window.playerup;

var north = [1,0,0];
var south = [-1,0,0];
var east = [0,0,1];
var west = [0,0,-1];
var up_c = [0,1,0];
var down = [0,-1,0];


window.onload = function init() {
    
    canvas = document.getElementById( "gl-canvas" );
    
    // configure webgl
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    gl.viewport( 0, 0, canvas.width, canvas.height );
    aspect =  canvas.width/canvas.height;
    gl.clearColor( 0.0, 0.0, 1.0, 1.0 );
    gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
    
    //event listeners
    document.onkeyup = handleKeyUp;
	canvas.onclick = shootWeapon;
    
    // initialize shaders
	program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram(program );
	
	// initialize elements
	initShark(); 
    initCage();
	initText();
	initExtras();
	
	//create buffers
	initBuffers();
	
	//create lighting and viewing
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
    gl.useProgram( program );
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct) );  
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition) );
       
    gl.uniform1f(gl.getUniformLocation(program, "shininess"),materialShininess);
    
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projection));

	//deploy shark
	sharkEnter();
	
    facing = north;
    playerup = up_c;
    lraxis = yAxis;
    render();
}

function render(){
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram( program );
	
	//update display
	updateText();
	updateCage();
    rotateView();
	
    modelView = lookAt(eye, at, up);
    modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0] ));
    modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0] ));
    modelView = mult(modelView, rotate(theta[zAxis], [0, 0, 1] ));
	
    //draw shark
    if (sharkCount > 0){
		modelView = mult(modelView, rotate( sharkDeg, sharkAxis ));
		gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelView) );

        gl.bindBuffer(gl.ARRAY_BUFFER, shark_nBuffer);
        gl.vertexAttribPointer( shark_vNormal, 3, gl.FLOAT, false, 0, 0 );
        gl.bindBuffer( gl.ARRAY_BUFFER, shark_vBuffer );
        gl.vertexAttribPointer(shark_vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.drawArrays( gl.TRIANGLES, 0, shark_pointsArray.length);
        
        //draw shadow on opposite side
        gl.bindBuffer(gl.ARRAY_BUFFER, shadow_nBuffer);
        gl.vertexAttribPointer( shadow_vNormal, 3, gl.FLOAT, false, 0, 0 );
        gl.bindBuffer( gl.ARRAY_BUFFER, shadow_vBuffer );
        gl.vertexAttribPointer(shadow_vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.drawArrays( gl.TRIANGLES, 0, shadow_pointsArray.length);
		
		if (attack_delay > 0){
			attack_delay--;
		} else {
			//sharkAttack();
			attack_delay = 20;
		}
		
		//draw slash if slashing
		if (isSlashing){
			gl.bindBuffer(gl.ARRAY_BUFFER, slash_nBuffer);
			gl.vertexAttribPointer( slash_vNormal, 3, gl.FLOAT, false, 0, 0 );
			gl.bindBuffer( gl.ARRAY_BUFFER, slash_vBuffer );
			gl.vertexAttribPointer(slash_vPosition, 4, gl.FLOAT, false, 0, 0);
			gl.drawArrays( gl.TRIANGLES, 0, slash_pointsArray.length);
			slash_fade--;
			if (slash_fade == 0){
				isSlashing = false;
			}
		}
    }
    else {
        endNode.nodeValue = "YOU WIN! PRESS [ENTER] TO RETRY.";
    }
    
    if (playerDead){
		gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.clearColor( 1.0, 0.0, 0.0, 1.0 );
        endNode.nodeValue = "YOU LOSE! PRESS [ENTER] TO RETRY.";
    }
	
	modelView = lookAt(eye, at, up);
    modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0] ));
    modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0] ));
    modelView = mult(modelView, rotate(theta[zAxis], [0, 0, 1] ));
	
	projection = perspective(fov, aspect, 0.1, 10);
    
    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelView) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projection) );

    requestAnimFrame(render);
}

function initBuffers(){
	//north
	cn_nBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cn_nBuffer);
	gl.bufferData( gl.ARRAY_BUFFER, flatten(cn_normalsArray), gl.STATIC_DRAW );
	
	cn_vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( cn_vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( cn_vNormal );

    cn_vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cn_vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(cn_pointsArray), gl.STATIC_DRAW );
    
    cn_vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(cn_vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(cn_vPosition);
	
	//south
	cs_nBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cs_nBuffer);
	gl.bufferData( gl.ARRAY_BUFFER, flatten(cs_normalsArray), gl.STATIC_DRAW );
	
	cs_vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( cs_vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( cs_vNormal );

    cs_vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cs_vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(cs_pointsArray), gl.STATIC_DRAW );
    
    cs_vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(cs_vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(cs_vPosition);
	
	//east
	ce_nBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, ce_nBuffer);
	gl.bufferData( gl.ARRAY_BUFFER, flatten(ce_normalsArray), gl.STATIC_DRAW );
	
	ce_vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( ce_vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( ce_vNormal );

    ce_vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, ce_vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(ce_pointsArray), gl.STATIC_DRAW );
    
    ce_vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(ce_vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(ce_vPosition);
	
	//west
	cw_nBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cw_nBuffer);
	gl.bufferData( gl.ARRAY_BUFFER, flatten(cw_normalsArray), gl.STATIC_DRAW );
	
	cw_vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( cw_vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( cw_vNormal );

    cw_vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cw_vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(cw_pointsArray), gl.STATIC_DRAW );
    
    cw_vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(cw_vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(cw_vPosition);
	
	//top
	ct_nBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, ct_nBuffer);
	gl.bufferData( gl.ARRAY_BUFFER, flatten(ct_normalsArray), gl.STATIC_DRAW );
	
	ct_vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( ct_vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( ct_vNormal );

    ct_vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, ct_vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(ct_pointsArray), gl.STATIC_DRAW );
    
    ct_vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(ct_vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(ct_vPosition);
	
	//bottom
	cb_nBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cb_nBuffer);
	gl.bufferData( gl.ARRAY_BUFFER, flatten(cb_normalsArray), gl.STATIC_DRAW );
	
	cb_vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( cb_vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( cb_vNormal );

    cb_vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cb_vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(cb_pointsArray), gl.STATIC_DRAW );
    
    cb_vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(cb_vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(cb_vPosition);
	
	//shark
	shark_nBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, shark_nBuffer);
	gl.bufferData( gl.ARRAY_BUFFER, flatten(shark_normalsArray), gl.STATIC_DRAW );
	
	shark_vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( shark_vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( shark_vNormal );

    shark_vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, shark_vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(shark_pointsArray), gl.STATIC_DRAW );
    
    shark_vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(shark_vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shark_vPosition);
	
	//shadow
	shadow_nBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, shadow_nBuffer);
	gl.bufferData( gl.ARRAY_BUFFER, flatten(shadow_normalsArray), gl.STATIC_DRAW );
	
	shadow_vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( shadow_vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( shadow_vNormal );

    shadow_vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, shadow_vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(shadow_pointsArray), gl.STATIC_DRAW );
    
    shadow_vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(shadow_vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shadow_vPosition);
	
	//slash
	slash_nBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, slash_nBuffer);
	gl.bufferData( gl.ARRAY_BUFFER, flatten(slash_normalsArray), gl.STATIC_DRAW );
	
	slash_vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( slash_vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( slash_vNormal );

    slash_vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, slash_vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(slash_pointsArray), gl.STATIC_DRAW );
    
    slash_vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(slash_vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(slash_vPosition);
	
}

function quad(v, a, b, c, d, nA, pA){

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

function updateCage(){
	// redraws cages if still strong
	if (cn_pointsArray.length > 0){
		gl.bindBuffer(gl.ARRAY_BUFFER, cn_nBuffer);
		gl.vertexAttribPointer( cn_vNormal, 3, gl.FLOAT, false, 0, 0 );
		gl.bindBuffer( gl.ARRAY_BUFFER, cn_vBuffer );
		gl.vertexAttribPointer(cn_vPosition, 4, gl.FLOAT, false, 0, 0);
		gl.drawArrays( gl.TRIANGLES, 0, cn_pointsArray.length);
	}
	if (cs_pointsArray.length > 0){
		gl.bindBuffer(gl.ARRAY_BUFFER, cs_nBuffer);
		gl.vertexAttribPointer( cs_vNormal, 3, gl.FLOAT, false, 0, 0 );
		gl.bindBuffer( gl.ARRAY_BUFFER, cs_vBuffer );
		gl.vertexAttribPointer(cs_vPosition, 4, gl.FLOAT, false, 0, 0);
		gl.drawArrays( gl.TRIANGLES, 0, cs_pointsArray.length);
	}
	if (ce_pointsArray.length > 0){
		gl.bindBuffer(gl.ARRAY_BUFFER, ce_nBuffer);
		gl.vertexAttribPointer( ce_vNormal, 3, gl.FLOAT, false, 0, 0 );
		gl.bindBuffer( gl.ARRAY_BUFFER, ce_vBuffer );
		gl.vertexAttribPointer(ce_vPosition, 4, gl.FLOAT, false, 0, 0);
		gl.drawArrays( gl.TRIANGLES, 0, ce_pointsArray.length);
	}
	if (cw_pointsArray.length > 0){
		gl.bindBuffer(gl.ARRAY_BUFFER, cw_nBuffer);
		gl.vertexAttribPointer( cw_vNormal, 3, gl.FLOAT, false, 0, 0 );
		gl.bindBuffer( gl.ARRAY_BUFFER, cw_vBuffer );
		gl.vertexAttribPointer(cw_vPosition, 4, gl.FLOAT, false, 0, 0);
		gl.drawArrays( gl.TRIANGLES, 0, cw_pointsArray.length);
	}
	if (ct_pointsArray.length > 0){
		gl.bindBuffer(gl.ARRAY_BUFFER, ct_nBuffer);
		gl.vertexAttribPointer( ct_vNormal, 3, gl.FLOAT, false, 0, 0 );
		gl.bindBuffer( gl.ARRAY_BUFFER, ct_vBuffer );
		gl.vertexAttribPointer(ct_vPosition, 4, gl.FLOAT, false, 0, 0);
		gl.drawArrays( gl.TRIANGLES, 0, ct_pointsArray.length);
	}
	if (cb_pointsArray.length > 0){
		gl.bindBuffer(gl.ARRAY_BUFFER, cb_nBuffer);
		gl.vertexAttribPointer( cb_vNormal, 3, gl.FLOAT, false, 0, 0 );
		gl.bindBuffer( gl.ARRAY_BUFFER, cb_vBuffer );
		gl.vertexAttribPointer(cb_vPosition, 4, gl.FLOAT, false, 0, 0);
		gl.drawArrays( gl.TRIANGLES, 0, cb_pointsArray.length);
	}
}

function initCage(){
	//cage north
	for (i = 0; i < 10; i++){
		if (i%2 > 0){
		quad([	vec4( -0.5 + (i*0.1), -0.5, -0.5, 1.0 ),
				vec4( -0.5 + (i*0.1),  0.5, -0.5, 1.0 ),
				vec4( -0.4 + (i*0.1),  0.5, -0.5, 1.0 ),
				vec4( -0.4 + (i*0.1), -0.5, -0.5, 1.0 )], 
				0, 1, 2, 3, cn_normalsArray, cn_pointsArray);
		}
	}
	//cage south
	for (i = 0; i < 10; i++){
		if (i%2 > 0){
		quad([	vec4( 0.4 - (i*0.1), -0.5,  0.5, 1.0 ),
				vec4( 0.4 - (i*0.1),  0.5,  0.5, 1.0 ),
				vec4( 0.5 - (i*0.1), 0.5,  0.5, 1.0 ),
				vec4( 0.5 - (i*0.1), -0.5,  0.5, 1.0 )],
				1, 0, 3, 2, cs_normalsArray, cs_pointsArray);
		}
	}
	//cage east
	for (i = 0; i < 10; i++){
		if (i%2 > 0){
		quad([	vec4( 0.5, -0.5, -0.5 + (i*0.1), 1.0 ),
				vec4( 0.5,  0.5, -0.5 + (i*0.1), 1.0 ),
				vec4( 0.5,  0.5, -0.4 + (i*0.1), 1.0 ),
				vec4( 0.5, -0.5, -0.4 + (i*0.1), 1.0 )],
				0, 1, 2, 3, ce_normalsArray, ce_pointsArray);
		}
	}
	//cage west
	for (i = 0; i < 10; i++){
		if (i%2 > 0){
		quad([	vec4( -0.5, -0.5, 0.5 - (i*0.1), 1.0 ),
				vec4( -0.5,  0.5, 0.5 - (i*0.1), 1.0 ),
				vec4( -0.5,  0.5, 0.4 - (i*0.1), 1.0 ),
				vec4( -0.5, -0.5, 0.4 - (i*0.1), 1.0 )],
				0, 1, 2, 3, cw_normalsArray, cw_pointsArray);
		}
	}
	//cage top
	for (i = 0; i < 10; i++){
		if (i%2 > 0){
		quad([	vec4( -0.5, 0.5, 0.4- (i*0.1), 1.0 ),
				vec4( -0.5, 0.5, 0.5 - (i*0.1), 1.0 ),
				vec4( 0.5,  0.5, 0.5 - (i*0.1), 1.0 ),
				vec4( 0.5, 0.5, 0.4 - (i*0.1), 1.0 )],
				0, 1, 2, 3, ct_normalsArray, ct_pointsArray);
		}
	}
	//cage bottom
	for (i = 0; i < 10; i++){
		if (i%2 > 0){
		quad([	vec4( -0.5, -0.5, -0.5 + (i*0.1), 1.0 ),
				vec4( -0.5, -0.5, -0.4 + (i*0.1), 1.0 ),
				vec4( 0.5,  -0.5, -0.4 + (i*0.1), 1.0 ),
				vec4( 0.5, -0.5, -0.5 + (i*0.1), 1.0 )],
				1, 0, 3, 2, cb_normalsArray, cb_pointsArray);
		}
	}
}

function initShark(){
	// initialize shark
	var shark = [
		vec4( -0.3, -0.3, -0.6, 1.0 ),
        vec4( -0.45,  0.45, -0.6, 1.0 ),
        vec4( 0.45,  0.45, -0.6, 1.0 ),
        vec4( 0.3, -0.3, -0.6, 1.0 )
	];
	var sharkmouth = [
		vec4( -0.1, -0.1, -0.55, 1.0 ),
        vec4( -0.2,  0.1, -0.55, 1.0 ),
        vec4( 0.2,  0.1, -0.55, 1.0 ),
        vec4( 0.1, -0.1, -0.55, 1.0 )
	];
	var sharkeye1 = [
		vec4( -0.35, 0.35, -0.55, 1.0 ),
        vec4( -0.3,  0.35, -0.55, 1.0 ),
        vec4( -0.2,  0.35, -0.55, 1.0 ),
        vec4( -0.3, 0.25, -0.55, 1.0 )
	];
	var sharkeye2 = [
		vec4( 0.35, 0.35, -0.55, 1.0 ),
        vec4( 0.3,  0.35, -0.55, 1.0 ),
        vec4( 0.2,  0.35, -0.55, 1.0 ),
        vec4( 0.3, 0.25, -0.55, 1.0 )
	];
	
	quad(shark, 1, 0, 3, 2, shark_normalsArray, shark_pointsArray);
	quad(sharkmouth, 0, 1, 2, 3, shark_normalsArray, shark_pointsArray);
	quad(sharkeye1, 0, 1, 3, 2, shark_normalsArray, shark_pointsArray);
	quad(sharkeye2, 1, 0, 3, 2, shark_normalsArray, shark_pointsArray);
}

function initExtras(){
	//init shadow and slash
	var shadow = [
		vec4( -0.4, -0.4, 0.4, 1.0 ),
        vec4( -0.4,  0.4, 0.4, 1.0 ),
        vec4( 0.4,  0.4, 0.4, 1.0 ),
        vec4( 0.4, -0.4, 0.4, 1.0 )
	];
	
	quad(shadow, 0, 1, 2, 3, shadow_normalsArray, shadow_pointsArray);
	
	var slash = [
		vec4( -0.4, -0.3, -0.3, 1.0 ),
        vec4( 0.1, 0.1, -0.3, 1.0 ),
		vec4( 0.1, 0.1, -0.3, 1.0 ),
        vec4( 0.4,  0.3, -0.3, 1.0 )
	];
	
	quad(slash, 0, 1, 2, 3, slash_normalsArray, slash_pointsArray);
}

function sharkEnter(){
	sharkSide = randomInt(6);
	if (sharkSide == sharkPrev){
		//dont enter from previous side
		sharkEnter();
	} else {
		if (sharkSide == 0){
			//north
			sharkAxis = [0, 1, 0];
			sharkDeg = 0;
		} else if (sharkSide == 1){
			//south
			sharkAxis = [0, 1, 0];
			sharkDeg = 180;
		} else if (sharkSide == 2){
			//east
			sharkAxis = [0, 1, 0];
			sharkDeg = 270;
		} else if (sharkSide == 3){
			//west
			sharkAxis = [0, 1, 0];
			sharkDeg = 90;
		} else if (sharkSide == 4){
			//top
			sharkAxis = [1, 0, 0];
			sharkDeg = 90;
		} else {
			//bottom
			sharkAxis = [1, 0, 0];
			sharkDeg = 270;
		}
		sharkPrev = sharkSide;
	}
}

function sharkAttack(){
	switch(sharkSide){
		case(0):
			//north
			cn_normalsArray.pop();
			cn_pointsArray.pop();
				
			if (cn_normalsArray.length == 0){
				playerDead = true;
			}
			break;
		case(1):
			//south
			cs_normalsArray.pop();
			cs_pointsArray.pop();
			
			if (cs_normalsArray.length == 0){
				playerDead = true;
			}
			break;
		case(2):
			//east
			ce_normalsArray.pop();
			ce_pointsArray.pop();
				
			if (ce_normalsArray.length == 0){
				playerDead = true;
			}
			break;
		case(3):
			//west
			cw_normalsArray.pop();
			cw_pointsArray.pop();
				
			if (cw_normalsArray.length == 0){
				playerDead = true;
			}
			break;
		case(4):
			//top
			ct_normalsArray.pop();
			ct_pointsArray.pop();
				
			if (ct_normalsArray.length == 0){
				playerDead = true;
			}
			break;
			
		default:
			//bottom
			cb_normalsArray.pop();
			cb_pointsArray.pop();

			if (cb_normalsArray.length == 0){
				playerDead = true;
			}
			break;
	}
}

function handleKeyUp(event){
	if (event.keyCode == 37 || event.keyCode ==  65) {
        // left arrow key or A
        axis = yAxis;
		if (!turning){
            if (playerup == down) {
                turnRight = true;
                turnLeft = false;
            } else {
                turnRight = false;
                turnLeft = true;
            }
			degToTurn = 90;
			turning = true;
            facing = changePlayerView("left");
		}
    } else if (event.keyCode == 39 || event.keyCode == 68) {
        // right arrow key or D
		axis = yAxis;

		if (!turning){
    		if (playerup == down) {
                turnRight = false;
                turnLeft = true;
            } else {
                turnRight = true;
                turnLeft = false;
            }
    		degToTurn = 90;
    		turning = true;
            facing = changePlayerView("right");
		}
    } else if (event.keyCode == 38 || event.keyCode == 87) {
        // up key or W
		axis = xAxis;
		if (!turning){
            facing = changePlayerView("up");
			turnLeft = true;
			turnRight = false;
			degToTurn = 90;
			turning = true;
		}
    } else if (event.keyCode == 40 || event.keyCode == 83) {
        // down key or S
		axis = xAxis;
		if (!turning){
            facing = changePlayerView("down");
			turnLeft = false;
			turnRight = true;
			degToTurn = 90;
			turning = true;
		}
    } else if (event.keyCode == 32) {
        // spacebar shoot
		shootWeapon();
    } else if (event.keyCode == 13) {
        // reload game
        location.reload();
    }
    if (event.keyCode == 16){
        alert(facing);
    }
}

function shootWeapon(){
	if ((sharkCount > 0)&&(!playerDead)){
		//shoot
		if (!isSlashing){
			isSlashing = true;
			slash_fade = 5;
		}
		
		if (sharkSide == playerSide){
			sharkCount--;
			sharkEnter();
		}
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

function changePlayerView(direction){
    if (direction == "left"){
        if (playerup == up_c){
            if (facing == north) return west;
            if (facing == west) return south;
            if (facing == south) return east;
            if (facing == east) return north;
        }
        if (playerup == down){
            if (facing == north) return east;
            if (facing == west) return north;
            if (facing == south) return west;
            if (facing == east) return south;
        }
        if (playerup == south){
            playerup = east;
            return facing;
        }
        if (playerup == west){
            playerup = south;
            return facing;
        }
        if (playerup == north){
            playerup = west;
            return facing;
        }
        if (playerup == east){
            playerup = north;
            return facing;
        }
    }
    if (direction == "right"){
        if (playerup == up_c){
            if (facing == north) return east;
            if (facing == west) return north;
            if (facing == south) return west;
            if (facing == east) return south;
        }
        if (playerup == down){
            if (facing == north) return west;
            if (facing == west) return south;
            if (facing == south) return east;
            if (facing == east) return north;
        }
        if (playerup == south){
            playerup = west;
            return facing;
        }
        if (playerup == west){
            playerup = north;
            return facing;
        }
        if (playerup == north){
            playerup = east;
            return facing;
        }
        if (playerup == east){
            playerup = south;
            return facing;
        }
    }
    if (direction == "up"){
        if (playerup == up_c){
            if (facing == north) playerup = south;
            if (facing == south) playerup = north;
            if (facing == west) playerup = east;
            if (facing == east) playerup = west;
            return up_c;
        }
        if (playerup == down){
            if (facing == north) playerup = south;
            if (facing == south) playerup = north;
            if (facing == west) playerup = east;
            if (facing == east) playerup = wast;
            return down; 
        }
        if (playerup == south){
            if (facing == up_c) playerup = down;
            if (facing == down) playerup = up_c;
            return south;
        }
        if (playerup == north){
            if (facing == up_c) playerup = down;
            if (facing == down) playerup = up_c;
            return north;
        }
        if (playerup == east){
            if (facing == up_c) playerup = down;
            if (facing == down) playerup = up_c;
            return east;
        }
        if (playerup == west){
            if (facing == up_c) playerup = down;
            if (facing == down) playerup = up_c;
            return west;
        }
        
    }
    if (direction == "down"){
        if (playerup == up_c){
            if (facing == north) playerup = north;
            if (facing == south) playerup = south;
            if (facing == west) playerup = west;
            if (facing == east) playerup = east;
            return down;
        }
        if (playerup == down){
            if (facing == north) playerup = north;
            if (facing == south) playerup = south;
            if (facing == west) playerup = wast;
            if (facing == east) playerup = east;
            return up_c; 
        }
        if (playerup == south){
            if (facing == up_c) playerup = up_c;
            if (facing == down) playerup = down;
            return north;
        }
        if (playerup == north){
            if (facing == up_c) playerup = up_c;
            if (facing == down) playerup = down;
            return south;
        }
        if (playerup == east){
            if (facing == up_c) playerup = up_c;
            if (facing == down) playerup = down;
            return west;
        }
        if (playerup == west){
            if (facing == up_c) playerup = up_c;
            if (facing == down) playerup = down;
            return east;
        }
        
    }    
    return [2,2,2];
}

function updateText(){
	// redraws display text
	northNode.nodeValue = ((cn_normalsArray.length/cn_maxStr)*100).toFixed(0) + "%";
	southNode.nodeValue = ((cs_normalsArray.length/cs_maxStr)*100).toFixed(0) + "%";
	eastNode.nodeValue = ((ce_normalsArray.length/ce_maxStr)*100).toFixed(0) + "%";
	westNode.nodeValue = ((cw_normalsArray.length/cw_maxStr)*100).toFixed(0) + "%";
	topNode.nodeValue = ((ct_normalsArray.length/ct_maxStr)*100).toFixed(0) + "%";
	bottomNode.nodeValue = ((cb_normalsArray.length/cb_maxStr)*100).toFixed(0) + "%";
	sharkNode.nodeValue = sharkCount;
	endNode.nodeValue = "";
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
	
	cn_maxStr = cn_normalsArray.length;
	cs_maxStr = cn_normalsArray.length;
	ce_maxStr = cn_normalsArray.length;
	cw_maxStr = cn_normalsArray.length;
	ct_maxStr = cn_normalsArray.length;
	cb_maxStr = cn_normalsArray.length;
}


function randomInt(range) {
  return Math.floor(Math.random() * range);
}