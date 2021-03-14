
/// <reference path="defs.d.ts"/>
/**
 * @type {ExerciseScreen[]}
 */
var screens = [];
/**
 * @type {ExerciseScreen[]}
 */
var extScreens = [{
    type: "about",
    index: -1
}];

/**
 * @typedef {ExerciseScreen & {
    *  progress: number,
    *  maxProgress: number
    * }} MultiScreen
    */

/**
 * @type {ExerciseScreen}
 */
let currentScreen;
//current 
let global = { progressUnit: 0, scoreUnit: 0, score: 0, current: { type: "", maxProgress: 0, progress: 0 } };

let historyStack = {
    coolDown: undefined,
    stack: [],
    forwardStack: [],
    /**
     * 
     * @param {ExerciseScreen} [newScreen] 
     */
    back(newScreen) {
        let screenProvided = newScreen instanceof ExerciseScreen;
        if (!screenProvided && currentScreen.index <= 0) return false;
        historyStack.forwardStack.push(currentScreen);
        global.current.progress--;
        if (historyStack.stack.length) {
            historyStack.stack.pop();
            Object.getPrototypeOf(historyStack).back();
        } else {
            if (!screenProvided) {
                if (currentScreen.progress)
                    newScreen = currentScreen.advance(-1);
                else {
                    let index = currentScreen.index;
                    if (index > screens.length - 1) index = screens.length - 1;
                    newScreen = screens[currentScreen.index - 1];
                    if (newScreen.maxProgress > 1) {
                        newScreen.element.classList.add(progressClass(newScreen.maxProgress - 1));
                        newScreen = newScreen.advance(newScreen.maxProgress - 1);
                    }
                }
            }
            changeScreen(newScreen);
            history.replaceState(null, currentScreen.title, location.pathname + (currentScreen.urlHash || ""));
        }
        return true;
    },
    pushState(state, title, url) {
        historyStack.stack.push(currentScreen);
        Object.getPrototypeOf(historyStack).pushState(state, title, url);
    },
    forward() {
        if (currentScreen.index === screens.length - 1 && currentScreen.maxProgress - 1 === currentScreen.progress)
            return false;
        let index = currentScreen.index;
        if (index < -1) index = -1;
        if (!currentScreen.finished) {
            if ('__dev__mode__flag' in window && !currentScreen.isInteractive) {
                debugger;
                return false;
            }
            else if (currentScreen.isInteractive) return false;
            else console.warn("bad transition, a non interactive card was forced complete");
        }
        let newScreen;
        global.current.progress++;
        if (historyStack.forwardStack.length)
            newScreen = historyStack.forwardStack.pop();
        else if (currentScreen.maxProgress && currentScreen.progress < currentScreen.maxProgress - 1)
            newScreen = currentScreen.advance(1);
        else newScreen = screens[index + 1];
        changeScreen(newScreen);
        historyStack.pushState(null, newScreen.title, location.pathname + (newScreen.urlHash || ""));
        return true;
    },
    go: history.go.bind(history),
};
Object.setPrototypeOf(historyStack, history);

let cardTypes = {};

class ExerciseScreen {
    /**
     * 
     * @param {number} index 
     * @param {string} type 
     * @param {string} title 
     * @param {string} name 
     */
    constructor(index, type, title, name) {
        this.index = index;
        this.type = type;
        this.title = title;
        this.name = name;
    }

    /**
     * @returns {{[index: string]: any, finished: boolean[]}}
     */
    get storage() {
        return JSON.parse(ExerciseScreen.storage[`${this.uniqueID}Screen`] || "{}");
    }

    set storage(value) {
        ExerciseScreen.storage[`${this.uniqueID}Screen`] = JSON.stringify(value);
    }

    /**
     * @returns {HTMLElement}
     */
    get element() {
        return document.querySelector(this.query());
    }

    get baseElement() {
        return document.querySelector(`.card.${this.typeClass}`);
    }

    get innerHTML() {
        return this.element.innerHTML;
    }

    set innerHTML(value) {
        return this.element.innerHTML = value;
    }

    /**
     * @returns {boolean}
     */
    get finished() {
        return this.getStore("finished");
    }

    set finished(value) {
        this.store("finished", value);
        updateProgress();
    }

    get uniqueID() {
        return `${this.type}${this.typeIndex ? `#${this.typeIndex}` : ""}`;
    }

