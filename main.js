import { V2 } from "./vector2.js";

function jsonToHTML(json) {
    if (json.elem) {
        return json.elem;
    } else {
        let elem = document.createElement(json.tagName);
        if (json.attributes) {
            Object.keys(json.attributes).forEach(attribute => {
                elem[attribute] = json.attributes[attribute];
            });
        }
        if (json.children) {
            json.children.forEach(child => {
                elem.appendChild(jsonToHTML(child));
            });
        }
        return elem;
    }
}

function squareSnap(x, size) {
    return Math.floor(x / size) * size;
}

class ReplaceableEdge {
    constructor (vector, reverse, reflect) {
        this.vector = vector;
        this.reverse = reverse || false;
        this.reflect = reflect || false;
    }
}

function xor(a, b) {
    return (a || b) && !(a && b)
}

class Replacer {
    constructor (vectors) {
        this.updateVectors(vectors);
    }

    updateSum() {
        this.sum = this.vectors.reduce((prev, cur) => prev.add(cur.vector), new V2(0, 0));
    }

    updateVectors(newVectors) {
        this.vectors = newVectors;
        this.vectorsReversed = this.vectors.concat().reverse();
        this.updateSum();
    }

    replace (vectors, threshold) {
        let newVectors = [];
        
        vectors.forEach(v => {
            let vectorSumAngle = this.sum.angle();
            let deltaAngle = v.vector.angle() - vectorSumAngle;
            let scaleFactor = v.vector.length() / this.sum.length();
            if (v.vector.length() > threshold) {
                if (v.reflect) {
                    if (v.reverse) {
                        this.vectorsReversed.forEach(v2 => {
                            newVectors.push(new ReplaceableEdge(V2.fromPolar(2 * vectorSumAngle - v2.vector.angle() + deltaAngle, v2.vector.length() * scaleFactor), v2.reverse, v2.reflect));
                        });
                    } else {
                        this.vectors.forEach(v2 => {
                            newVectors.push(new ReplaceableEdge(V2.fromPolar(2 * vectorSumAngle - v2.vector.angle() + deltaAngle, v2.vector.length() * scaleFactor), v2.reverse, v2.reflect));
                        });
                    }
                } else {
                    if (v.reverse) {
                        this.vectorsReversed.forEach(v2 => {
                            newVectors.push(new ReplaceableEdge(V2.fromPolar(v2.vector.angle() + deltaAngle, v2.vector.length() * scaleFactor), v2.reverse, v2.reflect));
                        });
                    } else {
                        this.vectors.forEach(v2 => {
                            newVectors.push(new ReplaceableEdge(V2.fromPolar(v2.vector.angle() + deltaAngle, v2.vector.length() * scaleFactor), v2.reverse, v2.reflect));
                        });
                    }
                }
            } else {
                newVectors.push(v);
            }
        });

        return newVectors;
    }
}

function createVectorPath(vecList, ctx, start) {
    if (!start) { 
        start = new V2(0, 0);
    } else {
        start = new V2(start);
    }

    ctx.moveTo(start.x, start.y);
    vecList.forEach(v => {
        start.add(v);
        ctx.lineTo(start.x, start.y);
    });
}

function attachDragHandler(dragElem, parentElem, customCallback) {
    let dragFunc = event => {
        if (customCallback) customCallback(event);
        parentElem.style.top = event.clientY - offset.y + "px";
        parentElem.style.left = event.clientX - offset.x + "px";
    };

    let offset = new V2(0, 0);
    dragElem.addEventListener("mousedown", event => {
        event.preventDefault();
        let rect = parentElem.getBoundingClientRect();
        offset = new V2(event.clientX - rect.left, event.clientY - rect.top);
        document.addEventListener("mousemove", dragFunc);
    });
    dragElem.addEventListener("mouseup", event => {
        document.removeEventListener("mousemove", dragFunc);
    });
}

function addFractalNode() {
    let fractalNodeID = fractalNodeList.length;
    
    let fractalNode = jsonToHTML({
        tagName: "div",
        attributes: {
            style: "position: absolute; top: 0px; left: 0px;",
            className: "drag-window"
        },
        children: [
            {
                tagName: "div",
                attributes: {
                    className: "drag-window-header",
                    innerText: "Fractal Node"
                }
            }, 
            {
                tagName: "label",
                attributes: {
                    innerText: "Reverse",
                    title: "Reverse the order of the vectors when this one is replaced."
                }
            }, 
            {
                tagName: "input",
                attributes: {
                    type: "checkbox", onchange: updateFractal
                }
            },
            {
                tagName: "br"
            },
            {
                tagName: "label",
                attributes: {
                    innerText: "Reflect",
                    title: "Reflect the replacement vectors about the axis of this one."
                }
            }, 
            {
                tagName: "input",
                attributes: {
                    type: "checkbox", onchange: updateFractal
                }
            }
        ]
    });

    attachDragHandler(fractalNode.children[0], fractalNode, event => {
        updateFractal();
    });

    fractalNodeContainer.appendChild(fractalNode);

    fractalNodeList.push(fractalNode);

    updateFractal();
}

