const TRANSITION_TIME = 1000;
window.addEventListener("load", function init() {
    document.querySelectorAll(".droppable").forEach(draggable);
    window.addEventListener("blur", Drag.dropItem);

    window.addEventListener("touchmove", Drag.ondrag, { passive: false });
    window.addEventListener("touchend", Drag.dropItem, false);
    window.addEventListener("touchcancel", Drag.dropItem, false);
    window.addEventListener("pointermove", Drag.ondrag, false);
    window.addEventListener("pointerup", Drag.dropItem, false);
});

let Drag = {
    stashStyle(el, passive) {
        if (!el.oldStyles) el.oldStyles = [];
        el.oldStyles.push(el.style.cssText);
        if (!passive)
            el.style.cssText = "";
    },

    unstashStyle(el) {
        if (!el.oldStyles) return;
        el.style.cssText = el.oldStyles.pop();
        if (!el.oldStyles.length) delete el.oldStyles;
    },

    /**
     * 
     * @param {TouchEvent | PointerEvent} e 
     */
    dragStart(e) {
        if (e.target.locked) return;

        window.dragged = e.target;
        Drag.stashStyle(dragged, true);
        let obsolute = Drag.boolAttr(dragged, "removeondrag");
        if ((!obsolute && !Drag.boolAttr(dragged, "removeonplace")) || !window.dragged.originBounds) {
            dragged.style.top = "unset";
            dragged.style.left = "unset";
        }
        dragged.style.right = "unset";
        dragged.style.bottom = "unset";
        dragged.oldTransform = dragged.style.transform;

        /**
         * @type {DOMRect}
         */
        let bounds = dragged.getBoundingClientRect();
        if (window.rotation) bounds = rotation.resize(bounds);

        if (obsolute) {
            dragged.style.position = "absolute";
            void window.dragged.clientHeight;
            dragged.style.width = `${bounds.width}px`;
            dragged.style.height = `${bounds.height}px`;
            dragged.style.left = dragged.style.top = 0;
            let tmpBounds = dragged.getBoundingClientRect();

            let point = { x: bounds.x - tmpBounds.x, y: bounds.y - tmpBounds.y };
            dragged.offset = { x: point.x, y: point.y };
            if (window.rotation) point = rotation.transform(point);
            dragged.style.left = `${point.x}px`;
            dragged.style.top = `${point.y}px`;
        }
        let point = e instanceof TouchEvent ? e.touches[0] : e;
        dragged.dragLocation = {
            x: (point.clientX - bounds.x) / bounds.width,
            y: (point.clientY - bounds.y) / bounds.height
        };
        dragged.originBounds = bounds;
        if (dragged.pickup) dragged.pickup();
    },
    /**
     * 
     * @param {TouchEvent | PointerEvent} e 
     */
    ondrag(e) {
        if (!window.dragged || dragged.locked) return;
        if (e instanceof TouchEvent) e.preventDefault();
        let point = { x: e.x || e.touches[0].clientX, y: e.y || e.touches[0].clientY };
        if (dragged.altDrag) return dragged.drag && dragged.drag.call(dragged, { x: point.x, y: point.y });
        if (window.rotation) point = rotation.transform(point);
        dragged.beenDragged = true;
        /**
         * @type {HTMLElement}
         */
        let x, y;
        if (dragged.hasAttribute("drag-origin")) {
            [x, y] = dragged.getAttribute("drag-origin").split(",");
            [x, y] = [x / 100, y / 100];
        } else
            [x, y] = [dragged.dragLocation.x, dragged.dragLocation.y];

        for (let point of e.changedTouches || [e]) {
            let transformedPoint = { x: point.clientX - dragged.clientWidth * x - dragged.originBounds.x, y: point.clientY - dragged.clientHeight * y - dragged.originBounds.y };
            if (window.rotation)
                transformedPoint = rotation.transform(transformedPoint);
            dragged.style.transform = `translate(${transformedPoint.x}px, ${transformedPoint.y}px)`;
        }
        if (dragged.drag) dragged.drag.call(dragged, { x: point.x, y: point.y });
    },

    /**
     * 
     * @param {TouchEvent | PointerEvent | Event} event 
     */
    dropItem(event) {
        if (!window.dragged || window.dragged.locked) return;
        /**
         * @type {HTMLElement & {
         *  beenDragged: boolean
         *  drop?: function(this: HTMLElement): void
         *  pickup?: function(this: HTMLElement): void
         *  fail?: function(this: HTMLElement): void
         *  success?: function(this: HTMLElement, target: HTMLElement): void
         * 
         *  anchor: HTMLElement & {anchored: HTMLElement[]}
         *  locked: boolean
         * }}
         */
        let dragged = window.dragged;
        window.dragged = undefined;
        let failed = true;
        let beenDragged = dragged.beenDragged;
        dragged.beenDragged = undefined;
        /**
         * @type {typeof dragged.anchor}
         */
        let lastTarget = document.body;
        if (event instanceof TouchEvent || event instanceof PointerEvent)
            for (let target of document.querySelectorAll(".target")) {
                for (let touch of event.changedTouches || [event]) {
                    var point = { x: touch.clientX, y: touch.clientY };
                    if (target.getBoundingClientRect().contains(point)) {
                        if (target.anchored && target.anchored.length == Drag.attr(target, "maxAnchored", Infinity)) break;
                        lastTarget = target;
                        if (Drag.attr(target, "for", dragged.id).split(/, ?/).indexOf(dragged.id) !== -1) {
                            failed = false;
                            if (!target.classList.contains("reset") && dragged.success) dragged.success(target);
                        }
                        break;
                    }
                }
            }
        if (failed && dragged.fail && beenDragged) dragged.fail.call(dragged);

        if (!failed && lastTarget.classList.contains("reset")) {
            while (dragged.oldStyles)
                Drag.unstashStyle(dragged);
            dragged.originBounds = undefined;
            if (dragged.anchor && Drag.boolAttr(dragged, "centered")) {
                let anchor = dragged.anchor;
                anchor.anchored = anchor.anchored.filter(el => el !== dragged);
                if (anchor.anchored.length)
                    anchor.anchored.filter(el => Drag.boolAttr(el, "centered")).forEach(Drag.centerEl.bind(this, anchor.getBoundingClientRect()));
                else
                    anchor.anchored = undefined;
                dragged.anchor = undefined;
            }
        } else if ((!failed || (lastTarget.classList.contains("target") && Drag.boolAttr(dragged, "allowwrong"))) && Drag.boolAttr(dragged, "anchored")) {
            if (!lastTarget.anchored) lastTarget.anchored = [];
            lastTarget.anchored.push(dragged);
            if (Drag.boolAttr(dragged, "centered")) {
                if (dragged.anchor !== lastTarget) {
                    if (dragged.anchor) {
                        let prevAnchor = dragged.anchor;
                        prevAnchor.anchored = prevAnchor.anchored.filter(el => el !== dragged);
                        if (prevAnchor.anchored.length)
                            prevAnchor.anchored.filter(el => Drag.boolAttr(el, "centered")).forEach(Drag.centerEl.bind(this, prevAnchor.getBoundingClientRect()));
                        else
                            prevAnchor.anchored = undefined;
                    }
                    lastTarget.anchored.filter(el => Drag.boolAttr(el, "centered")).forEach(Drag.centerEl.bind(this, lastTarget.getBoundingClientRect()));
                    dragged.anchor = lastTarget;
                } else
                    Drag.unstashStyle(dragged);
            }
            if (Drag.boolAttr(dragged, "removeonplace")) {
                let bounds = dragged.getBoundingClientRect();
                if (window.rotation) bounds = window.rotation.resize(bounds);
                dragged.originBounds = bounds;
                dragged.style.position = "absolute";
                let point = { x: bounds.x + dragged.offset.x, y: bounds.y + dragged.offset.y };
                if (window.rotation) point = rotation.transform(point);
                dragged.style.left = `${(point.x).toFixed(1)}px`;
                dragged.style.top = `${(point.y).toFixed(1)}px`;
                dragged.style.width = `${bounds.width}px`;
                dragged.style.height = `${bounds.height}px`;

                dragged.style.transform = "";
            } else if (Drag.boolAttr(dragged, "removeondrag")) {
                dragged.style.position = "";
                let bounds = dragged.getBoundingClientRect();
                if (window.rotation) bounds = rotation.transform(bounds);
                dragged.style.left = "";
                dragged.style.top = "";
                dragged.style.transform = `translate(${bounds.x}px, ${bounds.y})`;
            }
            dragged.locked = Drag.boolAttr(dragged, "lockanchored");
        } else {
            if (Drag.boolAttr(dragged, "failanimation")) {
                dragged.style.transition += `${dragged.style.transition.length ? ", " : ""}${TRANSITION_TIME / 1000}s transform`;
                dragged.style.transform = dragged.oldTransform;
                dragged.locked = true;
                setTimeout(() => {
                    Drag.unstashStyle(dragged);
                    dragged.locked = false;
                }, TRANSITION_TIME);
            } else if (!dragged.altDrag)
                Drag.unstashStyle(dragged);

        }
        if (dragged.drop) dragged.drop.call(dragged, lastTarget);
    },

    emulateDrag(el, target, i, all = [], lock, stash) {
        while (el.oldStyles) Drag.unstashStyle(el);
        if (stash) Drag.stashStyle(el, true);
        let obsolute = Drag.boolAttr(el, "removeondrag");
        el.style.top = "unset";
        el.style.left = "unset";
        el.style.right = "unset";
        el.style.bottom = "unset";
        el.oldTransform = el.style.transform;

        /**
         * @type {DOMRect}
         */
        let bounds = el.getBoundingClientRect();
        if (window.rotation) bounds = rotation.resize(bounds);
        if (obsolute) {
            el.style.position = "absolute";
            void el.clientHeight;
            el.style.width = `${bounds.width}px`;
            el.style.height = `${bounds.height}px`;
            el.style.left = el.style.top = 0;
            let tmpBounds = el.getBoundingClientRect();
            let point = { x: bounds.x - tmpBounds.x, y: bounds.y - tmpBounds.y };
            el.offset = { x: point.x, y: point.y };
            if (window.rotation) point = rotation.transform(point);
            el.style.left = `${point.x}px`;
            el.style.top = `${point.y}px`;

        }
        if (Drag.boolAttr(el, "anchored")) {
            el.anchor = target;
            target.anchored = target.anchored && target.anchored.concat(el) || [el];
        }
        el.originBounds = { x: 0, y: 0 };

        el.locked = lock;
        if (obsolute) {
            Drag.centerEl(target.getBoundingClientRect(), el, i, all);
            let newBounds = el.getBoundingClientRect();
            let newPos = { x: newBounds.x - bounds.x + el.offset.x, y: newBounds.y - bounds.y + el.offset.y };
            if (window.rotation) newPos = rotation.transform(newPos);
            el.style.left = `${newPos.x}px`;
            el.style.top = `${newPos.y}px`;
            el.style.transform = "";
        }
    },

    /**
     * 
     * @param {{el: HTMLElement, ogBounds: DOMRect, transitionDuration: number}} param0 
     * @param {{el: HTMLElement, ogBounds: DOMRect}} param1 
     */
    swap({ el, ogBounds, preservePosition = true, transitionDuration, undoChange = true }, { el: other }) {
        if (ogBounds === undefined) ogBounds = el.originBounds || el.getBoundingClientRect();
        el.originBounds = other.getBoundingClientRect();
        other.originBounds = ogBounds;
        void el.clientWidth;
        let diff = { x: el.originBounds.x - ogBounds.x, y: el.originBounds.y - ogBounds.y };
        if (window.rotation) diff = rotation.transform(diff);
        if (!transition) {
            if (preservePosition) {
                let [x, y] = (el.style.transform.match(/translate ?\(([ \-0-9.]+)p?x?,([ \-0-9.]+)p?x? *\)/) || [0, 0, 0]).slice(1).map(Number);
                el.style.transform = `translate(${x - diff.x}px, ${y - diff.y}px)`;
            }
            Drag._swapEls(el, other);
        } else {
            Drag.stashStyle(el);
            Drag.stashStyle(other);
            el.style.transition = `${transitionDuration}s transform ease-in-out`;
            other.style.transition = el.style.transition;
            el.style.transform = `translate(${diff.x}px, ${diff.y}px)`;
            other.style.transform = `translate(${-diff.x}px, ${-diff.y}px)`;
            setTimeout(() => {
                Drag._swapEls(el, other);
                if (undoChange) {
                    Drag.unstashStyle(other);
                    Drag.unstashStyle(el);
                }
            }, transitionDuration * 1000);
        }
    },
    /**
     * 
     * @param {HTMLElement} el 
     * @param {HTMLElement} other 
     */
    _swapEls(el, other) {
        if (other.parentElement === el.parentElement) {
            let parent = el.parentElement;
            let prevSib = el.nextElementSibling;
            let oPrevSib = other.nextElementSibling;

            parent.insertBefore(el, oPrevSib);
            parent.insertBefore(other, prevSib);
        } else {
            let parent = el.parentElement;
            other.parentElement.append(el);
            parent.append(other);
        }
    },
    /**
     * 
     * @param {HTMLElement & {anchor: Element}} el
     * @param {number} loops count to check for a change in the anchor's position, -1 for always
     * @param {number} [updateInterval] in milliseconds
     */
    snapToAnchor(el, time, updateInterval = 1000 / 30) {
        let i = 0;
        let loops = Math.ceil(time / updateInterval);
        let obsolute = Drag.boolAttr(el, "removeonplace");
        let curPos = el.getBoundingClientRect();
        let anchorPos = el.getBoundingClientRect();
        let ogDiff = curPos.move(-anchorPos.x, -anchorPos.y);
        let id = setInterval(() => {
            curPos = el.getBoundingClientRect();
            anchorPos = el.anchor.getBoundingClientRect();
            let style = getComputedStyle(el);
            let offsetPos = curPos.move(-anchorPos.x - ogDiff.x, -anchorPos.y - ogDiff.y);
            if (window.rotation) offsetPos = rotation.transform(offsetPos);
            if (obsolute) {
                el.style.top = `${parseFloat(style.top) - offsetPos.y}px`;
                el.style.left = `${parseFloat(style.left) - offsetPos.x}px`;
            } else {
                let transformed = Drag.dissectTranslation(style.transform);
                Drag.updateTranslation(el, offsetPos.move(transformed.x, transformed.y));
            }
            i++;
            if (i === loops) clearInterval(id);
        }, updateInterval);
        return id;
    },
    /**
     * 
     * @param {HTMLElement} el 
     * @param {DOMRect} bBox
     * @param {DOMRect | HTMLElement} other 
     */
    positionEl(el, bBox = el.getBoundingClientRect(), other, { left = 0, top = 0 }) {
        let point = Drag.relativePos(el, bBox, other, { left, top });
        Drag.updateTranslation(el, point);
    },
    /**
     * @param {HTMLElement} el 
     * @param {DOMRect} bBox
     * @param {DOMRect | HTMLElement} other 
     * @param {{left: number, top: number}}
     */
    relativePos(el, bBox, other, { left, top }) {
        let [x, y] = (el.style.transform || "translate(0, 0)").match(/translate ?\(([ \-0-9.]+)p?x?,([ \-0-9.]+)p?x? *\)/).slice(1).map(Number);
        if (other instanceof Element) other = other.getBoundingClientRect();
        let positions = { x: left, y: top };
        if (window.rotation) positions = rotation.transform(positions, false, true);
        let alignCordinates = { x: (other.width - bBox.width) * positions.x, y: (other.height - bBox.height) * positions.y };
        let res = { x: other.x - bBox.x + alignCordinates.x, y: other.y - bBox.y + alignCordinates.y };

        if (window.rotation) res = rotation.transform(res);
        res.x += x;
        res.y += y;
        return res;
    },
    toAbsolute(el, { x, y }) {
        let [tX, tY] = (el.style.transform || "translate(0, 0)").match(/translate ?\(([ \-0-9.]+)p?x?,([ \-0-9.]+)p?x? *\)/).slice(1).map(Number);
        if (el instanceof Element) el = el.getBoundingClientRect();
        return { x: el.x + x - tX, y: el.y + y + tY };
    },
    dissectTranslation(transform) {
        let [x, y] = (transform.match(/translate ?\(([ \-0-9.]+)p?x?,([ \-0-9.]+)p?x? *\)/) || [0, 0, 0]).slice(1).map(Number);
        return { x, y };
    },
    /**
     * 
     * @param {HTMLElement} el 
     * @param {{x: number, y: number}}} param1 
     */
    updateTranslation(el, { x, y }) {
        if (el.style.transform.indexOf("translate") !== -1)
            el.style.transform = el.style.transform.replace(/translate ?\(([ \-0-9.]+)p?x? ?,([ \-0-9.]+)p?x? *\)/, `translate(${x}px, ${y}px)`);
        else
            el.style.transform += `translate(${x}px, ${y}px)`;
    },
    destroy(el) {
        el.removeEventListener("pointerdown", Drag.dragStart);
    },
    lineTo(x, y, el, ogPos = { x: 0, y: 0 }) {
        let [originX, originY] = getComputedStyle(el).transformOrigin.split(" ");
        originX = parseFloat(originX);
        originY = parseFloat(originY);
        let pos = { x, y };
        let origin = { x: originX, y: originY };
        if (rotation) {
            ogPos = rotation.transform(ogPos, true);
            pos = rotation.transform(pos, true);
            origin = rotation.transform(origin);
        }
        dot({ id: "og", x: ogPos.x + origin.x, y: ogPos.y + origin.y });
        dot({ id: "cur", x: pos.x, y: pos.y });
        let angle = Math.atan2(Math.round(pos.y - ogPos.y - origin.y), Math.round(pos.x - ogPos.x - origin.x)) / Math.PI * 180;
        let length = Math.sqrt(Math.pow(Math.abs(pos.x - ogPos.x - origin.x), 2) + Math.pow(Math.abs(pos.y - ogPos.y - origin.y), 2)) + Math.sqrt((origin.x * origin.x + origin.y * origin.y) * 2);
        return { angle, length };
    },
    centerEl(targetBounds, el, i, all) {
        if (window.rotation) targetBounds = window.rotation.resize(targetBounds);
        var x, y;
        if (el.hasAttribute("drag-origin")) {
            [x, y] = el.getAttribute("drag-origin").split(",");
            [x, y] = [x / 100, y / 100];
        } else
            [x, y] = [.5, .5];
        el.style.left = el.style.top = 0;
        el.style.transform = "none";
        void el.clientWidth;
        let offset = el.getBoundingClientRect();
        let indexOffset = {
            width: targetBounds.width * (i + 1) / (all.length + 1) - el.clientWidth * x,
            height: targetBounds.height / 2 - el.clientHeight * y
        };
        if (window.rotation) indexOffset = rotation.transform(indexOffset);

        let point = {
            x: targetBounds.x + indexOffset.width - offset.x - el.originBounds.x,
            y: targetBounds.y + indexOffset.height - offset.y - el.originBounds.y
        };
        if (window.rotation) point = rotation.transform(point);
        el.style.transform = `translate(${point.x}px, ${point.y}px)`;
    },
    /**
     * 
     * @template {HTMLElement} T  
     * @param {T} el 
     * @param {string} name 
     * @param {string} def
     * @returns {string}
     */
    attr(el, name, def) {
        return (el.hasAttribute(name) && el.getAttribute(name)) || def;
    },

    /**
     * 
     * @template {HTMLElement} T 
     * @param {T} el
     * @param {string} name 
     * @returns {boolean}
     */
    boolAttr(el, name) {
        return el.hasAttribute(name) && el.getAttribute(name) !== "false";
    },
    /**
     * 
     * @param {string | Function} fn 
     * @param {Element} el 
     * @param {string} name 
     */
    eventFn(fn, el, name) {
        let attr = fn || el.getAttribute(`on${name}`);
        if (!attr) return;
        el[name] = typeof attr === "string" && Function(attr) || attr;
    },
};

