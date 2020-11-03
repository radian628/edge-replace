var mouse = { x: 0, y: 0 };
document.addEventListener("mousemove", function (e) {
	mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (snapMode.value != "0") {
        if (snapMode.value == "2") {
            if (Math.round(mouse.y / 50) % 2) {
                mouse.x = Math.floor(mouse.x / 50 * Math.sqrt(3) / 2) * 50 / Math.sqrt(3) * 2 + 25 / Math.sqrt(3) * 2;
            } else {
                mouse.x = Math.round(mouse.x / 50 * Math.sqrt(3) / 2) * 50 / Math.sqrt(3) * 2;
            }
        } else {
            mouse.x = Math.round(mouse.x / 50) * 50;
        }
    	mouse.y = Math.round(mouse.y / 50) * 50;
    }
});

window.addEventListener("resize", function (e) {
	c.width = window.innerWidth;
    c.height = window.innerHeight;
})

var draggables = [];
var draggableElems = document.getElementsByClassName("draggable");

function redefineDraggables() {
    draggableElems = document.getElementsByClassName("draggable");
    draggables = [];
    for (var i = 0; draggableElems.length > i; i++) {
        var elem = draggableElems[i];
      elem.draggableIndex = i;
      elem.onmousedown = function (e) {
        draggables[e.target.draggableIndex] = true;
      }
      elem.onmouseup = function (e) {
        draggables[e.target.draggableIndex] = false;
      }
    }
}

//canvas context
var c = document.getElementById("canvas");
var ctx = c.getContext("2d");

c.width = window.innerWidth;
c.height = window.innerHeight;

//This is just tau (PI * 2) so my life is made easier.
const TAU = Math.PI * 2;

//Pythagorean distance function. Returns distance from (0, 0) to (a, b).
function dist(a, b) {
	return Math.sqrt(a * a + b * b);
}

//Vector defined by cartesian coordinates, along with two optional paramters for whether to reverse order and reflect when edge-replacing.
function V(x, y, reverse, reflect) {
	this.x = x;
    this.y = y
    this.m = dist(x, y);
    this.d = Math.atan2(y, x);
    this.reverse = reverse;
    this.reflect = reflect;
}

//Make vector with polar coords.
function VPolar(m, d, rev, ref) {
	return new V(Math.cos(d) * m, Math.sin(d) * m, rev, ref);
}

//Vector sum. Returns a vector equal to the sum of an array of vectors.
function resultant(v) {
	var x = 0;
    var y = 0;
    v.forEach(function (e) {
    	x += e.x
        y += e.y;
    });
    return new V(x, y);
}

//Finds the negative of a vector
function negative(v) {
	return new V(-v.x, -v.y, v.reverse, v.reflect);
}

//Create a drawn path made of several vectors.
function polylinePath(v, x, y) {
	var posx = x;
    var posy = y;
    v.forEach(function (e) {
    	ctx.lineTo(posx, posy);
        posx += e.x;
        posy += e.y;
    });
    ctx.lineTo(posx, posy);
}

//Transform a vector's scale and rotation. Returns a new vector.
function transform(v, s, r) {
	return new V(s * v.m * Math.cos(v.d + r), s * v.m * Math.sin(v.d + r), v.reverse, v.reflect);
}

//Reflect a vector across another vector.
function reflectAcross(v, mirror) {
	var deltaAngle = (mirror.d - v.d);
    var v2 = transform(v, 1, deltaAngle * 2);
    v2.reflect = !v2.reflect;
    return v2;
}

//Replace a single vector with multiple vectors, such that the sum of the new vectors is equal to the old vector.
function singleEdgeReplace(v, rule) {
    var ruleSum = resultant(rule);
    var transformScale = v.m / ruleSum.m;
    var transformRotation = v.d - ruleSum.d;
    var replaced;
    if (v.reflect) {
    	replaced = rule.map(e => reflectAcross(transform(e, transformScale, transformRotation), v));
    } else {
    	replaced = rule.map(e => transform(e, transformScale, transformRotation));
    }
    if (v.reverse) {
    	return replaced.reverse();		
    } else {
    	return replaced;
    }
}

//Perform the "single edge replace" function (above) to multiple vectors, then concatonates the result.
function edgeReplace(v, rule) {
	var v2 = [];
    v.forEach(function (e) {
        if (!ie["aslr"].checked || e.m > valNum("small-line-threshold")) {
            v2 = v2.concat(singleEdgeReplace(e, rule));
        } else {
            v2.push(e);
        }
    })
    return v2;
}

