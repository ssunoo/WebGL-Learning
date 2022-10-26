var VSHADER_SOURCE = `
        attribute vec4 a_Position;
        attribute vec4 a_Color;
        varying vec4 v_Color;
        uniform mat4 u_modelMatrix;
        void main(){
            gl_Position = u_modelMatrix * a_Position;
            v_Color = a_Color;
        }    
    `;

var FSHADER_SOURCE = `
        precision mediump float;
        varying vec4 v_Color;
        void main(){
            gl_FragColor = v_Color;
        }
    `;

function createProgram(gl, vertexShader, fragmentShader){
    //create the program and attach the shaders
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    //if success, return the program. if not, log the program info, and delete it.
    if(gl.getProgramParameter(program, gl.LINK_STATUS)){
        return program;
    }
    alert(gl.getProgramInfoLog(program) + "");
    gl.deleteProgram(program);
}

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

function initArrayBuffer( gl, data, num, type, attribute){
    var buffer = gl.createBuffer();
    if(!buffer){
        console.log("failed to create the buffere object");
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    var a_attribute = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), attribute);

    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);

    return true;
}

var transformMat = new Matrix4();
var matStack = [];
var u_modelMatrix;
function pushMatrix(){
    matStack.push(new Matrix4(transformMat));
}
function popMatrix(){
    transformMat = matStack.pop();
}
//variables for tx, red,green and yellow arms angle 
var tx = 0;
var ty = 0;
var siz = 0;
var redAngle = 0;
var greenAngle = 0;
var yellowAngle = 0;

function main(){
    //////Get the canvas context
    var canvas = document.getElementById('webgl');
    var gl = canvas.getContext('webgl2');
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return ;
    }

    program = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    redraw(gl); //call redarw here to show the initial image

    //setup the call back function of tx Sliders
    var txSlider = document.getElementById("Translate-X");
    txSlider.oninput = function() {
        tx = this.value / 100.0; //convert sliders value to -1 to +1
        redraw(gl);
    }

    var tySlider = document.getElementById("Translate-Y");
    tySlider.oninput = function() {
        ty = this.value / 100.0; //convert sliders value to -1 to +1
        redraw(gl);
    }    

    //setup the call back function of red arm rotation Sliders
    var jointRedSlider = document.getElementById("jointForRed");
    jointRedSlider.oninput = function() {
        redAngle = this.value * -1;
        redraw(gl);
    }

    //setup the call back function of green arm rotation Sliders
    var jointGreenSlider = document.getElementById("jointForGreen");
    jointGreenSlider.oninput = function() {
        greenAngle = -1 * this.value; //convert sliders value to 0 to 45 degrees
        redraw(gl);
    }

    //setup the call back function of yellow arm rotation Sliders
    var jointYellowSlider = document.getElementById("jointForYellow");
    jointYellowSlider.oninput = function() {
        yellowAngle = this.value *  -1; //convert sliders value to 0 to -45 degrees
        redraw(gl);
    }

    var sizeSlider = document.getElementById("SIZE");
    sizeSlider.oninput = function() {
        siz = this.value / 100.0; //convert sliders value to -1 to +1
        redraw(gl);
    }    
}