    /**
     * @returns {CardType}
     */
    get cardType() {
        return cardTypes[this.type];
    }

    get maxProgress() {
        return this.cardType.getMaxProgress(this);
    }

    get isInteractive() {
        return this.cardType.isInteractive(this);
    }

    get urlHash() {
        let progress = this.maxProgress > 1 ? `@${this.progress || 0}` : "";
        return this.index === 0 ? "" : `#${this.uniqueID}${progress}`;
    }

    get typeClass() {
        Object.defineProperty(this, "typeClass", { value: this.type.replace(/.[A-Z]/g, (str) => `${str.substr(0, 1)}-${str.substr(1).toLowerCase()}`) });
        return this.typeClass;
    }

    cache(el = this.element) {
        if (el) {
            Object.defineProperty(this, "element", { configurable: true, writable: false, value: el, enumerable: true });
            this.cached = true;
        } else if (el === null) {
            this.cached = false;
            delete this.element;
        }
    }

    stealElement(el = document.querySelector(`.card.${this.typeClass}`)) {
        el.className = `card ${this.typeClass}${this.progress ? ` prog${this.progress}` : ""}`;
        this.cache();
    }

    /**
     * 
     * @param {HTMLElement} el 
     * @param {HTMLElement[]} ignore
     */
    toSelector(el, classList = el.classList) {
        if (el === this.element) return "";
        if (typeof el === "string") return el;
        let selector = `${el.tagName}${el.id ? `#${el.id}` : ""}${Array.from(classList).reduce((str, cls) => `${str}.${cls}`, "")}`;
        let els = this.querySelectorAll(selector);
        let index = els.length > 1 && Array.from(els).indexOf(el);
        return index > 0 ? `${selector}@${index}` : selector;
    }

    query() {
        return `.card.${this.typeClass}${this.progress ? `.prog${this.progress}` : ':not([class*="prog"])'}`;
    }

    /**
     * @param {string | HTMLElement} query
     */
    querySelector(query) {
        if (query instanceof HTMLElement) return query;
        let number;
        [query, number] = query.split("@");
        if (number)
            return this.querySelectorAll(query)[Number(number)];
        if (this.cached) return query ? this.element.querySelector(query) : this.element;
        return document.querySelector(`${this.query()} ${query}`);
    }

    /**
     * @param {string} query
     * @returns {NodeListOf<Element>}
     */
    querySelectorAll(query) {
        if (this.cached) return this.element.querySelectorAll(query);
        return document.querySelectorAll(`${this.query()} ${query}`);
    }

    /**
     * 
     * @param {string} name 
     * @param {number} [value] 
     * @param {() => void} [done]
     * @returns {number}
     */
    coolDown(name, value, done) {
        if (!this.coolDowns) {
            if (!value) return 0;
            else this.coolDowns = {};
        }
        let coolDown = this.coolDowns[name];
        if (!coolDown) {
            if (!value) return 0;
            else coolDown = this.coolDowns[name] = {};
        }
        if (value) {
            if (coolDown.time) {
                clearTimeout(coolDown.id);
                let remaining = (coolDown.time + (coolDown.start - new Date()));
                value = Math.max(remaining, value);
            }
            coolDown.time = value;
            coolDown.start = new Date();
            coolDown.id = setTimeout(() => {
                if (done) done();
                coolDown.time = 0;
            }, coolDown.time);
        }
        return coolDown.time || 0;
    }

    store(name, val) {
        let storage = this.storage;
        storage[name] = storage[name] || [];
        storage[name][this.progress || 0] = val;
        this.storage = storage;
    }

    getStore(name) {
        return (this.storage[name] || [])[this.progress || 0];
    }

    populate() {
        if (this.element.hasInitialized) return;
        if (!this.cardType.isInteractive(this)) this.finished = true;
        this.prepare();
        this.cardType.init(this, this.helper);
        this.element.hasInitialized = true;
    }

    prepare() {
        if (!('progress' in this) && this.cardType.getMaxProgress(this) > 1)
            this.progress = 0;
        this.selected = {};
        this.helper = new ScreenHelper(this);
        this.cardType.select(this);
    }

    update() {
        if (!this.selected)
            this.prepare();
        this.cardType.select(this);
        this.cardType.render(this, this.helper);
    }

    invalidate() {
        this.cardType.render(this, this.helper);
    }

    disable() {
        this.element.classList.add("disable");
    }

