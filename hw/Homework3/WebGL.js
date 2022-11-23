var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_normalMatrix;
    uniform mat4 u_LightMatrix;
    uniform vec4 u_LightPosition;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    varying vec3 v_LightPosition;
    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
        v_LightPosition = (u_LightMatrix * u_LightPosition).xyz;
        v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
    }    
`;

var FSHADER_SOURCE = `
    precision mediump float;
    // uniform vec3 u_LightPosition;
    uniform vec3 u_ViewPosition;
    uniform float u_Ka;
    uniform float u_Kd;
    uniform float u_Ks;
    uniform float u_shininess;
    uniform vec3 u_Color;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    varying vec3 v_LightPosition;
    void main(){
        // let ambient and diffuse color are u_Color 
        // (you can also input them from ouside and make them different)
        vec3 ambientLightColor = u_Color;
        vec3 diffuseLightColor = u_Color;
        // assume white specular light (you can also input it from ouside)
        vec3 specularLightColor = vec3(1.0, 1.0, 1.0);        

        vec3 ambient = ambientLightColor * u_Ka;

        vec3 normal = normalize(v_Normal);
        vec3 lightDirection = normalize(v_LightPosition - v_PositionInWorld);
        float nDotL = max(dot(lightDirection, normal), 0.0);
        vec3 diffuse = diffuseLightColor * u_Kd * nDotL;

        vec3 specular = vec3(0.0, 0.0, 0.0);
        if(nDotL > 0.0) {
            vec3 R = reflect(-lightDirection, normal);
            // V: the vector, point to viewer       
            vec3 V = normalize(u_ViewPosition - v_PositionInWorld); 
            float specAngle = clamp(dot(R, V), 0.0, 1.0);
            specular = u_Ks * pow(specAngle, u_shininess) * specularLightColor; 
        }

        gl_FragColor = vec4( ambient + diffuse + specular, 1.0 );
    }