function removeFractalNode() {
    let lastFractalNode = fractalNodeList.pop();
    fractalNodeContainer.removeChild(lastFractalNode);
    updateFractal();
}

attachDragHandler(document.getElementById("drag-div"), document.getElementById("drag-parent"));

document.getElementById("add-fractal-node-button").addEventListener("click", event => {
    addFractalNode();
});
document.getElementById("remove-fractal-node-button").addEventListener("click", event => {
    removeFractalNode();
});

let fractalNodeContainer = document.getElementById("fractal-nodes");
let fractalNodeList = [];
let canvas = document.getElementById("canvas");
let context = canvas.getContext("2d");

let resizeCanvas = event => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    updateFractal();
}

window.addEventListener("resize", resizeCanvas);

let fractalSettings = {};
Array.from(document.getElementById("drag-parent").children).forEach(child => {
    console.log(child.tagName);
    if (child.tagName == "INPUT" || child.tagName == "SELECT") {
        fractalSettings[child.id] = child;
        child.onchange = updateFractal;
    }
});

function updateFractal() {

    let iterationCount = Number(fractalSettings["iteration-count"].value);

    let displayAllIterations = fractalSettings["display-all-iterations"].checked;

    let dontSubdivideSmallLines = fractalSettings["dont-subdivide-small-lines"].checked;

    let snapType = fractalSettings["snap-type"].value;
    
    let snapSize = Number(fractalSettings["snap-size"].value);

    let smallLineThreshold = Number(fractalSettings["small-line-threshold"].value);

    if (fractalNodeList.length >= 2) {

        let startVector;
        let endVector;
        let startRect = fractalNodeList[0].getBoundingClientRect();
        let endRect = fractalNodeList[fractalNodeList.length - 1].getBoundingClientRect();
        if (snapType == "none") {
            startVector = new V2(startRect.left, startRect.top);
            endVector = new V2(endRect.left, endRect.top);
        } else if (snapType == "square") {
            startVector = new V2(squareSnap(startRect.left, snapSize), squareSnap(startRect.top, snapSize));
            endVector = new V2(squareSnap(endRect.left, snapSize), squareSnap(endRect.top, snapSize));
        } else if (snapType == "triangular") {
            startVector = new V2(squareSnap(startRect.left, snapSize) + (Math.floor(startRect.top / snapSize * 2 / Math.sqrt(3)) % 2) * snapSize / 2, squareSnap(startRect.top, snapSize * Math.sqrt(3) / 2));
            endVector = new V2(squareSnap(endRect.left, snapSize) + (Math.floor(endRect.top / snapSize * 2 / Math.sqrt(3)) % 2) * snapSize / 2, squareSnap(endRect.top, snapSize * Math.sqrt(3) / 2));
        }

        let replacementEdges = [];
        let vList = [new ReplaceableEdge(new V2(endVector).sub(startVector))];
        let previousPosition;
        fractalNodeList.forEach((fNode, i) => {
            let currentPosition;
            let rect = fNode.getBoundingClientRect();
            if (snapType == "none") {
                currentPosition = new V2(rect.left, rect.top);
            } else if (snapType == "square") {
                currentPosition = new V2(squareSnap(rect.left, snapSize), squareSnap(rect.top, snapSize));
            } else if (snapType = "triangular") {
                currentPosition = new V2(squareSnap(rect.left, snapSize) + (Math.floor(rect.top / snapSize * 2 / Math.sqrt(3)) % 2) * snapSize / 2, squareSnap(rect.top, snapSize * Math.sqrt(3) / 2));
            }
            if (i > 0) {
                replacementEdges.push(new ReplaceableEdge(new V2(currentPosition).sub(previousPosition), fNode.children[2].checked, fNode.children[5].checked, ));
            }
            previousPosition = new V2(currentPosition);
        });

        let replacer = new Replacer(replacementEdges);

        context.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; iterationCount > i; i++) {
            if (displayAllIterations) {
                context.beginPath();
                createVectorPath(vList.map(v => v.vector), context, new V2(startVector));
                context.stroke();
            }

            vList = replacer.replace(vList, dontSubdivideSmallLines ? smallLineThreshold : 0);
        }
        console.log(vList);

        let startVec = new V2(startVector);
        context.beginPath();
        context.fillStyle = "red";
        context.arc(startVec.x, startVec.y, 4, 0, Math.PI * 2);
        context.fill();
        replacer.vectors.forEach(v => {
            startVec.add(v.vector);
            context.beginPath();
            context.fillStyle = "red";
            context.arc(startVec.x, startVec.y, 4, 0, Math.PI * 2);
            context.fill();
        });

        context.beginPath();
        createVectorPath(vList.map(v => v.vector), context, new V2(startVector));
        context.stroke();
    }
}

resizeCanvas();

addFractalNode();
fractalNodeContainer.lastChild.style.left = "600px";
fractalNodeContainer.lastChild.style.top = "400px";
addFractalNode();
fractalNodeContainer.lastChild.style.left = "700px";
fractalNodeContainer.lastChild.style.top = "500px";
addFractalNode();
fractalNodeContainer.lastChild.style.left = "800px";
fractalNodeContainer.lastChild.style.top = "400px";
updateFractal();