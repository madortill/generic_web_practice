window.__dev__mode__flag = "";
function _setup() {
    let dataRequest = new XMLHttpRequest();
    dataRequest.open("GET", "data.json");
    dataRequest.onreadystatechange = () => {
        if (dataRequest.readyState === XMLHttpRequest.DONE) {
            screens = JSON.parse(dataRequest.response);
            let last;
            let typeMap = {};
            screens = screens.filter((screen, i) => {
                screen.index = i;
                if (!(screen.type in typeMap)) typeMap[screen.type] = 0;
                screen.typeIndex = typeMap[screen.type]++;
                Object.setPrototypeOf(screen, ExerciseScreen.prototype);
                let weight = 0;
                for (let i = 0; i < screen.maxProgress; i++)
                    weight += screen.cardType.getWeight(screen, i);
                screen.weight = weight;
                global.progressUnit += weight;
                if (screen.isInteractive) global.scoreUnit += weight;
                if (last === screen.type) {
                    console.error("Two screens of the same type back-to-back are dissallowed, skipping...");
                    return false;
                }
                last = screen.type;
                return true;
            });
            extScreens = extScreens.map(e => Object.setPrototypeOf(e, ExerciseScreen.prototype));
            global.progressUnit = 100 / global.progressUnit;
            global.scoreUnit = 100 / global.scoreUnit;

            if (document.readyState === "complete") _loadGame();
            else window.onload = _loadGame;
        }
    };
    dataRequest.send();
}
_setup();

function findScreen(hash) {
    if (hash && hash !== "/") {
        let [type, progress] = hash.substr(1).replace("/", "").split("@");
        if (type.endsWith("#0")) type = type.substr(0, type.length - 2);
        for (let screen of extScreens)
            if (screen.uniqueID === type) {
                progress = Math.max(Number(progress || 0), screen.storage.progress || 0);
                return screen.advance(progress);
            }
        for (let screen of screens) {
            if (screen.uniqueID === type) {
                let finished = screen.storage.finished || [];
                let index = "__dev__mode__flag" in window ? screen.maxProgress : finished.findIndex(e => e) + 1;
                progress = Math.min(Number(progress || 0), index);
                return screen.advance(progress);
            }
            if (!screen.finished && !("__dev__mode__flag" in window))
                return screen;
        }
        return new ExerciseScreen(-404, "notFound", "Error 404", "Error - not found");
    } else
        return screens[0];
}
function onportrait() {
    let height = parseFloat(getComputedStyle(document.documentElement).perspective);
    let dims = { width: window.innerWidth, height };
    dims = rotation.transform(dims);
    document.body.style.height = `${dims.height}px`;
    document.body.style.width = `${dims.width}px`;
    window.scrollTo(0, document.body.clientHeight - window.innerHeight);
}

function _loadGame() {
    lockOrientation("landscape");
    let loadedScreen = findScreen(location.hash);
    document.body.addEventListener("keydown", listener, false);
    /** @param {KeyboardEvent} e */
    let id = setTimeout(() => {
        document.body.removeEventListener("keydown", listener, false);
        _loadScreen(loadedScreen);
    }, ("__dev__mode__flag" in window) && 500);
    function listener(e) {
        if (e.shiftKey) {
            loadedScreen.storage = {};
            document.body.removeEventListener("keydown", listener, false);
            _loadScreen(loadedScreen);
            clearTimeout(id);
        }
    }
}

/** @param {ExerciseScreen} loadedScreen */
function _loadScreen(loadedScreen) {
    document.querySelector(".card.explanation .btn.forward").addEventListener("click", historyStack.forward);
    /**
     * @param {PopStateEvent} e
     */
    window.onpopstate = (e) => {
        let screen = findScreen(location.hash);
        let reDo = (screen.element.hasInitialized !== screen.finished) && !screen.isInteractive;
        history.replaceState(null, screen.title, screen.urlHash || "/");
        changeScreen(screen, true);
        if (reDo) screen.finished = true;
    };

    history.replaceState(null, loadedScreen.name, loadedScreen.urlHash);
    if (loadedScreen.weight) findGroup(loadedScreen, loadedScreen.isInteractive, true);
    changeScreen(loadedScreen);
    updateProgress();

    let coolDownPeriod = timeToTransition(currentScreen.element) + 100;
    let coolDown = 0;
    document.body.addEventListener("keydown", e => {
        if (coolDown) return;
        switch (e.key) {
            case "ArrowRight":
            case "d":
                if (historyStack.back()) coolDown = setTimeout(() => coolDown = 0, coolDownPeriod);
                break;
            case "a":
            case "ArrowLeft":
                if (historyStack.forward()) coolDown = setTimeout(() => coolDown = 0, coolDownPeriod);
                break;
        }
    });
}