//Applies the edgeReplace function to its own result a number of times equal to depth.
function iterativeEdgeReplace(v, rule, depth) {
	for (var i = 0; depth > i; i++) {
    	v = edgeReplace(v, rule);
    }
    return v;
}

//Time variable for loops.
var t = 0;
/*
var currentRule = [
        new VPolar(100, TAU / 6, false, true),
        new VPolar(100, 0),
        new VPolar(100, -TAU / 6, false, true)
    ];
    
currentRule = [];

for (var i = 0; 3 > i; i++) {
	var dir = TAU / 6 * Math.floor(Math.random() * 6);
    currentRule.push(new VPolar(Math.round(Math.random()) + 1, dir, Math.random() > 0.5, Math.random() > 0.5));
}

for (var i = 0; 10 > i; i++) {
	ctx.strokeStyle = "hsl(" + (i * 30) + ", 100%, 35%)";
    ctx.beginPath();
    polylinePath(iterativeEdgeReplace([new V(150, 150)], currentRule, i), 100, 250 * i + 150);
    ctx.stroke();
}
*/

var modeKey = [
	"norevref",
    "rev",
    "ref",
    "revref"
];

//stands for "draggable element coordinates"
function dec(index) {
	if (index == "len") {
  	index = draggableElems.length - 1;
  }
	return {
  	x: Number(draggableElems[index].style.left.slice(0, -2)),
    y: Number(draggableElems[index].style.top.slice(0, -2)),
    rev: draggableElems[index].className == "draggable rev" || draggableElems[index].className == "draggable revref",
    ref: draggableElems[index].className == "draggable ref" || draggableElems[index].className == "draggable revref"
  };
}

function val(input) {
    return ie[input].value;
}

function valNum(input) {
    return Number(ie[input].value);
}

var inputs = [
    "itr-count",
    "auto-iterate",
    "aslr",
    "small-line-threshold"
];

var ie = {};
inputs.forEach(function (e) {
    ie[e] = document.getElementById(e);
});

var snapMode = document.getElementById("snap");

function loop() {
	var canDragElem = true;
    var currentRule = [];
	for (var i = 0; draggableElems.length > i; i++) {
    var elem = draggableElems[i];
    if (draggables[draggableElems[i].draggableIndex] && canDragElem) {
    //window.alert(e.target.style.top);
      elem.style.top = (mouse.y - 5) + "px";
      elem.style.left = (mouse.x - 5) + "px";
      if (mouse.x < 40 && mouse.y < 160) {
      	var mode = Math.floor(mouse.y / 40);
        elem.className = "draggable " + modeKey[mode];
      }
      canDragElem = false;
    }
    if (i != 0) {
    	var xpos = dec(i).x - dec(i - 1).x;
        var ypos = dec(i).y - dec(i - 1).y;
        /*if (snapMode.value == "1") {
        	xpos = Math.floor(xpos / 50) * 50;
        	ypos = Math.floor(ypos / 50) * 50;
        }*/
      currentRule.push(new V(xpos, ypos, dec(i).rev, dec(i).ref));
    }
  }
  
  
  	ctx.clearRect(0, 0, c.width,c.height)
    ctx.beginPath();
    polylinePath(singleEdgeReplace(new V(dec("len").x - dec(0).x, dec("len").y - dec(0).y), iterativeEdgeReplace([new V(dec("len").x - dec(0).x, dec("len").y - dec(0).y)], currentRule, ie["auto-iterate"].checked ? Math.floor(Math.log(10000) / Math.log(draggableElems.length)) : valNum("itr-count"))), dec(0).x, dec(0).y);
    ctx.stroke();
	requestAnimationFrame(loop);
}

var draggableContainer = document.getElementById("controller-container");

function addDraggable() {
	draggableContainer.innerHTML += '<div class="draggable norevref" width="50px" height="50px" style="top: 400px; left: 500px;"></div>';
    redefineDraggables();
}
document.getElementById("addnode").onclick = addDraggable;

function removeDraggable() {
	draggableContainer.removeChild(draggableContainer.lastElementChild)
	redefineDraggables();
}
document.getElementById("removenode").onclick = removeDraggable;

redefineDraggables();

loop();