/**
 * @typedef {string | ((this: HTMLElement) => void)} eventFn
 * @param {HTMLElement} el
 * @param {string | HTMLElement & {sortList?: HTMLElement[]}} parent
 * @param {{axis: "both" | "x" | "y", swap: string | ((this: HTMLElement, swapTo: HTMLElement) => void), drop: (string | (this: HTMLElement, target: HTMLElement) => void), drag: eventFn, pickup: eventFn, success: string | ((this: HTMLElement, target: HTMLElement)), fail: eventFn,}}
 */
function sortable(el, parent, { axis = "both", swap, drop, drag, pickup, success, fail } = {}) {
    if (typeof parent === "string")
        parent = /** @type {HTMLElement & {sortList?: HTMLElement[]}}*/(document.querySelector(parent));
    parent.sortList = parent.sortList || [];
    parent.sortList.push(el);
    Drag.eventFn(swap, el, "swap");
    let lastTarget;
    draggable(el, {
        drag() {
            let bBox = el.getBoundingClientRect();
            for (let neighbour of parent.sortList) {
                if (neighbour === el) continue;
                let oBBox = neighbour.getBoundingClientRect();
                if (lastTarget && (lastTarget !== neighbour || (oBBox.intersection(bBox) < .9 && oBBox.intersection(bBox) !== 0))) continue;
                lastTarget = undefined;
                let ogYDiff = el.originBounds.y - oBBox.y;
                let ogXDiff = el.originBounds.x - oBBox.x;
                let both = axis === "both" && oBBox.intersects(bBox);
                if ((axis === "x" || both) && (ogYDiff < 0 ? (bBox.bottom > oBBox.top) : bBox.top < oBBox.bottom) ||
                    (axis === "y" || both) && (ogXDiff < 0 ? (bBox.right > oBBox.left) : bBox.left < oBBox.right)) {
                    Drag.swap({ el, bBox }, { el: neighbour, bBox: oBBox });
                    if (el.swap) el.swap.call(el, neighbour);
                    lastTarget = neighbour;
                    break;
                }
            }
            if (drag) drag.call(this);
        }, drop, pickup, success, fail
    });
}

