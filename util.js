if (!window.DOMRect)
    window.DOMRect = ClientRect;

let bool = Boolean;

function minMax(n1, n2) {
    return n1 > n2 ? [n2, n1] : [n1, n2];
}

const x2_52 = Math.pow(2, 52);
const x2_53 = Math.pow(2, 52);

/** 
 * exploits js's internal number machanics(float's 52 bits mantissa) to round a float
 * @param {number} x the number to be rounded
*/
function smartRound(x) {
    if (x < 0)
        return x + x2_53 - x2_53;
    else
        return x + x2_52 - x2_52;
}

function multilineText(lines, parent) {
    if (!lines || !lines.length) return parent;
    parent.innerHTML = "";
    if (typeof lines === 'string')
        parent.appendChild(document.createTextNode(lines));
    else
        for (let i = 0; i < lines.length; i++) {
            parent.appendChild(document.createTextNode(lines[i]));
            if (i < lines.length - 1)
                parent.appendChild(document.createElement("br"));
        }
    return parent;
}

function pushAt(arr, index, newIndex) {
    let [min, max] = [index, newIndex].sort();
    return arr.slice(0, min).concat(...arr.slice(min + 1, newIndex + 1), arr[index], ...arr.slice(newIndex, index), ...arr.slice(max + 1));
}

function timeToTransition(el) {
    let style = getComputedStyle(el);
    return (parseFloat(style.transitionDuration) + parseFloat(style.transitionDelay)) * 1000;
}

String.prototype.suffix = function suffix(suffix) {
    let sfIndex = 0;
    let i;
    for (i = 0; i < this.length; i++) {
        if (this[i] === suffix[sfIndex])
            sfIndex++;
        else if (sfIndex)
            break;
    }
    return this.substring(0, i).concat(suffix.substring(sfIndex));
};

/**
 * @template {keyof ElementTypeMap} K
 * @template T
 * @param {K} tagName 
 * @param {{classes?: string[], class?: string, id?: string, 
 * listeners?: {[M in keyof (HTMLElementEventMap & SVGSVGElementEventMap)]?: 
 *  ((this: HTMLElement, event: (HTMLElementEventMap & SVGSVGElementEventMap)[M]) => void)}, 
 * fields?: T, attributes?: any}} options 
 * @param  {...string} children
 * @returns {ElementTypeMap[K] & T}
 */
function El(tagName, options = {}, ...children) {
    let el = Object.assign(document.createElement(tagName), options.fields || {});
    if (options.classes) el.classList.add(...options.classes.filter(e => e));
    else if (options.class) el.classList.add(options.class);
    if (options.id) el.id = options.id;
    el.append(...children);
    for (let listenerName of Object.keys(options.listeners || {}))
        if (options.listeners[listenerName]) el.addEventListener(listenerName, options.listeners[listenerName], false);
    for (let attributeName of Object.keys(options.attributes || {}))
        el.setAttribute(attributeName, options.attributes[attributeName]);
    return el;
}

/**
 * @param {string} query 
 */
// function ofSelector(query) {
//     let parent;
//     let sibiling;
//     if (query.match(/[> ,+~]/)) {
//         let index;
//         let match;
//         while (match = /[> ,+~]/.exec(query.substr(index))) index += match[0].length;
//         switch (query[parentExp.lastIndex]) {
//             case "+":
//             case "~":
//                 sibiling = document.querySelector(query.substr(0, index));
//                 break;
//             case " ":
//             case ">":
//                 parent = document.querySelector(query.substr(0, index));
//                 break;
//         }
//         query = query.substr(parentExp.lastIndex);
//     }
//     if (query.match(/^[.\[\]\(\)]/)) throw new SyntaxError("element type is not specified in the query.");
//     let exp = /[a-z][0-9a-z\-_A-Z]*/g;
//     let match;
//     let attributes = {};
//     let type;
//     let classes = [];
//     while (match = exp.exec(query)) {
//         switch (query[match.index - 1]) {
//             case undefined:
//                 type = match[0];
//                 break;
//             case "(":
//                 //maybe todo?
//                 break;
//             case "[":
//                 if (query[0].match(/[~|^$*]/)) break;
//                 let smts = query.indexOf("=");
//                 let attr = smts[1];
//                 switch (smts[0][smts[0].length - 1]) {
//                     case "~":
//                         attr = (attributes[0] || "") + attr;