`;

function compileShader(gl, vShaderText, fShaderText){
    //////Build vertex and fragment shader objects
    var vertexShader = gl.createShader(gl.VERTEX_SHADER)
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    //The way to  set up shader text source
    gl.shaderSource(vertexShader, vShaderText)
    gl.shaderSource(fragmentShader, fShaderText)
    //compile vertex shader
    gl.compileShader(vertexShader)
    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        console.log('vertex shader ereror');
        var message = gl.getShaderInfoLog(vertexShader); 
        console.log(message);//print shader compiling error message
    }
    //compile fragment shader
    gl.compileShader(fragmentShader)
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        console.log('fragment shader ereror');
        var message = gl.getShaderInfoLog(fragmentShader);
        console.log(message);//print shader compiling error message
    }

    /////link shader to program (by a self-define function)
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    //if not success, log the program info, and delete it.
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
        alert(gl.getProgramInfoLog(program) + "");
        gl.deleteProgram(program);
    }

    return program;
}

/////BEGIN:///////////////////////////////////////////////////////////////////////////////////////////////
/////The folloing three function is for creating vertex buffer, but link to shader to user later//////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
function initAttributeVariable(gl, a_attribute, buffer){
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute);
}

function initArrayBufferForLaterUse(gl, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // Store the necessary information to assign the object to the attribute variable later
  buffer.num = num;
  buffer.type = type;

  return buffer;
}

function initVertexBufferForLaterUse(gl, vertices, normals, texCoords){
  var nVertices = vertices.length / 3;

  var o = new Object();
  o.vertexBuffer = initArrayBufferForLaterUse(gl, new Float32Array(vertices), 3, gl.FLOAT);
  if( normals != null ) o.normalBuffer = initArrayBufferForLaterUse(gl, new Float32Array(normals), 3, gl.FLOAT);
  if( texCoords != null ) o.texCoordBuffer = initArrayBufferForLaterUse(gl, new Float32Array(texCoords), 2, gl.FLOAT);
  //you can have error check here
  o.numVertices = nVertices;

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o;
}
/////END://///////////////////////////////////////////////////////////////////////////////////////////////
/////The folloing three function is for creating vertex buffer, but link to shader to user later//////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

///// normal vector calculation (for the cube)
function getNormalOnVertices(vertices){
  var normals = [];
  var nTriangles = vertices.length/9;
  for(let i=0; i < nTriangles; i ++ ){
      var idx = i * 9 + 0 * 3;
      var p0x = vertices[idx+0], p0y = vertices[idx+1], p0z = vertices[idx+2];
      idx = i * 9 + 1 * 3;
      var p1x = vertices[idx+0], p1y = vertices[idx+1], p1z = vertices[idx+2];
      idx = i * 9 + 2 * 3;
      var p2x = vertices[idx+0], p2y = vertices[idx+1], p2z = vertices[idx+2];

      var ux = p1x - p0x, uy = p1y - p0y, uz = p1z - p0z;
      var vx = p2x - p0x, vy = p2y - p0y, vz = p2z - p0z;

      var nx = uy*vz - uz*vy;
      var ny = uz*vx - ux*vz;
      var nz = ux*vy - uy*vx;

      var norm = Math.sqrt(nx*nx + ny*ny + nz*nz);
      nx = nx / norm;
      ny = ny / norm;
      nz = nz / norm;

      normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
  }
  return normals;
}

var vertexNormalArray = [];

function getSphereVertices(radius, latitudinalNum, longitudinalNum)
{
  var latipace = 1.0 / latitudinalNum;
  var logtpace = 1.0 / longitudinalNum;
  var vertexPosArray = [];

  for(var i = 0; i <= latitudinalNum; ++i)
  {
    for(var j = 0; j <= longitudinalNum; ++j)
    {  
      var x =  Math.cos(2 * Math.PI * j * logtpace) * Math.sin(Math.PI * i * latipace);
      var y =  Math.sin(-Math.PI / 2 + Math.PI * i * latipace); 
      var z =  Math.sin(2 * Math.PI * j * logtpace) * Math.sin(Math.PI * i * latipace);
      

      vertexPosArray.push([x * radius, y * radius, z * radius]);
    }
  }
  
  var retVer = [];

  for(var i = 0; i < latitudinalNum; ++i)
  {
    for(var j = 0; j < longitudinalNum; ++j)
    {
      retVer = retVer.concat(vertexPosArray[i * (longitudinalNum + 1) + j]);
      retVer = retVer.concat(vertexPosArray[(i + 1) * (longitudinalNum + 1) + j]);
      retVer = retVer.concat(vertexPosArray[i * (longitudinalNum + 1) + (j + 1)]);

      retVer = retVer.concat(vertexPosArray[i * (longitudinalNum + 1) + (j + 1)]);
      retVer = retVer.concat(vertexPosArray[(i + 1) * (longitudinalNum + 1) + j]);
      retVer = retVer.concat(vertexPosArray[(i + 1) * (longitudinalNum + 1) + (j + 1)]);
    }
  }

  return retVer;
}

var mouseLastX, mouseLastY;
var mouseDragging = false;
var angleX = 0, angleY = 0;
var gl, canvas;
var mvpMatrix;
var modelMatrix;
var normalMatrix;
var nVertex;
var cameraX = 3, cameraY = 5, cameraZ = 7;
var landor = [];
var cat = [];
var cube = [];
var sphere = [];
var pyramid = [];
var moveDistance = 0;
var rotateAngle = 0;
var zoomScale = 1;
var lightpos = [0.0, 5.0, 0.0, 0.0];
var joint1 = 0.0;
var joint2 = 0.0;
var joint3 = 0.0;
var siz = 0.0;
var ty = 0.0;
var tx = 0.0;

async function main(){
    canvas = document.getElementById('webgl');
    gl = canvas.getContext('webgl2');
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return ;
    }

    program = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);

    gl.useProgram(program);

    program.a_Position = gl.getAttribLocation(program, 'a_Position'); 
    program.a_Normal = gl.getAttribLocation(program, 'a_Normal'); 
    program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix'); 
    program.u_modelMatrix = gl.getUniformLocation(program, 'u_modelMatrix'); 
    program.u_normalMatrix = gl.getUniformLocation(program, 'u_normalMatrix');
    program.u_LightMatrix = gl.getUniformLocation(program, 'u_LightMatrix');
    program.u_LightPosition = gl.getUniformLocation(program, 'u_LightPosition');
    program.u_ViewPosition = gl.getUniformLocation(program, 'u_ViewPosition');
    program.u_Ka = gl.getUniformLocation(program, 'u_Ka'); 
    program.u_Kd = gl.getUniformLocation(program, 'u_Kd');
    program.u_Ks = gl.getUniformLocation(program, 'u_Ks');
    program.u_shininess = gl.getUniformLocation(program, 'u_shininess');
    program.u_Color = gl.getUniformLocation(program, 'u_Color'); 

    /////3D model landor
    response = await fetch('landor.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for( let i=0; i < obj.geometries.length; i ++ ){
      let o = initVertexBufferForLaterUse(gl, 
                                          obj.geometries[i].data.position,
                                          obj.geometries[i].data.normal, 
                                          obj.geometries[i].data.texcoord);
      landor.push(o);
    }

    /////3D model cat
    response = await fetch('cat.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for( let i=0; i < obj.geometries.length; i ++ ){
      let o = initVertexBufferForLaterUse(gl, 
                                          obj.geometries[i].data.position,
                                          obj.geometries[i].data.normal, 
                                          obj.geometries[i].data.texcoord);
      cat.push(o);
    }

    ////cube
    //TODO-1: create vertices for the cube whose edge length is 2.0 (or 1.0 is also fine)
    //F: Face, T: Triangle, V: vertex (XYZ)
    cubeVertices = [ 1.0,  1.0,  1.0, -1.0,  1.0,  1.0, -1.0, -1.0,  1.0,  1.0,  1.0,  1.0, -1.0, -1.0,  1.0,  1.0, -1.0,  1.0, 
                     1.0,  1.0,  1.0,  1.0, -1.0,  1.0,  1.0, -1.0, -1.0,  1.0,  1.0,  1.0,  1.0, -1.0, -1.0,  1.0,  1.0, -1.0,
                     1.0,  1.0,  1.0,  1.0,  1.0, -1.0, -1.0,  1.0, -1.0,  1.0,  1.0,  1.0, -1.0,  1.0, -1.0, -1.0,  1.0,  1.0,
                    -1.0,  1.0,  1.0, -1.0,  1.0, -1.0, -1.0, -1.0, -1.0, -1.0,  1.0,  1.0, -1.0, -1.0, -1.0, -1.0, -1.0,  1.0,
                    -1.0, -1.0, -1.0,  1.0, -1.0, -1.0,  1.0, -1.0,  1.0, -1.0, -1.0, -1.0,  1.0, -1.0,  1.0, -1.0, -1.0,  1.0,
                     1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0,  1.0, -1.0,  1.0, -1.0, -1.0, -1.0,  1.0, -1.0,  1.0,  1.0, -1.0
                  ];
    cubeNormals = getNormalOnVertices(cubeVertices);
    let o = initVertexBufferForLaterUse(gl, cubeVertices, cubeNormals, null);
    cube.push(o);

    sphereVertices =  getSphereVertices(0.5, 64, 32);

    sphereNormals = getNormalOnVertices(sphereVertices);

    let s = initVertexBufferForLaterUse(gl, sphereVertices, sphereNormals, null);
    sphere.push(s);

    pyramidVertices =  [0.0, 0.0, -1.0, -6.021646, 0.0, 0.0, 0.0, 0.0, 1.0, -1.7707259999999998, -1.007321, 1.0, 0.0, 0.0, 1.0, -6.021646, 0.0, 0.0, -6.021646, 0.0, 0.0, -1.7707259999999998, -1.007321, -1.0, -1.7707259999999998, -1.007321, 1.0, 0.0, 0.0, -1.0, -1.7707259999999998, -1.007321, 1.0, -1.7707259999999998, -1.007321, -1.0, -6.021646, 0.0, 0.0, 0.0, 0.0, -1.0, -1.7707259999999998, -1.007321, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, 1.0, -1.7707259999999998, -1.007321, 1.0];

    pyramidNormals = getNormalOnVertices(pyramidVertices);

    let p = initVertexBufferForLaterUse(gl, pyramidVertices, pyramidNormals, null);
    pyramid.push(p);

    mvpMatrix = new Matrix4();
    modelMatrix = new Matrix4();
    normalMatrix = new Matrix4();

    gl.enable(gl.DEPTH_TEST);

    draw();//draw it once before mouse move

    canvas.onmousedown = function(ev){mouseDown(ev)};
    canvas.onmousemove = function(ev){mouseMove(ev)};
    canvas.onmouseup = function(ev){mouseUp(ev)};

    var slider1 = document.getElementById("move");
    slider1.oninput = function() {
        moveDistance = this.value/60.0
        draw();
    }

    var slider2 = document.getElementById("rotate");
    slider2.oninput = function() {
        rotateAngle = this.value 
        draw();
    }

    var slider3 = document.getElementById("zoom");
    slider3.oninput = function() {
        zoomScale = 1 + this.value / 100 
        draw();
    }
    
    //setup the call back function of tx Sliders
    var dir = -1;
    var txSlider = document.getElementById("Translate-X");
    txSlider.oninput = function() {
        tx = this.value / 100.0; //convert sliders value to -1 to +1
        joint1 += 10 * dir;
        joint3 +=  10 * dir;
        if(joint1 > 45.0)
        {
          dir *= -1;
        }
        else if(joint1 < -45.0)
        {
          dir *= -1;
        }
        draw(gl);
    }

    var tySlider = document.getElementById("Translate-Y");
    tySlider.oninput = function() {
        ty = this.value / 100.0; //convert sliders value to -1 to +1
        joint1 += 10 * dir;
        joint3 +=  10 * dir;
        if(joint1 > 45.0)
        {
          dir *= -1;
        }
        else if(joint1 < -45.0)
        {
          dir *= -1;
        }
        draw(gl);
    }    

    //setup the call back function of red arm rotation Sliders
    var jointRedSlider = document.getElementById("joint1");
    jointRedSlider.oninput = function() {
        joint1 = this.value * -1;
        draw(gl);
    }

    //setup the call back function of green arm rotation Sliders
    var jointGreenSlider = document.getElementById("joint2");
    jointGreenSlider.oninput = function() {
        joint2 = -1 * this.value; //convert sliders value to 0 to 45 degrees
        draw(gl);
    }

    //setup the call back function of yellow arm rotation Sliders
    var jointYellowSlider = document.getElementById("joint3");
    jointYellowSlider.oninput = function() {
        joint3 = this.value *  -1; //convert sliders value to 0 to -45 degrees
        draw(gl);
    }

    var sizeSlider = document.getElementById("SIZE");
    sizeSlider.oninput = function() {
        siz = this.value / 100.0; //convert sliders value to -1 to +1
        draw(gl);
    }    
}

/////Call drawOneObject() here to draw all object one by one 
////   (setup the model matrix and color to draw)
function draw(){
    gl.clearColor(0.5,0.5,0.5,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let mdlMatrix = new Matrix4(); //model matrix of objects

    //Cube (ground)
    //TODO-1: set mdlMatrix for the cube
    mdlMatrix.setIdentity();
    mdlMatrix.scale(3.0, 0.01, 3.0)
    drawOneObject(cube, mdlMatrix, 1.0, 0.4, 0.4);

    mdlMatrix.setIdentity();
    mdlMatrix.translate(lightpos[0], lightpos[1], lightpos[2]);
    mdlMatrix.scale(0.5, 0.5, 0.5);
    drawOneObject(sphere, mdlMatrix, 1.0, 1.0, 1.0);

    drawPairWing();
    //landor
    //TODO-2: set mdlMatrix for landor
    mdlMatrix.setIdentity();
    mdlMatrix.translate(0.0, 1.6, -1.0);
    mdlMatrix.rotate(180, 0, 1, 0)
    mdlMatrix.scale(0.075, 0.075, 0.075);
    drawOneObject(landor, mdlMatrix, 0.8, 0.8, 0.8);

    //cat
    //TODO-3: set mdlMatrix for cat (include rotation and movement)
    mdlMatrix.setIdentity();
    mdlMatrix.translate(moveDistance + 2, 0.0, 0.0);
    mdlMatrix.rotate(-90, 1.0, 0.0, 0.0);
    mdlMatrix.rotate(rotateAngle, 0.0, 0.0, 1.0);
    mdlMatrix.scale(0.03, 0.03, 0.03);
    drawOneObject(cat, mdlMatrix, 0.3, 0.3, 0.3);
}

var transformMat = new Matrix4();
var matStack = [];
function pushMatrix(){
    matStack.push(new Matrix4(transformMat));
}
function popMatrix(){
    transformMat = matStack.pop();
}


function drawPairWing()
{
  var mdlMatrix = new Matrix4();
  
  mdlMatrix.setIdentity();
  mdlMatrix.translate(tx, 0.0, ty);
  mdlMatrix.scale(0.5 * (1 + siz), 0.5 * (1 + siz),0.5 * (1 + siz));
  mdlMatrix.translate(0.0, 1.5, 0.0);
  drawOneObject(sphere, mdlMatrix, 1.0, 1.0, 0.0);

  mdlMatrix.setIdentity();
  mdlMatrix.translate(tx, 0.0, ty);
  mdlMatrix.scale(0.1 * (1 + siz), 0.1 * (1 + siz), 0.1 * (1 + siz));
  mdlMatrix.translate(3, 7.5, 0.0);
  mdlMatrix.rotate(45, 1.0, 0.0, 0.0);
  drawWing(mdlMatrix);

  mdlMatrix.setIdentity();
  mdlMatrix.translate(tx, 0.0, ty);
  mdlMatrix.scale(-1.0, 1.0, 1.0);
  mdlMatrix.scale(0.1 * (1 + siz), 0.1 * (1 + siz), 0.1 * (1 + siz));
  mdlMatrix.translate(3, 7.5, 0.0);
  mdlMatrix.rotate(45, 1.0, 0.0, 0.0);
  drawWing(mdlMatrix)  
}

function drawWing(mdlMatrix)
{
    //whole Wing
    // transformMat.setIdentity();
    transformMat = mdlMatrix;
    pushMatrix();

    drawOneObject(sphere, transformMat, 0.0, 0.0, 1.0);
    // transformMat.translate(0.1, 0.0, 0.0);
    // gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    // gl.drawArrays(gl.TRIANGLES, 0, circleVertices.length / 2);//draw the blue one

    popMatrix();
    transformMat.rotate(-45, 0.0, 0.0, 1.0);
    transformMat.rotate(joint1 + 45, 0.0, 1.0, 0.0);
    transformMat.translate(1.5, 0.0, 0.0);
    pushMatrix();
    transformMat.scale(1.0, 0.3, 0.3);
    drawOneObject(cube, transformMat, 1.0, 0.0, 0.0);


    popMatrix();
    transformMat.translate(1.5, 0.0, 0.0);
    pushMatrix();
    drawOneObject(sphere, transformMat, 0.0, 0.0, 1.0);

    
    popMatrix();
    transformMat.rotate(joint2 + 90, 0.0, 0.0, 1.0);
    transformMat.translate(2.6, 0.0, 0.0);
    pushMatrix(); //for one more yellow
    transformMat.scale(2.0, 0.3, 0.3);
    // transformMat.translate(0.1, 0.0, 0.0);
    drawOneObject(cube, transformMat, 0.0, 1.0, 0.0);


    popMatrix();    
    transformMat.translate(2.5, 0.0, 0.0);
    pushMatrix();
    drawOneObject(sphere, transformMat, 0.0, 0.0, 1.0);



    //TODO-4: add code here to draw and rotate the yelloe block

    popMatrix();    
    var num = 7;
    transformMat.rotate(joint3 - 22.5, 0.0, 0.0, 1.0);
    var step = (-157.5 - joint3) / num
    var dis = 6.5;

    var times = 1.5;
    for(var i = 0; i < num; ++i)
    {
      pushMatrix();
      transformMat.scale(times, times, times);
      times *= 0.95;
      transformMat.translate(dis, 0.0, 0.0);
      drawOneObject(pyramid, transformMat, 1.0, 1.0, 0.0);
      popMatrix();
      transformMat.rotate(step, 0.0, 0.0, 1.0);
    }

}

//obj: the object components
//mdlMatrix: the model matrix without mouse rotation
//colorR, G, B: object color
function drawOneObject(obj, mdlMatrix, colorR, colorG, colorB){
    //model Matrix (part of the mvp matrix)
    modelMatrix.setRotate(angleY, 1, 0, 0);//for mouse rotation
    modelMatrix.rotate(angleX, 0, 1, 0);//for mouse rotation
    gl.uniformMatrix4fv(program.u_LightMatrix, false, modelMatrix.elements);

    modelMatrix.multiply(mdlMatrix);
    //mvp: projection * view * model matrix  
    mvpMatrix.setPerspective(30, 1, 1, 100);
    mvpMatrix.lookAt(cameraX * zoomScale, cameraY * zoomScale, cameraZ * zoomScale, 0, 0, 0, 0, 1, 0);
    mvpMatrix.multiply(modelMatrix);

    //normal matrix
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    gl.uniform4f(program.u_LightPosition, lightpos[0], lightpos[1], lightpos[2], lightpos[3]);
    gl.uniform3f(program.u_ViewPosition, cameraX * zoomScale, cameraY * zoomScale, cameraZ * zoomScale);
    gl.uniform1f(program.u_Ka, 0.2);
    gl.uniform1f(program.u_Kd, 0.7);
    gl.uniform1f(program.u_Ks, 1.0);
    gl.uniform1f(program.u_shininess, 10.0);
    gl.uniform3f(program.u_Color, colorR, colorG, colorB);
    
    
    gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(program.u_normalMatrix, false, normalMatrix.elements);

    for( let i=0; i < obj.length; i ++ ){
      initAttributeVariable(gl, program.a_Position, obj[i].vertexBuffer);
      initAttributeVariable(gl, program.a_Normal, obj[i].normalBuffer);
      gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
    }
}

function parseOBJ(text) {
  // because indices are base 1 let's just fill in the 0th data
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];

  // same order as `f` indices
  const objVertexData = [
    objPositions,
    objTexcoords,
    objNormals,
  ];

  // same order as `f` indices
  let webglVertexData = [
    [],   // positions
    [],   // texcoords
    [],   // normals
  ];

  const materialLibs = [];
  const geometries = [];
  let geometry;
  let groups = ['default'];
  let material = 'default';
  let object = 'default';

  const noop = () => {};

  function newGeometry() {
    // If there is an existing geometry and it's
    // not empty then start a new one.
    if (geometry && geometry.data.position.length) {
      geometry = undefined;
    }
  }

  function setGeometry() {
    if (!geometry) {
      const position = [];
      const texcoord = [];
      const normal = [];
      webglVertexData = [
        position,
        texcoord,
        normal,
      ];
      geometry = {
        object,
        groups,
        material,
        data: {
          position,
          texcoord,
          normal,
        },
      };
      geometries.push(geometry);
    }
  }

  function addVertex(vert) {
    const ptn = vert.split('/');
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) {
        return;
      }
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);
    });
  }

  const keywords = {
    v(parts) {
      objPositions.push(parts.map(parseFloat));
    },
    vn(parts) {
      objNormals.push(parts.map(parseFloat));
    },
    vt(parts) {
      // should check for missing v and extra w?
      objTexcoords.push(parts.map(parseFloat));
    },
    f(parts) {
      setGeometry();
      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
    s: noop,    // smoothing group
    mtllib(parts, unparsedArgs) {
      // the spec says there can be multiple filenames here
      // but many exist with spaces in a single filename
      materialLibs.push(unparsedArgs);
    },
    usemtl(parts, unparsedArgs) {
      material = unparsedArgs;
      newGeometry();
    },
    g(parts) {
      groups = parts;
      newGeometry();
    },
    o(parts, unparsedArgs) {
      object = unparsedArgs;
      newGeometry();
    },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
      continue;
    }
    handler(parts, unparsedArgs);
  }

  // remove any arrays that have no entries.
  for (const geometry of geometries) {
    geometry.data = Object.fromEntries(
        Object.entries(geometry.data).filter(([, array]) => array.length > 0));
  }

  return {
    geometries,
    materialLibs,
  };
}

function mouseDown(ev){ 
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();
    if( rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom){
        mouseLastX = x;
        mouseLastY = y;
        mouseDragging = true;
    }
}

function mouseUp(ev){ 
    mouseDragging = false;
}

function mouseMove(ev){ 
    var x = ev.clientX;
    var y = ev.clientY;
    if( mouseDragging ){
        var factor = 100/canvas.height; //100 determine the spped you rotate the object
        var dx = factor * (x - mouseLastX);
        var dy = factor * (y - mouseLastY);

        angleX += dx; //yes, x for y, y for x, this is right
        angleY += dy;
    }
    mouseLastX = x;
    mouseLastY = y;

    draw();
}