    advance(progress) {
        let newScreen = Object.assign({}, this);
        Object.setPrototypeOf(newScreen, ExerciseScreen.prototype);
        newScreen.cache(null);
        newScreen.progress = (this.progress || 0) + (progress || 0);
        return newScreen;
    }

    /**
     * @param {number} delay 
     */
    dismiss(delay) {
        if (delay)
            setTimeout(this.dismiss.bind(this), delay);
        else
            this.element.remove();
    }

    hint(hint) {
        if (this.finished) return;
        if (hint && hint.length) {
            this.helper.removeCls(".hint-btn", "disable");
            this.querySelector(".hint-btn").addEventListener("click", () => this.helper.addCls(".hint-container", "opened"));
            this.querySelector(".hide-hint-btn").addEventListener("click", () => this.helper.removeCls(".hint-container", "opened"));
            let paragraph = multilineText(hint, El("p"));
            this.querySelector(".hint").innerHTML = "";
            this.querySelector(".hint").append(paragraph);
        }
    }

    explain(explanation) {
        if (!this.finished) {
            this.querySelector(".check-btn").innerHTML = "בדקו";
            return;
        }
        if (explanation && explanation.length) {
            this.helper.addCls("", "show-explanation");
            document.querySelector(".card.explanation").classList.remove("disable");
            multilineText(explanation, document.querySelector(".card.explanation .text>div"));
        } else
            this.querySelector(".check-btn").innerHTML = "המשיכו";
    }
}

ExerciseScreen.storage = sessionStorage;

class CardType {
    /**
     * 
     * @param  {...string} multiScreenFields 
     */
    constructor(...multiScreenFields) {
        this.multiScreenFields = multiScreenFields;
    }

    /**
     * @param {ExerciseScreen} screen 
     */
    getMaxProgress(screen) {
        let max = 1;
        for (let field of this.multiScreenFields || [])
            max = Math.max(max, field in screen && screen[field].length);
        return max;
    }

    scoreForScreen(screen) {
        return this.getWeight(screen, screen.progress) / screen.maxProgress * screen.maxScore;
    }

    select(screen) {
        let progress = screen.progress || 0;
        for (let field of this.multiScreenFields)
            if (screen[field])
                screen.selected[field] = screen[field][progress];
            else
                screen.selected[field] = screen[[field.substr(0, field.length - 1)]];
    }

    /**
     * 
     * @param {ExerciseScreen} screen 
     */
    init(screen) {

    }

    /**
     * @param {ExerciseScreen} screen 
     * @param {ScreenHelper} helper 
     */
    render(screen, _helper) {
        screen.innerHTML = "No render for card!";
    }

    /**
     * 
     * @param {ExerciseScreen} _screen 
     * @param {ScreenHelper} _helper 
     */
    disable(_screen, _helper) { }

    /**
     * @param {ExerciseScreen} _screen 
     * @param {ScreenHelper} _helper
     */
    isInteractive(_screen, _helper) {
        return false;
    }

    getWeight(_screen, _progress) {
        return 1;
    }
}

class ScreenHelper {
    /**
     * 
     * @param {ExerciseScreen} screen 
     */
    constructor(screen) {
        this.serialized = false;
        /**
         * @type {Map<string | Element, {[string]: any}>>}
         */
        this.changeQueue = new Map();
        /**
         * @type {Map<Element, {[string]: any}>>}
         */
        this.externalQueue = new Map();
        this.screen = screen;
    }


    undo(screen = this.screen) {
        if (this.screen !== screen) this.serialize();
        Array.from(this.changeQueue.entries()).map(e => [screen.querySelector(e[0]), e[1]]).forEach(([el, changes]) => {
            if (changes.css)
                Object.keys(changes.css).forEach(k => el.style[k] = changes.css[k]);
            if (changes.addCls)
                el.classList.remove(...changes.addCls);
            if (changes.removeCls)
                el.classList.add(...changes.removeCls);
        });
        Array.from(this.externalQueue.entries()).forEach(([el, changes]) => {
            if (changes.listeners) {
                let listeners = changes.listeners;
                for (let type of Object.keys(listeners)) {
                    for (let listenerDetails of listeners[type])
                        el.removeEventListener(type, listenerDetails[0], listenerDetails[1]);
                }
            }
        });
        this.changeQueue = new Map();
        this.serialized = false;
    }

