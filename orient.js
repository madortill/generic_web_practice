//@ts-check
function lockOrientation(orientationType) {
    if ('ontouchstart' in document) {
        let media = window.matchMedia(`(orientation: ${orientationType})`);
        if (MediaQueryList.prototype.addEventListener)
            media.addEventListener("change", orient, false);
        else
            media.addListener(orient);
        //@ts-ignore
        if (lockOrientation.removeListener) lockOrientation.removeListener();
        //@ts-ignore
        lockOrientation.removeListener = () => media.removeListener(orient);

        function orient(e) {
            rotation.angle = media.matches ? 0 : 90;
            if (!media.matches) {
                // kindof a simplified matrix
                rotation.sin = /* Math.sin(90° / 180 * Math.PI) */1;
                rotation.cos = /* Math.cos(90° / 180 * Math.PI) */0;
                rotation.yOffset = window.innerWidth;
                document.body.style.display = "block";
                void document.body.offsetWidth;
                document.body.style.display = "";
                document.body.style.transform = `translate(calc(-100% + 100vw)) rotateZ(90deg) translate(100%)`;
                document.body.style.transformOrigin = "top right";
                document.body.style.left = "0";
                document.body.style.position = "absolute";
                let clientHeight = document.documentElement.clientHeight;
                let clientWidth = document.documentElement.clientWidth;
                document.body.style.width = `${clientHeight}px`;
                document.body.style.height = `${clientWidth}px`;
                //@ts-ignore
                if (window.onportrait) Promise.resolve().then(onportrait);
                e.preventDefault();
            } else {
                // kindof a simplified matrix
                rotation.sin = /* Math.sin(0° / 180 * Math.PI) */0;
                rotation.cos = /* Math.cos(0° / 180 * Math.PI) */1;
                rotation.yOffset = 0;
                document.body.style.transform = "";
                document.body.style.transformOrigin = "";
                document.body.style.left = "";
                document.body.style.position = "";
                document.body.style.width = "";
                document.body.style.height = "";
                //@ts-ignore
                if (window.onlandscape) Promise.resolve().then(onlandscape);
                e.preventDefault();

            }
        }
        orient.call(media, new Event("orientationchange"));
    }
}

var rotation = {
    angle: 90, sin: 0, cos: 1, yOffset: 0,
    /**
     * @param {Partial<DOMRect>} point
     * @param {boolean} screenSpace
     * @param {boolean} abs
     */
    transform(point, screenSpace, abs) {
        let newPoint = new DOMRect();
        if (point.x !== undefined && point.y !== undefined) {
            newPoint.x = point.x * this.cos + point.y * this.sin;
            newPoint.y = point.y * this.cos - point.x * this.sin;
            if (screenSpace)
                newPoint.y = window.innerWidth * this.sin + (point.y * this.cos - point.x * this.sin);
            if (abs) {
                newPoint.x = Math.abs(newPoint.x);
                newPoint.y = Math.abs(newPoint.y);
            }
        }
        if (point.width !== undefined && point.height !== undefined) {
            newPoint.width = Math.abs(point.width * this.cos + point.height * this.sin);
            newPoint.height = Math.abs(point.height * this.cos - point.width * this.sin);
        }
        return newPoint;
    },
    /**
     * @param {Partial<DOMRect>} point
     */
    resize(rect) {
        return rect.resize(Math.abs(rect.width * this.cos + rect.height * this.sin), Math.abs(rect.height * this.cos - rect.width * this.sin));
    }
};

//@ts-check
function unlockOrientation() {
    //@ts-ignore
    if (lockOrientation.removeListener) {
        //@ts-ignore
        lockOrientation.removeListener();
        //@ts-ignore
        lockOrientation.removeListener = undefined;
        document.documentElement.style.transform = "";
        document.documentElement.style.transformOrigin = "";
        document.documentElement.style.left = "";
        document.documentElement.style.position = "";
        document.documentElement.style.width = "";
        document.documentElement.style.height = "";
    }
}