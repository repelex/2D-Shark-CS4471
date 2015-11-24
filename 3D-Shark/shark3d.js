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
var isShooting = false;
var slash_fade = 5;
var sharkCount = 10; // sharks to attack (no scare/health)
var sharkSide = 0;

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

var red = vec4(1.0, 0.0, 0.0, 1.0);
var black = vec4(0.0, 0.0, 0.0, 1.0);

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


var sharkMVMatrix;
var sharkMVMatrixLoc;
var sharkPMLoc;
var sharkprog;

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
    sharkprog = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
	
	// initialize elements
	initShark(); 
    initCage();
	initText();
	initExtras();
	
	//create buffers
	initBuffers();
	
	fColor = gl.getUniformLocation(program, "fColor");
	
	//create lighting and viewing
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    sharkMVMatrixLoc =  gl.getUniformLocation( sharkprog, "modelViewMatrix" );
    sharkPMLoc = gl.getUniformLocation( sharkprog, "projectionMatrix" );
    projection = ortho(-1, 1, -1, 1, -100, 100);
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct) );  
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition) );
       
    gl.uniform1f(gl.getUniformLocation(program, "shininess"),materialShininess);

    gl.uniform4fv(gl.getUniformLocation(sharkprog, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(sharkprog, "diffuseProduct"), flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(sharkprog, "specularProduct"), flatten(specularProduct) );  
    gl.uniform4fv(gl.getUniformLocation(sharkprog, "lightPosition"), flatten(lightPosition) );
       
    gl.uniform1f(gl.getUniformLocation(sharkprog, "shininess"),materialShininess);
    
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projection));
    gl.uniformMatrix4fv( sharkPMLoc, false, flatten(projection));
	
	//deploy shark
	sharkEnter();
	
    render();
}

function render(){
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
    gl.useProgram( program );
	/* gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.uniform1f(program.alphaUniform, 0.9); */
	
	//update display
	updateText();
	updateCage();
    rotateView();
	
    modelView = lookAt(eye, at, up);
    
    modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0] ));
    modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0] ));
    modelView = mult(modelView, rotate(theta[zAxis], [0, 0, 1] ));
	
	projection = perspective(fov, aspect, 0.1, 10);
    
    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelView) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projection) );

    
    

	
	//DEBUG: shark can damage walls by popping each cage array 
	// SLOW THIS DOWN!
	cn_normalsArray.pop();
	cn_pointsArray.pop();
	
	//draw slash if shooting
	if (isShooting){
		gl.bindBuffer(gl.ARRAY_BUFFER, slash_nBuffer);
		gl.vertexAttribPointer( slash_vNormal, 3, gl.FLOAT, false, 0, 0 );
		gl.bindBuffer( gl.ARRAY_BUFFER, slash_vBuffer );
		gl.vertexAttribPointer(slash_vPosition, 4, gl.FLOAT, false, 0, 0);
		gl.uniform4fv(fColor, flatten(red));
		gl.drawArrays( gl.TRIANGLES, 0, slash_pointsArray.length);
		slash_fade--;
		if (slash_fade == 0){
			isShooting = false;
		}
	}


        //draw shark
    if (sharkCount > 0){
        gl.useProgram( sharkprog );

        modelView = mult(modelView, rotate(90, [1, 0, 0] ));
        gl.uniformMatrix4fv( sharkMVMatrixLoc, false, flatten(modelView) );
        gl.uniformMatrix4fv( sharkPMLoc, false, flatten(projection) );
        
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
        gl.uniform4fv(fColor, flatten(black));
        gl.drawArrays( gl.TRIANGLES, 0, shadow_pointsArray.length);
    }
    else {
        endNode.nodeValue = "YOU WIN! PRESS [ENTER] TO RETRY.";
    }
    
    if (playerDead){
        endNode.nodeValue = "YOU LOSE! PRESS [ENTER] TO RETRY.";
    }

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
	
	shark_vNormal = gl.getAttribLocation( sharkprog, "vNormal" );
    gl.vertexAttribPointer( shark_vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( shark_vNormal );

    shark_vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, shark_vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(shark_pointsArray), gl.STATIC_DRAW );
    
    shark_vPosition = gl.getAttribLocation(sharkprog, "vPosition");
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
				1, 0, 3, 2, ct_normalsArray, ct_pointsArray);
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
	if (sharkSide == 0){
	//north
	
	} else if (sharkSide == 1){
	//south
	
	} else if (sharkSide == 2){
	//east
	
	} else if (sharkSide == 3){
	//west
	
	} else if (sharkSide == 4){
	//top
	
	} else if (sharkSide == 5){
	//bottom
	
	}
}

function handleKeyUp(event){
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
        // spacebar shoot
		shootWeapon();
    } else if (event.keyCode == 13) {
        // reload game
        location.reload();
    }
}

function shootWeapon(){
	if ((sharkCount > 0)&&(!playerDead)){
		//shoot
		if (!isShooting){
			isShooting = true;
			slash_fade = 5;
			//DEBUG kill shark
			sharkCount = 0;
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