    serialize() {
        this.serialized = true;
        let newQueue = new Map();
        for (let el of this.changeQueue.keys())
            newQueue.set(this.screen.toSelector(el), this.changeQueue.get(el));
        this.changeQueue = newQueue;
    }

    deserialize(screen = this.screen) {
        let newQueue = new Map();
        for (let el of this.changeQueue.keys())
            newQueue.set(screen.querySelector(el), this.changeQueue.get(el));
        this.changeQueue = newQueue;
        this.serialized = false;
    }

    /**
     * 
     * @param {string | Element} el 
     * @param  {...string} classes 
     */
    toggle(el = this.screen.element, ...classes) {
        el = this.screen.querySelector(el);
        let remove = [];
        let add = [];
        for (let cls of classes) {
            if (el.classList.contains(cls))
                remove.push(cls);
            else
                add.push(cls);
        }
        this._cls(el, "removeCls", "addCls", true, ...remove);
        this._cls(el, "addCls", "removeCls", false, ...add);
    }
    /**
     * 
     * @param {string | Element} el 
     * @param {string} cls 
     * @param {boolean} add 
     */
    forceToggle(el = this.screen.element, cls, add) {
        el = this.screen.querySelector(el);
        if (add === el.classList.contains(cls)) return;
        if (add)
            this._cls(el, "addCls", "removeCls", false, cls);
        else
            this._cls(el, "removeCls", "addCls", true, cls);
    }

    _newQueue(queue, el, obj) {
        this.changeQueue.set(el, Object.freeze(Object.assign(obj, queue)));
    }
    /**
     * @private
     */
    _cls(el, op, otherOp, remove, ...classes) {
        if (this.serialized) return;
        el = this.screen.querySelector(el);
        let changeQueue = this.changeQueue.get(el) || {};
        let opQueue = changeQueue[op] || [];
        let otherQueue = changeQueue[otherOp] || [];
        for (let cls of classes) {
            let commit = true;
            let index = otherQueue ? otherQueue.indexOf(cls) : -1;
            if (index !== -1) {
                otherQueue.splice(index, 1);
                commit = false;
            }
            if (otherQueue && !otherQueue.length) otherQueue = [];
            if (el.classList.contains(cls) === remove) {
                if (commit)
                    opQueue.push(cls);
                el.classList.toggle(cls, !remove);
            }
        }
        if (opQueue.length && (!(op in changeQueue) || !(otherOp in changeQueue)))
            this._newQueue(changeQueue, el, { [op]: opQueue, [otherOp]: otherQueue });
    }


    /**
     * @template {keyof HTMLElementEventMap} T
     * @param {string | EventTarget} el 
     * @param {T} type
     * @param {(this: HTMLElement, ev: HTMLElementEventMap[T]) => boolean} listener
     * @param {AddEventListenerOptions | boolean} opts
     */
    addListener(el, type, listener, opts = false) {
        if (typeof el === "string") el = document.querySelector(el);
        let changeQueue = this.externalQueue.get(el) || {};
        let listenersQueue = changeQueue.listeners || {};
        let typeQueue = listenersQueue[type] = listenersQueue[type] || [];
        el.addEventListener(type, listener, opts);
        typeQueue.push([listener, opts]);
        if (!("listeners" in changeQueue))
            this.externalQueue.set(el, Object.freeze(Object.assign({ listeners: listenersQueue }, changeQueue)));
    }

    /**
     * @template {keyof HTMLElementEventMap} T
     * @param {string | HTMLElement} el 
     * @param {T} type
     * @param {(this: HTMLElement, ev: HTMLElementEventMap[T]) => boolean} listener
     * @param {EventListenerOptions | boolean} opts
     */
    removeListener(el, type, listener, opts) {
        el = this.screen.querySelector(el);
        let changeQueue = this.changeQueue.get(el) || {};
        let listenersQueue = changeQueue.listeners;
        if (listenersQueue && listenersQueue[type]) {
            let typeQueue = listenersQueue[type];
            typeQueue.some(([oldListener], i) => {
                if (oldListener === listener) {
                    typeQueue.splice(i, 1);
                    return true;
                }
            });
        }
        el.removeEventListener(type, listener, opts);
    }