//Call this funtion when we have to update the screen (eg. user input happens)
function redraw(gl)
{
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    u_modelMatrix = gl.getUniformLocation(gl.getParameter(gl.CURRENT_PROGRAM), 'u_modelMatrix');
    
    var triangleVertices = [0.0 , 0.0, 0.75, 0.0, 0.576, -0.1];
    var rectVertices = [-0.1, 0.1, 0.1, 0.1, -0.1, -0.1, 0.1, -0.1];
    var circleVertices = getCircleTriangles(15, [0.0, 0.0], 0.05); 
    var redColor = [1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0 ];
    var greenColor = [0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0 ];
    var blueColor = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0 ];
    var yellowColor = [1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0 ];

    buffer0 = initArrayBuffer(gl, new Float32Array(circleVertices), 2, gl.FLOAT, 'a_Position');
    buffer1 = initArrayBuffer(gl, new Float32Array(getColor(circleVertices.length / 2, [0.0, 0.0, 1.0])), 3, gl.FLOAT, 'a_Color');

    transformMat.setIdentity();
    //TODO-1: translate whole robot here
    transformMat.translate(tx - 0.7, ty, 0.0);
    transformMat.scale(1 + siz, 1 + siz, 0.0);
    pushMatrix();
    // transformMat.translate(0.1, 0.0, 0.0);
    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLES, 0, circleVertices.length / 2);//draw the blue one

    popMatrix();
    buffer0 = initArrayBuffer(gl, new Float32Array(rectVertices), 2, gl.FLOAT, 'a_Position');
    buffer1 = initArrayBuffer(gl, new Float32Array(redColor), 3, gl.FLOAT, 'a_Color');
    //TODO-2: make the red arm rotate
    transformMat.rotate(redAngle - 45, 0.0, 0.0, 1.0);
    transformMat.translate(0.2, 0.0, 0.0);
    pushMatrix();
    transformMat.scale(1.0, 0.3, 0.0);
    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectVertices.length/2);//draw the red one

    popMatrix();
    buffer0 = initArrayBuffer(gl, new Float32Array(circleVertices), 2, gl.FLOAT, 'a_Position');
    buffer1 = initArrayBuffer(gl, new Float32Array(getColor(circleVertices.length / 2, [0.0, 0.0, 1.0])), 3, gl.FLOAT, 'a_Color');
    
    transformMat.translate(0.2, 0.0, 0.0);
    pushMatrix();
    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLES, 0, circleVertices.length / 2);//draw the blue one
    
    popMatrix();
    buffer0 = initArrayBuffer(gl, new Float32Array(rectVertices), 2, gl.FLOAT, 'a_Position');
    buffer1 = initArrayBuffer(gl, new Float32Array(greenColor), 3, gl.FLOAT, 'a_Color');
    //TODO-3: you may add some functions here 
    //        and modify translate() in next line to rotate the green bar
    transformMat.rotate(greenAngle + 90, 0.0, 0.0, 1.0);
    transformMat.translate(0.3, 0.0, 0.0);
    pushMatrix(); //for one more yellow
    transformMat.scale(2.0, 0.3, 0.0);
    // transformMat.translate(0.1, 0.0, 0.0);
    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectVertices.length/2);//draw the green one

    popMatrix();
    buffer0 = initArrayBuffer(gl, new Float32Array(circleVertices), 2, gl.FLOAT, 'a_Position');
    buffer1 = initArrayBuffer(gl, new Float32Array(getColor(circleVertices.length / 2, [0.0, 0.0, 1.0])), 3, gl.FLOAT, 'a_Color');
    
    transformMat.translate(0.3, 0.0, 0.0);
    pushMatrix();
    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLES, 0, circleVertices.length / 2);//draw the blue one


    //TODO-4: add code here to draw and rotate the yelloe block

    popMatrix();
    buffer0 = initArrayBuffer(gl, new Float32Array(triangleVertices), 2, gl.FLOAT, 'a_Position');
    buffer1 = initArrayBuffer(gl, new Float32Array(getColor(triangleVertices.length / 2, [1.0, 1.0, 0.0])), 3, gl.FLOAT, 'a_Color');
    
    var num = 7;
    transformMat.rotate(yellowAngle - 22.5 , 0.0, 0.0, 1.0);
    var step = (-142.5 - yellowAngle) / num;
    pushMatrix();
    transformMat.translate(0.075, 0.0, 0.0);
    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLES, 0, rectVertices.length/2);
    var times = 0.95;
    for(var i = 1; i <= num; ++i)
    {
        popMatrix();
        transformMat.rotate(step, 0.0, 0.0, 1.0);
        pushMatrix();
        transformMat.scale(times, 1.0, 0.0);
        times *= 0.95;
        transformMat.translate(0.075, 0.0, 0.0);
        gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
        gl.drawArrays(gl.TRIANGLES, 0, rectVertices.length/2);    
    }

}

function getCircleTriangles(num, center, r)
{
    var buffer = [];
    var radian = 0.0;
    var pre = [center[0] + r * Math.cos(radian), center[1] + r * Math.sin(radian)];
    var step = 2 * Math.PI / num;
    radian += step;
    for(var i = 0; i < num; ++i, radian += step)
    {
        buffer = buffer.concat(center);
        buffer = buffer.concat(pre);
        pre = [center[0] + r * Math.cos(radian), center[1] + r * Math.sin(radian)];
        buffer = buffer.concat(pre);
    }

    return buffer;
}

function getColor(num, color)
{
    var buffer = [];
    for(var i = 0; i < num; ++i)
    {
        buffer = buffer.concat(color);
    }
    return buffer;
}