//                     case "^":

//                     case "|":
//                         attr = attr + (attributes[0] || "");

//                     case "$":

//                     case "^":
//                 }
//                 // let strait = smts[0].match(/[~|^$*]^/);
//                 // attributes[smts[0]] = (strait && attributes[smts[0]] || "") + smts[1];
//                 break;
//             case ".":
//                 classes.push(match[0]);
//         }
//     }
//     let element = El(type, { classes, attributes });
//     if (parent) parent.append(element);
//     else if (sibiling) sibiling.after(element);
//     return element;
// }

function signlessCeil(f) {
    let sign = Math.sign(f);
    return Math.ceil(sign * f) * sign;
}

function alignAngle(currentAngle, newAngle, threshold) {
    if (Math.abs(newAngle) + Math.abs(currentAngle) > threshold)
        return newAngle - (signlessCeil(newAngle / threshold) - signlessCeil(currentAngle / threshold)) * threshold;
    return newAngle;
}

function arrSwap(arr, index, oIndex) {
    let tmp = arr[index];
    arr[index] = arr[oIndex];
    arr[oIndex] = tmp;
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        let rndIndex = Math.floor(Math.random() * (i + 1));
        let tmp = arr[i];
        arr[i] = arr[rndIndex];
        arr[rndIndex] = tmp;
    }
}

function dot({ id = (Math.random() * 100000).toFixed(2), x, y }) {
    if (!('__dev__mode__flag' in window)) return;
    if (!window[id]) {
        let el = document.createElement("div");
        el.classList.add("dot");
        el.id = id;
        document.body.appendChild(el);
    }
    window[id].style.left = `${x - window[id].clientWidth / 2}px`;
    window[id].style.top = `${y - window[id].clientHeight / 2}px`;
}

DOMRect.prototype.intersection = function intersection({ left, top, right, bottom }) {
    if (!this.intersects({ left, top, right, bottom })) return 0;
    let y = Math.max(this.top, top);
    let x = Math.max(this.left, left);
    let res = ((Math.min(this.right, right) - x) * (Math.min(this.bottom, bottom) - y)) / Math.min(this.width * this.height, (right - left) * (bottom - top));
    return res;
};


DOMRect.prototype.intersects = function intersects({ left, top, right, bottom }) {
    return ((this.top <= bottom && this.bottom >= bottom) || (this.top <= top && this.bottom >= top)) &&
        ((this.left <= left && this.right >= left) || (this.left <= right && this.right >= right));
};

DOMRect.prototype.contains = function contains({ x, y }) {
    return this.top <= y && this.bottom >= y && this.left <= x && this.right >= x;
};

DOMRect.prototype.resize = function resize(width = this.width, height = this.height) {
    return new DOMRect(this.x, this.y, width, height);
};

DOMRect.prototype.move = function move(x, y) {
    return new DOMRect(this.x + (x || 0), this.y + (y || 0), this.width, this.height);
};

fill(Node, function after(...nodes) {
    nodes.forEach(el => this.parentElement.insertBefore(el, this.nextSibling));
});

fill(Node, function before(...nodes) {
    nodes.forEach(el => this.parentElement.insertBefore(el, this));
});

fill(Node, function prepend(...nodes) {
    nodes.forEach(el => this.parentElement.insertBefore(el instanceof Node ? el : new Text(el), this.parentElement.firstChild));
});

fill(Node, function append(...nodes) {
    nodes.forEach(el => this.appendChild(el instanceof Node ? el : new Text(el)));
});


function fill(type, fn) {
    if (!(fn.name in type.prototype)) {
        Object.defineProperty(type.prototype, fn.name, {
            value: fn,
            enumerable: false
        });
    }
}