    /**
     * 
     * @param {string | HTMLElement} el 
     * @param {{[M in keyof CSSStyleDeclaration]: CSSStyleDeclaration[M]}} css 
     */
    css(el, css) {
        if (this.serialized) return;
        el = this.screen.querySelector(el);
        let changeQueue = this.changeQueue.get(el) || {};
        let cssQueue = changeQueue.css || {};
        let commit = false;
        Object.keys(css).forEach(k => {
            if (css[k] === el.style[k]) return;
            if (css[k] === "" && (cssQueue[k] === "" || (!cssQueue[k] && !el.style[k]))) delete cssQueue[k];
            commit = true;
            if (!cssQueue[k]) cssQueue[k] = el.style[k];
            el.style[k] = css[k];
        });
        if (!('css' in changeQueue)) this._newQueue(changeQueue, el, { cssQueue });
    }

    /**
     * 
     * @param {string | Element} el
     * @param  {...string} classes 
     */
    removeCls(el = this.screen.element, ...classes) {
        this._cls(el, "removeCls", "addCls", true, ...classes);
    }

    /**
     * 
     * @param {string | Element} el
     * @param  {...string} classes 
     */
    addCls(el = this.screen.element, ...classes) {
        this._cls(el, "addCls", "removeCls", false, ...classes);
    }
}

/**
 * @template R, T
  * @typedef {{[M in keyof (R & T)]: (T & R)[M]}} Merge 
 */
/**
 * @template {string} FS
 * @typedef {(screen: ExerciseScreen & {selected: {[index: FS]: any}}, helper: ScreenHelper) => void} cardFn
 */

let nullFn = function () { };

/**
 * @template {string} FS
 * @template {{init?: cardFn<FS>, render?: cardFn<FS>, disable?: cardFn<FS>, isInteractive?: ((screen: ExerciseScreen & {selected: {[index: FS]: any}}) => boolean) | boolean,
 *          defaultRender?: boolean, defualtInit?: boolean}} T
 * @param {T} impl
 * @param  {...FS} fields 
 * @returns {CardType & T}
 */
function card(impl = {}, ...fields) {
    let { init, render, disable, isInteractive, defaultRender = impl.isInteractive, defualtInit = true } = impl;
    let type = Object.assign(new CardType(...fields, "titles", "subtitles"), impl);
    if (render !== null || defaultRender) type.render = defaultRender ? basicRenderer(render) : render || nullFn;
    if (init || defualtInit) type.init = defualtInit ? basicInit(init) : init;
    if (disable) type.disable = disable;
    if (typeof isInteractive === "function") type.isInteractive = isInteractive;
    else type.isInteractive = (_screen, _helper) => isInteractive;
    return type;
}

/**
 * 
 * @param {cardFn} delegate 
 * @returns {cardFn}
 */
function basicInit(delegate) {
    return function init(screen, helper) {
        if (screen.querySelector(".nav-btns")) {
            screen.querySelector(".nav-btns>.back-btn").addEventListener("click", () => {
                if (historyStack.coolDown !== undefined) return;
                historyStack.coolDown = setTimeout(() => historyStack.coolDown = undefined, timeToTransition(screen.element) + 100);
                historyStack.back();
            });
            screen.querySelector(".nav-btns>.next-btn").addEventListener("click", () => {
                if (historyStack.coolDown !== undefined) return;
                historyStack.coolDown = setTimeout(() => historyStack.coolDown = undefined, timeToTransition(screen.element) + 100);
                historyStack.forward();
            });
        }
        multilineText(screen.selected.titles, screen.querySelector(".title"));
        if (screen.selected.subtitles) {
            let value = screen.selected.subtitles;
            let subtitles = screen.querySelectorAll(".subtitle");
            if (subtitles.length === 1)
                multilineText(value, subtitles[0]);
            else {
                for (let i = 0; i < subtitles.length; i++)
                    multilineText(value[i], subtitles[i]);
            }
        }
        if (screen.isInteractive) {
            screen.querySelector(".btn.check-btn").addEventListener("click", function () {
                if (this.classList.contains("ready")) {
                    if (!screen.finished) {
                        screen.finished = true;
                        screen.invalidate();
                        updateProgress();
                    } else historyStack.forward();
                }
            });
        }
        if (delegate) delegate.call(screen.cardType, screen, helper);
    };
}
/**
 * 
 * @param {cardFn} delegate 
 * @returns {cardFn}
 */
