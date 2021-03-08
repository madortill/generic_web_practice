declare var progressBar: HTMLElement;
declare var progressBarContainer: HTMLElement;
declare var main: HTMLElement;
type ElementTypeMap = HTMLElementTagNameMap & SVGElementTagNameMap;

function El<K extends keyof ElementTypeMap, T = {}>(tagName: K, options: {
    classes?: string[], class?: string,
    id?: string,
    listeners: {
        [M in keyof (HTMLElementEventMap & SVGSVGElementEventMap)]?: (this: HTMLElement, e: (HTMLElementEventMap & SVGSVGElementEventMap)[M]) => void;
    },
    attributes: { [index: string]: string | { toString(): string } },
    fields: T
}, ...children: string[]): ElementTypeMap[K] & T;

function El<T = {}>(tagName: string, options: {
    classes?: string[], class?: string,
    id?: string,
    listeners: {
        [M in keyof (HTMLElementEventMap & SVGSVGElementEventMap)]?: (this: HTMLElement, e: (HTMLElementEventMap & SVGSVGElementEventMap)[M]) => void;
    },
    attributes: { [index: string]: string | { toString(): string } },
    fields: T
}, ...children: string[]): HTMLElement & T;

interface DOMRect {
    intersection({ left, top, right, bottom }: { left: number, top: number, right: number, bottom: number }): number;
    intersects({ left, top, right, bottom }: { left: number, top: number, right: number, bottom: number }): void;
    contains({ x, y }: { x: number, y: number }): void;
    resize(width: number, height: number): DOMRect;
    move(x: number, y: number): DOMRect;
}
