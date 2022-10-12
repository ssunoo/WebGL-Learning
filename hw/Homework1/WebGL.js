//This tempalte is just for your reference
//You do not have to follow this template 
//You are very welcome to write your program from scratch

//shader
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    varying vec4 v_Color;
    void main(){
        gl_Position = a_Position;
        v_Color = a_Color;
        gl_PointSize = 3.5;
    }
    `;

var FSHADER_SOURCE = `
    precision mediump float;
    varying vec4 v_Color;
    void main(){
        gl_FragColor = v_Color;
    }
    `;



var shapeFlag = 'p'; //p: point, h: hori line: v: verti line, t: triangle, q: square, c: circle
var colorFlag = 'r'; //r g b 
var colorvalue = {'r' : [1.0,0.0,0.0], 'g' : [0.0,1.0,0.0], 'b' : [0.0,0.0,1.0]};
var g_points = [];
var g_horiLines = [];
var g_vertiLines = [];
var g_triangles = [];
var g_squares = [];
var g_circles = [];
//var ... of course you may need more variables

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

function main() 
{
    //////Get the canvas context
    var canvas = document.getElementById('webgl');
    //var gl = canvas.getContext('webgl') || canvas.getContext('exprimental-webgl') ;
    var gl = canvas.getContext('webgl2');
    if (!gl) 
    {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // compile shader and use program
    let renderProgram = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    gl.useProgram(renderProgram);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // mouse and key event...
    canvas.onmousedown = function (ev) { click(ev, gl, canvas, renderProgram) };
    document.onkeydown = function (ev) { keydown(ev) };
}



function keydown(ev) 
{ //you may want to define more arguments for this function
    //implment keydown event here

    if (ev.key == 'r' || ev.key == 'g' || ev.key == 'b')        colorFlag = ev.key;
    else if (ev.key == 'p' || ev.key == 'h' || ev.key == 'v'    
            || ev.key == 't' || ev.key == 'q' || ev.key == 'c') shapeFlag = ev.key;
}

function click(ev, gl, canvas, program) 
{ //you may want to define more arguments for this function
    //mouse click: recall our quiz1 in calss
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.height / 2) / (canvas.height / 2)
    y = (canvas.width / 2 - (y - rect.top)) / (canvas.height / 2)

    //you might want to do something here
    if(shapeFlag == 'p')        
    {
        if(g_points.length >= 25)
        {
            for(var i = 0; i < 5; ++i)  g_points.shift(); 
        }
        g_points = g_points.concat([x, y]);
        g_points = g_points.concat(colorvalue[colorFlag]);
    }
    else if(shapeFlag == 'h')   
    {
        if(g_horiLines.length >= 50)
        {
            for(var i = 0; i < 10; ++i)  g_horiLines.shift(); 
        }
        g_horiLines = g_horiLines.concat([canvas.width / 2, y]);
        g_horiLines = g_horiLines.concat(colorvalue[colorFlag]);

        g_horiLines = g_horiLines.concat([-canvas.width / 2, y]);
        g_horiLines = g_horiLines.concat(colorvalue[colorFlag]);
    }
    else if(shapeFlag == 'v')   
    {
        if(g_vertiLines.length >= 50)
        {
            for(var i = 0; i < 10; ++i)  g_vertiLines.shift(); 
        }
        g_vertiLines = g_vertiLines.concat([x, canvas.height / 2]);
        g_vertiLines = g_vertiLines.concat(colorvalue[colorFlag]);

        g_vertiLines = g_vertiLines.concat([x, -canvas.height / 2]);
        g_vertiLines = g_vertiLines.concat(colorvalue[colorFlag]);
    }
    else if(shapeFlag == 't')   
    {
        if(g_triangles.length >= 75)
        {
            for(var i = 0; i < 15; ++i)  g_triangles.shift(); 
        }
        var times = 0.025;
        g_triangles = g_triangles.concat([x, y + 2 * times]);
        g_triangles = g_triangles.concat(colorvalue[colorFlag]);

        g_triangles = g_triangles.concat([x - Math.sqrt(3) * times, y - 1 * times]);
        g_triangles = g_triangles.concat(colorvalue[colorFlag]);
        
        g_triangles = g_triangles.concat([x + Math.sqrt(3) * times, y - 1 * times]);
        g_triangles = g_triangles.concat(colorvalue[colorFlag]);            
    }
    else if(shapeFlag == 'q')   
    {
        if(g_squares.length >= 150)
        {
            for(var i = 0; i < 30; ++i)  g_squares.shift(); 
        }
        var times = 0.025;
        g_squares = g_squares.concat([x - 1 * times, y + 1 * times]);
        g_squares = g_squares.concat(colorvalue[colorFlag]);
        g_squares = g_squares.concat([x + 1 * times, y + 1 * times]);
        g_squares = g_squares.concat(colorvalue[colorFlag]);
        g_squares = g_squares.concat([x - 1 * times, y - 1 * times]);
        g_squares = g_squares.concat(colorvalue[colorFlag]);
        g_squares = g_squares.concat([x + 1 * times, y + 1 * times]);
        g_squares = g_squares.concat(colorvalue[colorFlag]);
        g_squares = g_squares.concat([x - 1 * times, y - 1 * times]);
        g_squares = g_squares.concat(colorvalue[colorFlag]);
        g_squares = g_squares.concat([x + 1 * times, y - 1 * times]);
        g_squares = g_squares.concat(colorvalue[colorFlag]);
    }
    else if(shapeFlag == 'c')   
    {
        var num = 15;
        if(g_circles.length >= num * 75)
        {
            for(var i = 0; i < num * 15; ++i)  g_circles.shift(); 
        }
        g_circles = g_circles.concat(getCircleTriangles(num, colorvalue[colorFlag], [x, y], 0.035));
    }

    //self-define draw() function
    //I suggest that you can clear the canvas
    //and redraw whole frame(canvas) after any mouse click

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    draw(new Float32Array(g_points), gl.POINTS, gl, program);
    draw(new Float32Array(g_horiLines), gl.LINES, gl, program);
    draw(new Float32Array(g_vertiLines), gl.LINES, gl, program);
    draw(new Float32Array(g_triangles), gl.TRIANGLES, gl, program);
    draw(new Float32Array(g_squares), gl.TRIANGLES, gl, program);
    draw(new Float32Array(g_circles), gl.TRIANGLES, gl, program);
}


function draw(vers, shape, gl, program) 
{ //you may want to define more arguments for this function
    //redraw whole canvas here
    //Note: you are only allowed to same shapes of this frame by single gl.drawArrays() call

    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vers, gl.STATIC_DRAW);
    var FSIZE = vers.BYTES_PER_ELEMENT;
    var a_Position = gl.getAttribLocation(program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE*5, 0);
    gl.enableVertexAttribArray(a_Position);

    var a_Color = gl.getAttribLocation(program, 'a_Color');
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE*5, FSIZE * 2);
    gl.enableVertexAttribArray(a_Color);

    console.log(vers);
    gl.drawArrays(shape, 0, vers.length / 5);
}

function getCircleTriangles(num, color, center, r)
{
    var buffer = [];
    var radian = 0.0;
    var pre = [center[0] + r * Math.cos(radian), center[1] + r * Math.sin(radian)].concat(color);
    var step = 2 * Math.PI / num;
    radian += step;
    for(var i = 0; i < num; ++i, radian += step)
    {
        buffer = buffer.concat(center).concat(color);
        buffer = buffer.concat(pre);
        pre = [center[0] + r * Math.cos(radian), center[1] + r * Math.sin(radian)].concat(color);
        buffer = buffer.concat(pre);
    }

    return buffer;
}