function basicRenderer(delegate) {
    return function render(screen, helper) {
        if (delegate) delegate.call(screen.cardType, screen, helper);
        let progressTracker = screen.querySelector(".tracker");
        if (progressTracker)
            progressTracker.innerHTML = `${global.current.progress}/${global.current.maxProgress} תרגולים`;
        if (screen.finished) helper.addCls(".hint-btn", "disable");
    };
}


/**
 * 
 * @param {ExerciseScreen} newScreen
 * @param {boolean} [forceGroupCheck]
 */
function changeScreen(newScreen, forceGroupCheck) {
    if (currentScreen === newScreen) return;
    let old = currentScreen;
    if (old && old.type === newScreen.type) {
        let newEl = old.element.cloneNode(true);
        newScreen.stealElement(newEl);
        old.element.parentElement.appendChild(newEl);
        old.helper.undo(newScreen);
        old.dismiss(timeToTransition(old.element) + 100);
    }
    document.querySelector(".card.explanation").classList.add("disable");
    currentScreen = newScreen;
    let el = currentScreen.element;
    if (!el) currentScreen.stealElement();
    if (currentScreen.element.hasInitialized)
        currentScreen.update();
    else {
        currentScreen.populate();
        currentScreen.invalidate();
    }
    if (((global.current.type === "interactive") !== currentScreen.isInteractive || forceGroupCheck) && currentScreen.weight) {
        findGroup(currentScreen, currentScreen.isInteractive, true);
        currentScreen.invalidate();
    }

    if (old) setTimeout(() => {
        old.helper.undo();
        old.cache(null);
    }, timeToTransition(old.element) + 100);
    transition(old, old && (old.index < currentScreen.index || (old.index === currentScreen.index && old.progress < currentScreen.progress)));
}

function findGroup(screen, interactive, backwards) {
    if (interactive)
        global.current.type = "interactive";
    else
        global.current.type = "static";
    global.current.progress = (screen.progress + 1) || 1;
    global.current.maxProgress = 0;
    let i = screen.index;
    if (backwards) {
        for (; i > 0; i--) {
            if (screens[i - 1].isInteractive !== interactive) break;
            global.current.maxProgress += screens[i - 1].maxProgress;
            global.current.progress += screens[i - 1].maxProgress;
        }
    }

    for (let i = screen.index; i < screens.length; i++) {
        if (screens[i].isInteractive !== interactive) break;
        global.current.maxProgress += screens[i].maxProgress;
    }
}

function progressClass(progress) {
    return progress ? `prog${progress}` : "";
}

/**
 * 
 * @param {ExerciseScreen} screen 
 */
function pretransition(screen, left) {
    let screenEl = screen.element;
    if (screenEl.style.left === left) return;
    screenEl.style.transition = "none";
    screenEl.style.left = left;
    void screenEl.clientWidth;
    screenEl.style.transition = "";
}

function transition(previousScreen, forward) {
    document.activeElement.blur();
    if (forward) {
        pretransition(currentScreen, "-150%");
        currentScreen.element.style.left = "50%";
        if (previousScreen)
            previousScreen.element.style.left = "150%";
    } else {
        pretransition(currentScreen, "150%");
        currentScreen.element.style.left = "50%";
        if (previousScreen)
            previousScreen.element.style.left = "-150%";
    }
}

function updateProgress() {
    progressBarContainer.querySelectorAll(".progress-hole").forEach(e => e.remove());
    let progress = -1;
    let nagativeProgress = 0;
    let progressHoleStart = -1;
    for (let i = screens.length - 1; i >= 0; i--) {
        let screen = screens[i].advance(0);
        for (let i = screen.maxProgress - 1; i >= 0; i--) {
            screen.progress = i;
            if (progress !== -1) {
                if (!screen.finished && progressHoleStart === -1)
                    progressHoleStart = nagativeProgress;
                else if (screen.finished && progressHoleStart !== -1) {
                    let progressHole = El("div", { class: "progress-hole" });
                    progressHole.style.width = `${nagativeProgress - progressHoleStart}vw`;
                    progressHole.style.left = `${progressHoleStart}vw`;
                    progressBarContainer.append(progressHole);
                    progressHoleStart = -1;
                }
            } else if (screen.finished) progress = 100 - nagativeProgress;
            nagativeProgress += screen.cardType.getWeight(screen, i) * global.progressUnit;
        }
        progressBar.style.setProperty("--progress", progress.toFixed());
    }
}