/**
 * 
 * @param {HTMLElement} anchor 
 * @param {HTMLElement} el 
 * @param {{ogPos: {x: number, y: number}, drop?: (this: HTMLElement, prev: HTMLElement, target: HTMLElement, prevAnchored: HTMLElement) => void, validate: (this: HTMLElement, old: HTMLElement) => boolean, drag?: ((this: HTMLElement,angle: number, length: number, position: {x: number, y: number}) => void), pickup?: eventFn, dismiss?: ((this: HTMLElement, next: HTMLElement) => void)}} param2 
 */
function anchoredDraggable(anchor, el, { ogPos, drag, validate, drop, pickup, dismiss } = {}) {
    if (!drag) throw new Error(`A drag/draw function must be given for anchoredDraggable, Info: Element: ${el} anchor: ${anchor}`);
    ogPos = ogPos || el.getBoundingClientRect();
    el.ogPos = ogPos;
    el.firstAnchor = anchor;
    anchor.anchored = el;
    draggable(el, {
        drop(target) {
            let prev = el.secondAnchor;
            let prevAnchored = target.anchored;
            console.log(prev, prevAnchored)
            el.secondAnchor = target;
            if (el.validate && !el.validate.call(el, prevAnchored)) return;
            if (prevAnchored && prevAnchored.dismiss && prevAnchored !== el) prevAnchored.dismiss(el, prev);
            target.anchored = el;
            if (el.altDrop) el.altDrop.call(el, prev, target, prevAnchored);
        }, pickup, drag({ x, y }) {
            let { angle, length } = Drag.lineTo(x, y, this, this.ogPos);
            if (el.altDrag) el.altDrag.call(el, angle, length, { x, y });
        }
    });
    Drag.eventFn(dismiss, el, "dismiss");
    Drag.eventFn(validate, el, "validate");
    Drag.eventFn(drag, el, "altDrag");
    Drag.eventFn(drop, el, "altDrop");

    /**@type {PointerEvent} */
    let ev = Object.defineProperty(new PointerEvent("pointerdown"), "target", { value: el });
    ev.initMouseEvent("pointerdown", true, true, window, 0, ogPos.x, ogPos.y, ogPos.x, ogPos.y, false, false, false, false, 0, anchor);
    Drag.dragStart(ev);
}

/**
 * @typedef {string | ((this: HTMLElement) => void)} eventFn
 * @param {HTMLElement} el
 * @param {{drop: string | (this: HTMLElement, target: HTMLElement), drag: string | ((this: HTMLElement, position: {x: number, y: number}) => void), pickup: eventFn, success: string | ((this: HTMLElement, target: HTMLElement)), fail: eventFn,}}
 */
function draggable(el, { drop, drag, pickup, success, fail } = {}) {
    if (!el) console.error(`illegal element given to draggable function: ${el}`);
    Drag.eventFn(drop, el, "drop");
    Drag.eventFn(success, el, "success");
    Drag.eventFn(fail, el, "fail");
    Drag.eventFn(pickup, el, "pickup");
    Drag.eventFn(drag, el, "drag");
    el.addEventListener("pointerdown", Drag.dragStart, false);
    el.addEventListener("dragstart", e => e.preventDefault(), false);
}