cardTypes.about = card();

cardTypes.opening = card({
    init(screen) {
        screen.querySelector(".opening-img").src = screen.charecterImg;
        screen.querySelector("#aboutBtn").addEventListener("click", () => historyStack.back(findScreen("#about")));
        screen.querySelector("#startBtn").addEventListener("click", historyStack.forward);
    }
});

cardTypes.notFound = card({
    init(screen) {
        screen.querySelector(".content-container").innerHTML = "Error card not found";
    }
});

cardTypes.ending = card({
    init(screen) {
        screen.querySelector(".ending-img").src = screen.charecterImg;
        screen.querySelector("#restartBtn").addEventListener("click", () => {
            for (let screen of screens) {
                screen.storage = {};
            }
            location.hash = "";
        }, false);
    }
});


/**
 * @param {ExerciseScreen} screen 
 */
cardTypes.subjectIntro = card();

cardTypes.table = card({
    init(screen) {
        /** @type {string[][]} */
        let content = screen.selected.contents;
        let table = screen.querySelector(".table");
        let max = content.map(arr => arr.length).reduce((len, curLen) => Math.max(len, curLen));
        for (let x = 0; x < max; x++) {
            table.append(El("div", { class: "col" }, ...content.map((arr, y) =>
                El("div", { classes: ["tableCell", x === 0 && "first-column", y === 0 && "top-row"] }, arr[x] || ""))
            ));
        }

    }
}, "contents");

cardTypes.contentOnly = card({
    init(screen) {
        multilineText(screen.selected.contents, currentScreen.querySelector(".content-section"));
    }
}, "contents");

cardTypes.contentWithSubtitle = cardTypes.contentOnly;

cardTypes.contentWithOneImage = card({
    init(screen) {
        let content = screen.selected.contents;
        let sections = screen.querySelectorAll(".content-section");
        multilineText(content.first, sections[0]);
        multilineText(content.second, sections[1]);
        let images = screen.selected.images;
        let imageEls = screen.querySelectorAll(".content-img");
        if (images instanceof Array) {
            imageEls[0].src = images[0];
            imageEls[1].src = images[1];
        } else
            imageEls[0].src = images;
    }
}, "contents", "images");

cardTypes.contentWithTwoImages = cardTypes.contentWithOneImage;

cardTypes.list = card({
    init(screen) {
        let content = screen.selected.contents;
        let list = screen.querySelector(".ordered-list");
        list.innerHTML = "";
        for (let i = 0; i < content.length; i++) {
            let container = document.createElement("div");
            container.classList.add("list-item");
            let numberEl = document.createElement("div");
            numberEl.classList.add("list-number");
            numberEl.innerText = `${i + 1}.`;
            container.appendChild(numberEl);
            let textEl = document.createElement("div");
            textEl.classList.add("list-text");
            textEl.innerText = content[i];
            container.appendChild(textEl);
            list.appendChild(container);
        }
    }
}, "contents");

cardTypes.form = card({ init: (screen) => currentScreen.querySelector(".form-container").style.backgroundImage = `url(${screen.selected.images})` }, "images");

cardTypes.americanQueations = card({
    init(screen, helper) {
        let question = screen.selected.questions;
        let container = screen.querySelector(".answers");
        container.innerHTML = "";
        let select;
        let finished = screen.finished;
        if (!finished) {
            let selected = screen.getStore("answer");
            select = function select() {
                if (screen.finished) return;
                let prev = screen.querySelector(".selected");
                if (prev) helper.removeCls(prev, "selected");
                screen.store("answer", this.index);
                selected = this;
                screen.invalidate();
            };
        }
        screen.hint(question.hint);
        for (let i = 0; i < question.answers.length; i++)
            container.append(El("div", {
                classes: ["answer", "btn"], listeners: { click: select }, fields: { index: i }
            }, multilineText(question.answers[i], El("p"))));
    },
    render(screen, helper) {
        let question = screen.selected.questions;
        let answers = screen.querySelectorAll(".answer");

        let index = screen.getStore("answer");
        if (Number.isInteger(index)) {
            helper.addCls(".check-btn", "ready");
            helper.addCls(answers[index], "selected");
        }
        if (screen.finished) {
            if (index !== undefined) {
                if (index + 1 === question.right)
                    helper.addCls(answers[index], "correct");
                else
                    helper.addCls(answers[index], "incorrect");
            }
            helper.addCls(answers[question.right - 1], "highlight-correct");
            screen.disable()
        }
        screen.explain(question.explanation)

    },
    isInteractive: true
}, "questions");

cardTypes.multichoiceQuestions = card({
    init(screen, helper) {
        let question = screen.selected.questions;
        let container = screen.querySelector(".answers");
        container.innerHTML = "";
        let select;
        let finished = screen.finished;
        if (!finished) {
            let selected = screen.getStore("answers") || [];
            select = function select() {
                if (screen.finished) return;
                let index = selected.indexOf(this.index);
                if (index !== -1)
                    selected.splice(index, 1);
                else
                    selected.push(this.index);
                screen.store("answers", selected);
                screen.invalidate();
            };
        }
        for (let i = 0; i < question.answers.length; i++)
            container.append(El("div", { class: "multichoice-item", listeners: { click: select }, fields: { index: i } },
                El("div", { classes: ["multichoice-check-area", "btn"] }),
                multilineText(question.answers[i], El("div", { class: "multichoice-text" }))
            ));
        screen.hint(question.hint)
    },
    render(screen, helper) {
        let question = screen.selected.questions;
        let answers = screen.querySelectorAll(".multichoice-item");

        let indexes = screen.getStore("answers");
        if (indexes) {
            helper.addCls(".check-btn", "ready");
            answers.forEach(answer => {
                let child = answer.querySelector(".multichoice-check-area");
                if (indexes.indexOf(answer.index) === -1) helper.removeCls(child, "selected");
                else helper.addCls(child, "selected");
            });
        }
        if (screen.finished) {
            for (let index of indexes) {
                let box = answers[index].querySelector(".multichoice-check-area");
                if (question.right.indexOf(index + 1) !== -1)
                    helper.addCls(box, "highlight-correct");
                else
                    helper.addCls(box, "incorrect");
            }
            for (let correctAnsw of question.right) {
                helper.addCls(answers[correctAnsw - 1].querySelector(".multichoice-check-area"), "highlight-correct");
                console.log(correctAnsw);
            }
            screen.disable()
        }
        screen.explain(question.explanation);
    }, isInteractive: true
}, "questions");

cardTypes.tfQuestions = card({
    init(screen, helper) {
        let answers = screen.getStore("answers") || {};
        let question = screen.selected.questions;
        let container = screen.querySelector(".questions");
        container.innerHTML = "";
        let keys = Object.keys(question);
        let finished = screen.finished;
        let unusedKeys = keys.map((_, i) => i);
        for (let i = 0; i < keys.length; i++) {
            let index = screen.randomOrder ? Math.floor(Math.random() * unusedKeys.length) : i;
            let id = unusedKeys[index];
            let text = keys[id];
            let textEl = El("div", { class: "tf-text" });
            multilineText(text, textEl);
            container.append(El("div", { class: "tf-item", fields: { index: id, right: question[text] } },
                textEl,
                El("div", {
                    classes: ["true-false-btn", "true", "btn"],
                    listeners: { click: !finished && select }
                }, El("p", {}, "נכון")),
                El("div", {
                    classes: ["true-false-btn", "false", "btn"],
                    listeners: { click: !finished && select }
                }, El("p", {}, "לא נכון"))
            ));
            unusedKeys.splice(index, 1);
        }
        /**
         * @this {HTMLElement}
         */
        function select() {
            if (screen.finished) return;
            answers[this.parentElement.index] = this.classList.contains("true");
            screen.store("answers", answers);
            screen.invalidate();
        }
        screen.hint(screen.selected.hints);
    },
    render(screen, helper) {
        let answers = screen.getStore("answers") || {};
        let finished = screen.finished;
        let items = screen.querySelectorAll(".tf-item");
        let filled = 0;
        for (let item of items) {
            let selected = answers[item.index];
            if (selected !== undefined) {
                filled++;
                helper.addCls(item.querySelector(selected ? ".true" : ".false"), "selected");
                helper.removeCls(item.querySelector(selected ? ".false" : ".true"), "selected");
            }
            if (finished)
                helper.addCls(item.querySelector(selected ? ".true" : ".false"), ...(selected === item.right ? ["correct", "highlight-correct"] : ["incorrect"]));
        }
        if (finished)
            screen.disable();
        screen.explain(screen.selected["explanations"]);
        if (filled === items.length)
            helper.addCls(".btn.check-btn", "ready");
        else
            helper.removeCls(".btn.check-btn", "ready");
    },
    isInteractive: true
}, "questions", "hints", "explanations");

cardTypes.fillinTheBlanks = card({
    place(item) {
        let anchorStyle = getComputedStyle(item.anchor);
        let diff = { x: parseFloat(anchorStyle.width) - parseFloat(item.style.width), y: parseFloat(anchorStyle.height) - parseFloat(item.style.height) };
        item.style.left = `${Math.floor(parseFloat(item.style.left) - diff.x / 2 - 1)}px`;
        item.style.top = `${Math.floor(parseFloat(item.style.top) - diff.y / 2 - 2)}px`;

        item.style.width = `${Math.ceil(parseFloat(anchorStyle.width) + 2)}px`;
        item.style.height = `${Math.ceil(parseFloat(anchorStyle.height) + 2)}px`;
    },
    init(screen, helper) {
        let sentence = screen.selected.sentences;
        let contentRoot = screen.querySelector(".content");
        contentRoot.innerHTML = "";
        let texts = sentence.text.split("__");
        let finished = screen.finished;
        let answers = screen.getStore("answers") || [];
        let blanks = [];
        for (let i = 0; i < texts.length; i++) {
            if (i) {
                let blank = document.createElement("div");
                blank.classList.add("target", "blank-space");
                blank.setAttribute("maxAnchored", 1);
                blank.index = i - 1;
                contentRoot.append(blank);
                blanks.push(blank);
            }
            let txt = document.createElement("div");
            txt.classList.add("fill-in-the-blanks-txt");
            txt.innerText = texts[i];
            contentRoot.append(txt);
        }
        let droppableContainer = screen.querySelector(".droppable-container");
        droppableContainer.innerHTML = "";
        let vocabularyList = sentence.vocabulary.map((_, i) => i);
        for (let i = 0; i < sentence.vocabulary.length; i++) {
            let index = screen.randomOrder ? Math.floor(Math.random() * vocabularyList.length) : i;
            let id = vocabularyList[index];
            let place = this.place;
            let item = El("div", {
                classes: ["btn", "droppable"], attributes: {
                    removeondrag: "", removeonplace: "", anchored: "", centered: "", failanimation: "",
                }, fields: {
                    index: id, anchor: blanks[answers[id]]
                }
            }, sentence.vocabulary[id]);
            droppableContainer.append(item);
            vocabularyList.splice(index, 1);
            if (!finished) {
                draggable(item, {
                    drop() {
                        if (this.anchor) {
                            place(this);
                            answers[this.index] = this.anchor.index;
                        } else
                            delete answers[this.index];
                        screen.store("answers", answers);
                        screen.invalidate();
                    }
                });
            }
        }
        helper.addListener(window, "resize", () => {
            let finished = screen.finished;
            for (let child of droppableContainer.children)
                if (child.anchor) {
                    Drag.emulateDrag(child, child.anchor, 0, [0], finished, !finished);
                    this.place(child);
                    Drag.snapToAnchor(child, timeToTransition(child) / 30);
                }
        });
        screen.hint(sentence.hint)
    },
    render(screen, helper) {
        let finished = screen.finished;
        let blankSpaces = screen.querySelectorAll(".blank-space")
        let vocabularyItems = screen.querySelectorAll(".btn.droppable");
        let sentence = screen.selected["sentences"];
        let filled = 0;
        if (finished)
            screen.disable();
        screen.explain(sentence.explanation);
        for (let i = 0; i < vocabularyItems.length; i++) {
            if (vocabularyItems[i].anchor) {
                if (finished) {
                    Drag.snapToAnchor(vocabularyItems[i], timeToTransition(vocabularyItems[i]) / 30);
                    if (vocabularyItems[i].index === vocabularyItems[i].anchor.index)
                        helper.addCls(vocabularyItems[i], "correct");
                    else
                        helper.addCls(vocabularyItems[i], "incorrect");
                    vocabularyItems[i].locked = true;
                }
                filled++;
                if (!vocabularyItems[i].anchor.anchored) {
                    Drag.emulateDrag(vocabularyItems[i], vocabularyItems[i].anchor, 0, [1], finished, !finished);
                    this.place(vocabularyItems[i]);
                }
            }
        }
        if (filled === blankSpaces.length)
            helper.addCls(".btn.check-btn", "ready");
        else
            helper.removeCls(".btn.check-btn", "ready");

    }, isInteractive: true
}, "sentences");

cardTypes.arrangeByOrder = card({
    init(screen, helper) {
        /**@type {Array<{text: string, index: number>}} */
        let answers = screen.getStore("answers");
        let sentences = screen.selected.sentences;
        let container = screen.querySelector(".ordering-list");
        container.innerHTML = "";

        if (!answers) {
            answers = sentences.map((sentence, index) => ({ text: sentence, index }));
            for (let i = answers.length - 1; i > 0; i--) {
                let rndIndex = Math.floor(Math.random() * (i + 1));
                let tmp = answers[i];
                answers[i] = answers[rndIndex];
                answers[rndIndex] = tmp;
            }
            screen.store("answers", answers);
        }
        let sentenceEls = [];
        for (let i = 0; i < answers.length; i++) {
            let sentence = answers[i];
            let content = El("div", { class: "ordering-text" }, sentence.text);
            container.append(El("div", { class: "ordering-line" },
                El("div", { class: "number-in-order" }, i + 1),
                El("div", { classes: ["ordering-item", "target"], fields: { index: sentence.index } },
                    El("img", { class: "six-dots", attributes: { src: "assets/images/sixDots.svg" } }),
                    content
                )
            ));
            sentenceEls.push(content);
            sortable(content, container, {
                swap(to) {
                    let numbers = answers.map(({ index }) => index);
                    let myIndex = numbers.indexOf(this.parentElement.index);
                    let oIndex = numbers.indexOf(to.parentElement.index);
                    let tmp = answers[myIndex];
                    answers[myIndex] = answers[oIndex];
                    answers[oIndex] = tmp;
                    let tmpIndex = this.parentElement.index;
                    this.parentElement.index = to.parentElement.index;
                    to.parentElement.index = tmpIndex;
                    screen.store("answers", answers);
                }
            });
        }
        screen.hint(screen.selected["hints"])
    },
    render(screen, helper) {
        helper.addCls(".btn.check-btn", "ready");
        if (screen.finished) {
            let answers = screen.getStore("answers");
            let sentences = screen.querySelectorAll(".ordering-text");
            for (let i = 0; i < answers.length; i++) {
                sentences[i].locked = true;
                if (answers[i].index === i) {
                    helper.addCls(sentences[i], "highlight-correct");
                } else {
                    helper.addCls(sentences[i], "incorrect");
                }
            }
        }
        screen.explain(screen.selected.explanations)
    },
    isInteractive: true
}, "sentences", "hints", "explanations");

cardTypes.matchMaker = card({
    transitionDuration: 1,
    /**
     * @this {HTMLElement}
     * @param {number} angle 
     * @param {number} length 
     */
    drawBand(angle, length) {
        this.style.height = `${length.toFixed(2)}px`;
        this.style.transform = this.style.transform.replace(/rotate ?\([ \-0-9.]*deg\)|$/, `rotate(${angle - 90}deg)`);
    },
    /**
     * 
     * @param {ExerciseScreen} screen 
     * @param {ScreenHelper} helper 
     * @param {{matchedIndex: number, looseBand: HTMLElement}} state
     * @param {{right: {text: string, index: number, hasMatch: boolean}[], left: {text: string, index: number, hasMatch: boolean}[]}} answers
     * @param {HTMLElement} rightPart
     * @param {HTMLElement leftPart
     */
    placeStoredBands(screen, helper, state, answers, rightPart, leftPart) {
        let rightConns = answers.right.map(({ hasMatch }, index) => hasMatch && index).filter(i => i !== undefined);
        let leftConns = answers.left.map(({ hasMatch }, index) => hasMatch && index).filter(i => i !== undefined);
        rightConns.filter(i => {
            let index = leftConns.indexOf(i);
            if (index !== -1) leftConns.splice(index, 1);
            return index === -1;
        }).forEach(i =>
            console.warn(`bad match in store, index: ${i}, texts: "${answers.left[i].text}", "${answers.right[i].text}"`)
        );
        leftConns.forEach(i =>
            console.warn(`bad match in store, index: ${i}, texts: "${answers.left[i].text}", "${answers.right[i].text}"`)
        );
        let connections = leftConns.concat(...rightConns);

        for (let connection of connections) {
            let band = state.looseBand || El("div", { classes: ["band", "loose", "disable"] });
            helper.removeCls(band, "disable");
            let ogBounds = band.getBoundingClientRect();
            band.firstAnchor = rightPart.children[connection];
            band.firstAnchor.anchored = band;
            band.secondAnchor = leftPart.children[connection];
            band.secondAnchor.anchored = band;
            let offsetBounds = rotation.transform({ x: ogBounds.width / 2, y: 0 }, false, true);
            Drag.positionEl(band, ogBounds.move(offsetBounds.x, offsetBounds.y), band.firstAnchor, { left: 0, top: 0.5 });
            ogBounds = band.getBoundingClientRect();
            let offsets = { x: 1, y: .5 };
            offsets = rotation.transform(offsets, false, true);
            let targetBounds = band.secondAnchor.getBoundingClientRect();
            let x = targetBounds.x + offsets.x * targetBounds.width;
            let y = targetBounds.y + offsets.y * targetBounds.height;
            let { angle, length } = Drag.lineTo(x, y, band, ogBounds);
            this.drawBand.call(band, angle, length);
            helper.addCls(band, "white");
            state.matchedIndex++;
            if (state.matchedIndex !== screen.selected.questions.length - 1) {
                helper.removeCls(state.looseBand, "loose");
                state.looseBand = screen.querySelector(".band.loose") || El("div", { classes: ["band", "loose", "disable"] });
                screen.querySelector(".content").append(state.looseBand);
            }
            band.dismiss = (next, prev) => {
                let firstContainer = band.firstAnchor.parentElement;

                let index = Array.from(firstContainer.children).indexOf(band.firstAnchor);
                this.dismissBand(true, false, band, screen, helper, state, index);
            }
        }
    },
    /**
     * @param {boolean} reuse 
     * @param {boolean} reorder
     * @param {HTMLElement} band
     * @param {ExerciseScreen} screen 
     * @param {ScreenHelper} helper
     * @param {number} transitionDuration
     * @param {{matchedIndex: number, looseBand: HTMLElement}} state
     * @param {number} index
     */
    dismissBand(reuse, reorder, band, screen, helper, state, index) {
        if (reuse) {
            let answers = screen.getStore("answers");
            answers.left[index].hasMatch = answers.right[index].hasMatch = undefined;
            if (reorder) {
                console.log("reorder");
                this.reOrderItems(screen,
                    { left: 1, top: 0.5 }, state, null, answers, screen.querySelector(".match-area.right"),
                    screen.querySelector(".match-area.left"), index, index, state.matchedIndex);
            }
            screen.store("answers", answers);
            state.matchedIndex--;
        }
        screen.coolDown("match-maker", this.transitionDuration * 1000);
        band.style.transition = `${this.transitionDuration}s linear`;
        band.style.transitionProperty = "transform, height";
        if (band.firstAnchor && band.firstAnchor.anchored === band) band.firstAnchor.anchored = undefined;
        if (band.secondAnchor && band.secondAnchor.anchored === band) band.secondAnchor.anchored = undefined;
        band.firstAnchor = undefined;
        band.secondAnchor = undefined;
        screen.invalidate();
        void band.clientWidth;
        band.style.height = "0";
        setTimeout(() => {
            band.removeAttribute("style");
            helper.addCls(band, "loose", "disable");
        }, this.transitionDuration * 900);
    },
    /**
     * 
     * @param {ExerciseScreen} screen 
     * @param {{left: number, top: number}} pos 
     * @param {HTMLElement & {anchored?: HTMLElement}} state 
     * @param {DOMRect} ogBounds
     * @param {{left: {hasMatch: boolean}[], right: {hasMatch: boolean}[]}} answers 
     * @param {HTMLElement} firstContainer 
     * @param {HTMLElement} secondContainer 
     * @param {number} firstItemIndex 
     * @param {number} secondItemIndex 
     * @param {number} endIndex 
     */
    reOrderItems(screen, pos, state, ogBounds, answers, firstContainer, secondContainer, firstItemIndex, secondItemIndex, endIndex) {
        if (endIndex && firstItemIndex === firstContainer.length) return;
        let currentAngle;
        let firstPart = Array.from(firstContainer.children);
        let secondPart = Array.from(secondContainer.children);
        let anchor = firstPart[firstItemIndex];
        let target = secondPart[secondItemIndex];
        let screenType = this;
        let isRight = !pos.left;

        let indexes = [firstItemIndex, secondItemIndex];
        let rightIndex = isRight ? indexes[0] : indexes[1];
        let leftIndex = isRight ? indexes[1] : indexes[0];
        let hasMatch = !endIndex;

        function redraw(target) {
            let offsets = { x: isRight ? 1 : 0, y: .5 };
            offsets = rotation.transform(offsets, false, true);
            let targetBounds = target instanceof DOMRect && target || target.getBoundingClientRect();
            let x = targetBounds.x + offsets.x * targetBounds.width;
            let y = targetBounds.y + offsets.y * targetBounds.height;
            let { angle, length } = Drag.lineTo(x, y, state.looseBand, state.looseBand.ogPos);
            angle = alignAngle(currentAngle, angle, 180);
            screenType.drawBand.call(state.looseBand, angle, length);
            currentAngle = angle;
        }
        if (target.anchored && hasMatch) redraw(target);

        let [min, max] = minMax(...indexes);
        min = Math.min(min, state.matchedIndex);
        max = Math.max(max, endIndex || 0);
        answers.right[rightIndex].hasMatch = answers.left[leftIndex].hasMatch = hasMatch || undefined;

        let len = max - min;
        if (len) screen.coolDown("match-maker", 1100);
        state.looseBand.style.transition = `${this.transitionDuration}s ease-in-out`;
        state.looseBand.style.transitionProperty = "transform, height";
        void state.looseBand.clientWidth;
        firstPart = firstPart.slice(min, endIndex ? max : Math.min(max, indexes[0]));
        secondPart = secondPart.slice(min, endIndex ? max : Math.min(max, indexes[1]));
        let actualSwaps = 0;
        for (let i = 0; i < len; i++) {
            let index = endIndex ? i : len - 1 - i;
            let first = firstPart[index];
            let second = secondPart[index];
            if ((first && (bool(first.anchored) === hasMatch)) || (second && (bool(second.anchored) === hasMatch))) continue;
            if (isRight ? first : second) {
                arrSwap(answers.right, rightIndex, min + index);
                rightIndex = min + index;
            }
            if (isRight ? second : first) {
                arrSwap(answers.left, leftIndex, min + index);
                leftIndex = min + index;
            }
            setTimeout(() => {
                let ogSecondBounds = second && second.getBoundingClientRect() || target.getBoundingClientRect();
                let anchorBounds = anchor.getBoundingClientRect();
                let shouldRedraw = false;
                if (first) {
                    if (hasMatch) Drag.positionEl(anchor.anchored, ogBounds, first, pos);
                    Drag.swap({ el: anchor, transitionDuration: this.transitionDuration }, { el: first });
                    if (hasMatch) {
                        let firstBounds = first.getBoundingClientRect();
                        let movementPoint = { x: firstBounds.x - anchorBounds.x, y: firstBounds.y - anchorBounds.y };
                        ogBounds = ogBounds.move(movementPoint.x, movementPoint.y);
                        let dir = pos.left ? 1 : -1;
                        let offsetBounds = { x: ogBounds.width / 2, y: 0 };
                        if (window.rotation) offsetBounds = rotation.transform(offsetBounds);
                        state.looseBand.ogPos = ogBounds.move(offsetBounds.x * dir, offsetBounds.y * -dir);
                        shouldRedraw = true;
                    }
                }
                if (second) {
                    Drag.swap({ el: target, transitionDuration: this.transitionDuration }, { el: second });
                    shouldRedraw = hasMatch && !shouldRedraw;
                }
                if (!hasMatch && first) {
                    /**
                     * @type {DOMRect}
                     */
                    let ogBounds = first.anchored.getBoundingClientRect();
                    ogBounds = rotation.resize(ogBounds);
                    let offsetBounds = { x: ogBounds.width - ogBounds.height / 2, y: 0 };
                    offsetBounds = rotation.transform(offsetBounds, false, true);
                    ogBounds = ogBounds.move(offsetBounds.x, offsetBounds.y).resize(ogBounds.height, ogBounds.height);

                    first.anchored.style.transition = `transform ${this.transitionDuration}s ease-in-out`;
                    void first.anchored.clientWidth;
                    Drag.positionEl(first.anchored, ogBounds, firstContainer.children[min + index - 1], { left: isRight ? 1 : 0, top: pos.top });
                    setTimeout(() => {
                        void first.anchored.clientWidth;
                        first.anchored.style.transition = "";
                    }, this.transitionDuration * 1000);
                }
                if (shouldRedraw) redraw(ogSecondBounds);
            }, actualSwaps * this.transitionDuration * 1100);
            actualSwaps++;
        }
        if (len) screen.coolDown("match-maker", this.transitionDuration * 1100 * actualSwaps);
        return actualSwaps;
    },
    /**
     * 
     * @param {ExerciseScreen} screen 
     * @param {ScreenHelper} helper 
     * @param {{left: number, top: number}} pos 
     * @param {HTMLElement & {anchored?: HTMLElement}} anchor 
     * @param {{matchedIndex: number, looseBand: HTMLElement}} state 
     */
    onItemClicked(screen, helper, pos, anchor, state) {
        if (screen.coolDown("match-maker")) return;
        let reuseBand = anchor.anchored;
        if (reuseBand)
            state.looseBand = reuseBand;
        let ogBounds = state.looseBand.getBoundingClientRect();
        let ogPos;
        helper.removeCls(state.looseBand, "disable");
        let oldTarget;
        if (reuseBand) {
            ogBounds = rotation.resize(ogBounds);
            if (reuseBand.secondAnchor !== anchor) {
                let translatePttr = /translate *\( *(\-?[ 0-9]*.?[0-9]*) *px, *(\-?[ 0-9]*.?[0-9]*) *px *\)/;
                let [_, x, y] = reuseBand.style.transform.match(translatePttr);
                reuseBand.style.transform = reuseBand.style.transform.replace(translatePttr, `translate(${x - (ogBounds.width - ogBounds.height) * (pos.left ? -1 : 1)}px, ${y}px)`);
                let anglePttr = /rotate *\( *(-?[ 0-9]*.?[0-9]*) *deg *\)/;
                let curAngle = Number(reuseBand.style.transform.match(anglePttr)[1]);
                reuseBand.style.transform = reuseBand.style.transform.replace(anglePttr, `rotate(${(curAngle + 180) % 360}deg)`);
                reuseBand.firstAnchor.anchored = undefined;
                anchor = reuseBand.secondAnchor;
                oldTarget = reuseBand.secondAnchor;
            } else {
                reuseBand.secondAnchor.anchored = undefined;
                oldTarget = reuseBand.firstAnchor;
                anchor = reuseBand.firstAnchor;
            }
            reuseBand.secondAnchor = undefined;
            let offset = rotation.transform({ x: (ogBounds.width - ogBounds.height) * pos.left, y: 0 });
            ogPos = ogBounds.move(offset.x, -offset.y);
            ogBounds = state.looseBand.getBoundingClientRect().move(((pos.left && ogBounds.width) || 0) - ogBounds.height / 2).resize(ogBounds.height, ogBounds.height);
            pos = { left: pos.left ? 0 : 1, top: pos.top };
        } else {
            let moveBox = new DOMRect(0, 0, ogBounds.width / 2);
            let dir = pos.left ? -1 : 1;
            if (window.rotation) moveBox = rotation.transform(moveBox);
            Drag.positionEl(state.looseBand, ogBounds.move(moveBox.width * dir, moveBox.height * dir), anchor, pos);
            moveBox = new DOMRect(0, 0, 0, ogBounds.height / 2);
            if (window.rotation) moveBox = rotation.resize(moveBox);
            ogBounds = state.looseBand.getBoundingClientRect().move(moveBox.height * dir, moveBox.width * dir);
        }
        helper.removeCls(state.looseBand, "white");
        var screenType = this;
        let transitionDuration = this.transitionDuration;
        let dismiss = this.dismissBand;
        anchoredDraggable(anchor, state.looseBand, {
            ogPos,
            drag: screenType.drawBand,
            validate(prev) {
                if (this.firstAnchor.parentElement === this.secondAnchor.parentElement) {
                    console.log(prev, oldTarget,)
                    this.dismiss(!oldTarget, oldTarget);
                    Drag.destroy(this);
                    return false;
                }
                return true;
            },
            drop(_prev, target, prevAnchored) {
                let answers = screen.getStore("answers");
                if (target && target.classList.contains("target") && target !== this.firstAnchor && target.parentElement !== this.firstAnchor.parentElement) {
                    console.log("SDA");
                    let anchorParent = Array.from(this.firstAnchor.parentElement.children);
                    let targetParent = Array.from(target.parentElement.children);
                    if (reuseBand) {
                        let arr = pos.left ? answers.right : answers.left;
                        arr[Array.from(oldTarget.parentElement.children).indexOf(oldTarget)].hasMatch = undefined;
                    }
                    let actualSwaps = screenType.reOrderItems(screen, pos, state, ogBounds, answers,
                        this.firstAnchor.parentElement, target.parentElement,
                        anchorParent.indexOf(anchor), targetParent.indexOf(target)
                    );
                    if (prevAnchored) {
                        let index = targetParent.indexOf(target);
                        if (oldTarget && state.matchedIndex > index && index === anchorParent.indexOf(anchor) - 1) {
                            setTimeout(() => {
                                actualSwaps += screenType.reOrderItems(screen, { left: 1, top: .5 }, state, null, answers, this.firstAnchor.parentElement, target.parentElement, index + 1, index + 1, state.matchedIndex);
                            }, actualSwaps * transitionDuration * 1050);
                        }
                    }
                    setTimeout(() => helper.addCls(this, "white"), actualSwaps * transitionDuration * 1100);
                    screen.store("answers", answers);
                    state.matchedIndex++;
                    if (state.matchedIndex !== answers.length - 1) {
                        setTimeout(() => {
                            state.looseBand.style.transition = "";
                            helper.removeCls(state.looseBand, "loose");
                            state.looseBand = screen.querySelector(".band.loose") || El("div", { classes: ["band", "loose", "disable"] });
                            screen.querySelector(".content").append(state.looseBand);
                            screen.invalidate();
                        }, transitionDuration * 1100 * actualSwaps);
                    }
                }
                else this.dismiss(false, oldTarget);
                Drag.destroy(this);
            }, dismiss(next, prev) {
                console.log(next, prev);
                dismiss.call(screenType, (prev || this.secondAnchor).classList.contains("target"),
                    !next, this, screen, helper, state,
                    Array.from(this.firstAnchor.parentElement.children).indexOf(this.firstAnchor)
                );
            }
        });
    },
    init(screen, helper) {
        let question = screen.selected.questions;
        let answers = screen.getStore("answers");
        let finished = screen.finished;
        screen.querySelectorAll(".band").forEach(e => e.style.cssText = "");
        if (!answers) {
            answers = {};
            answers.right = question.rightPart.map((sentence, index) => ({ text: sentence, index }));
            answers.left = question.leftPart.map((sentence, index) => ({ text: sentence, index }));
            shuffle(answers.right);
            shuffle(answers.left);
            screen.store("answers", answers);
        }
        let state = { looseBand: screen.querySelector(".loose.band"), matchedIndex: 0 };
        let rightPart = screen.querySelector(".match-area.right");
        let leftPart = screen.querySelector(".match-area.left");
        rightPart.innerHTML = "";
        leftPart.innerHTML = "";

        let matchItem = (parent, itemData, pos) => {
            if (itemData) {
                let item = El("div", {
                    classes: ["match-item", "btn", "target"], listeners: {
                        pointerdown: !finished && (e => this.onItemClicked(screen, helper, pos, e.currentTarget, state))
                    }, fields: {
                        index: itemData.index
                    }
                });
                parent.append(multilineText(itemData.text, item));
            }
        };
        for (let i = 0; i < Math.max(answers.right.length, answers.left.length); i++) {
            matchItem(leftPart, answers.left[i], { left: 1, top: 0.5 });
            matchItem(rightPart, answers.right[i], { left: 0, top: 0.5 });
        }
        this.placeStoredBands(screen, helper, state, answers, rightPart, leftPart);
        helper.addListener(window, "resize", () => {
            for (let band of screen.querySelectorAll(".band")) {
                if (band.style.insets) return;
                band.style.cssText = "";
                helper.addCls(band, "loose");
            }
            state.looseBand = screen.querySelector(".band");
            this.placeStoredBands(screen, helper, state, screen.getStore("answers"), rightPart, leftPart);
            state.looseBand = screen.querySelector(".band.loose");
        });
        screen.hint(screen.selected.hints);
    },
    render(screen, helper) {
        /**
         * @type {{right: {text: string, hasMatch: boolean, index: number}[], left: {text: string, hasMatch: boolean, index: number}[] }}
         */
        let answers = screen.getStore("answers");
        if (screen.finished || answers.right.every(({ hasMatch }) => hasMatch))
            helper.addCls(".btn.check-btn", "ready");
        else
            helper.removeCls(".btn.check-btn", "ready");
        if (screen.finished) {
            let rightPart = screen.querySelector(".match-area.right");
            for (let i = 0; i < Math.max(answers.right.length, answers.left.length); i++) {
                let right = answers.right[i];
                let left = answers.left[i];
                helper.removeCls(rightPart.children[i].anchored, "disable");
                helper.addCls(rightPart.children[i].anchored, right.index === left.index ? "correct" : "incorrect");
            }
            screen.disable();
        }
        screen.explain(screen.selected.explanations);
    }, isInteractive: true
}, "questions", "hints", "explanations");

cardTypes.recognizePictures = card({
    /**
     * 
     * @param {HTMLImageElement} img 
     * @param {ExerciseScreen} screen
     * @param {ScreenHelper} helper
     */
    openImg(img, screen, helper) {
        let target = img.parentElement;
        let container = target.parentElement.parentElement;
        let input = /** @type {HTMLInputElement} */ (target.querySelector(".input-answer"));
        input.tabIndex = 1;
        input.focus();
        let lines = container.children;
        let previous = container.querySelector(".picture-container.active");
        if (previous)
            this.closeImg(previous.querySelector("img"), screen, helper);
        let index = Array.from(target.parentElement.children).indexOf(target);
        let line = Array.from(target.parentElement.parentElement.children).indexOf(target.parentElement);
        helper.addCls(target, "active");
        let rat = img.naturalWidth / img.naturalHeight;
        helper.css(img, { width: `${img.height / window.innerWidth * 100 * rat}vw` });
        helper.addCls(lines[(line + 1) % 2].children[index], "complementary");
        let answers = screen.getStore("answers") || {};
        answers.opened = img.src;
        screen.store("answers", answers);
    },
    /** 
     * @param {HTMLImageElement} img
     * @param {ExerciseScreen} screen
     * @param {ScreenHelper} helper
     */
    closeImg(img, screen, helper) {
        let target = img.parentElement;
        let input = /** @type {HTMLInputElement} */ (target.querySelector(".input-answer"));
        input.tabIndex = -1;
        input.blur();
        helper.removeCls(img.parentElement, "active");

        helper.css(img, { width: "" });
        helper.removeCls(".picture-container.complementary", "complementary");
        let answers = screen.getStore("answers") || {};
        answers.opened = undefined;
        screen.store("answers", answers);
    },
    init(screen, helper) {
        let finished = screen.finished;
        /** @type {{src: string, answer: string}[]}} */
        let questions = screen.selected.questions;
        /** @type {{opened: string, answers: []}} */
        let answers = screen.getStore("answers");
        if (!answers)
            answers = { answers: [] };
        else if (!answers.answers) answers.answers = [];

        let container = screen.querySelector(".recognize-picture-container");
        let lines = container.querySelectorAll(".recognize-picture-container>div");
        lines.forEach(e => e.innerText = "");

        container.addEventListener("click", () => {
            let cur = container.querySelector(".picture-container.active>img");
            if (cur) this.closeImg(cur, screen, helper);
        });

        helper.addListener(document.body, "keydown", ev => {
            if (ev.key === "Escape") {
                let cur = container.querySelector(".picture-container.active>img");
                if (cur) this.closeImg(cur, screen, helper);
            }
        });

        questions.forEach((question, i) =>
            lines[Math.floor(i / 4)].append(El(
                "div", {
                class: "picture-container", listeners: {
                    click(e) { if (this.classList.contains("active")) e.stopPropagation(); }
                }
            },
                El("img", {
                    class: "recognize-picture", attributes: { src: question.img }, listeners: {
                        click: e => {
                            if (!e.target.parentElement.classList.contains("active")) this.openImg(e.target, screen, helper);
                        }
                    }
                }),
                El("input", {
                    class: "input-answer", attributes: { type: "text", size: "1", placeholder: "כיתבו תשובה", tabindex: -1 }, listeners: {
                        keydown: !finished && (e => {
                            if (e.key === "Escape") {
                                let cur = container.querySelector(".picture-container.active>img");
                                if (cur) this.closeImg(cur, screen, helper);
                            }
                            if (!e.altKey) e.stopPropagation();
                            let el = /** @type {HTMLInputElement} */(e.target);
                            let prevValue = el.value;
                            setTimeout(() => {
                                if (bool(prevValue) !== bool(el.value)) screen.invalidate();
                            }, 100);
                            screen.coolDown(`idlewrite-${i}`, 500, () => {
                                answers.answers[i] = el.value;
                                screen.store("answers", answers);
                            });
                        }),
                        input: !finished && ((e) => {
                            if (e.inputType === "historyundo" || e.inputType === "historyredo")
                                screen.invalidate();
                        })
                    }, fields: { value: answers.answers[i] || "" }
                })
            ))
        );
        screen.hint(screen.selected.hints);
    },
    render(screen, helper) {
        /** @type {{opened: string, answers: {}}} */
        let answers = screen.getStore("answers");
        let container = screen.querySelector(".recognize-picture-container");
        if (answers && answers.opened && !screen.querySelector(".active>img")) {
            setTimeout(() =>
                this.openImg(Array.from(container.querySelectorAll("img")).find(img => img.src === answers.opened), screen, helper), 500);
        }

        if (screen.finished || Array.from(screen.querySelectorAll(".input-answer")).every(e => e.value))
            helper.addCls(".btn.check-btn", "ready");
        else
            helper.removeCls(".btn.check-btn", "ready");
        if (screen.finished) {
            Array.from(screen.querySelectorAll(".input-answer")).forEach((img, i) => {
                let parent = img.parentElement;
                let input = parent.querySelector("input");
                let correct = screen.selected.questions[i].answer === input.value;
                if (!correct && !parent.querySelector(".correct-answer"))
                    img.parentElement.append(El("input", { class: "correct-answer", attributes: { disabled: true, type: "text", size: "1", placeholder: "כיתבו תשובה", tabindex: -1 }, fields: { value: screen.selected.questions[i].answer } }));

                helper.addCls(img.parentElement, "disabled", correct ? "correct" : "wrong");
                img.setAttribute("disabled", true);
            });
            screen.element.classList.add("disable");
        }
        screen.explain(screen.selected.explanations);
    }, isInteractive: true
}, "questions", "hints", "explanations");

cardTypes.microwave = card({
    init(screen, helper) {
        /**
         * @type {{correct: number[], texts: string[], descriptions: string[]}}
         */
        let question = screen.selected.questions;
        /**
         * @type {number[]}
         */
        let answers = screen.getStore("answers") || [];
        let subtitle = screen.querySelector(".subtitle");
        subtitle.innerHTML = "";
        multilineText(question.texts[screen.getStore("index") || 0], subtitle);
        screen.querySelector(".next>img").addEventListener("click", this.nav.bind(this, false, screen));
        screen.querySelector(".back>img").addEventListener("click", this.nav.bind(this, true, screen));
        Array.from(screen.querySelectorAll(".microwave-options>.btn")).forEach((option, i) => {
            option.addEventListener("click", e => {
                if (!screen.finished) {
                    let index = screen.getStore("index") || 0;
                    let prevIndex = answers.indexOf(i + 1);
                    if (prevIndex !== -1) answers[prevIndex] = undefined;
                    let prev = screen.querySelector(`.microwave-options>.btn@${answers[index] - 1}`);
                    if (prev) helper.removeCls(prev, "selected", "active");
                    let oldLength = answers.length;
                    answers[index] = i + 1;
                    screen.store("answers", answers);
                    if (oldLength >= index + 1 || !this.nav(false, screen))
                        screen.invalidate();
                }
            }, false);
            if (question.correct.length <= i) helper.addCls(option, "disabled");
            if (option.previousElementSibling && option.previousElementSibling.classList.contains("text"))
                option.previousElementSibling.textContent = question.descriptions[i];
            else
                option.before(El("div", { class: "text" }, question.descriptions[i]));
        });
        screen.hint(screen.selected.hints);
    },
    render(screen, helper) {
        let finished = screen.finished;
        /** @type {number[]} */
        let answers = screen.getStore("answers") || [];
        /** @type {{correct: number[], texts: string[], descriptions: string[]}} */
        let question = screen.selected.questions;
        let index = screen.getStore("index") || 0;
        let options = screen.querySelectorAll(".microwave-options>.btn");
        if (answers.length === question.correct.length && !answers.some(ans => !Number.isInteger(ans)))
            helper.addCls(".check-btn", "ready");
        else
            helper.removeCls(".check-btn", "ready");
        if (finished) {
            answers.forEach((ans, i) => {
                helper.removeCls(options[ans - 1], "selected", "active");
                if (ans === question.correct[i])
                    helper.addCls(options[ans - 1], "highlight-correct");
                else
                    helper.addCls(options[ans - 1], "incorrect");
            });
            screen.disable();
        } else {
            answers.forEach((ans, i) => {
                if (!ans) return;
                helper.addCls(options[ans - 1], "selected");
                helper.forceToggle(options[ans - 1], "active", i === index);
            });
        }
        screen.explain(screen.selected.explanations);
    },
    /**
     * 
     * @param {boolean} back 
     * @param {ExerciseScreen} screen
     */
    nav(back, screen) {
        let index = screen.getStore("index") || 0;
        /** @type {{correct: number[], texts: string[], descriptions: string[]}} */
        let question = screen.selected.questions;
        let subtitle = screen.querySelector(".subtitle");
        if (back) {
            if (index < 1) return false;
            index--;
            subtitle.style.transform = "translate(-200%)";
        } else {
            if (index >= question.correct.length - 1) return false;
            index++;
            subtitle.style.transform = "translate(200%)";
        }
        subtitle.append(multilineText(question.texts[index], El("div", { class: back ? "prev-text" : "next-text" })));
        screen.store("index", index);
        setTimeout(() => {
            subtitle.innerHTML = "";
            multilineText(question.texts[index], subtitle);
            subtitle.style.transition = "unset";
            subtitle.style.transform = "";
            void subtitle.clientWidth;
            subtitle.style.transition = "";
        }, timeToTransition(subtitle) + 10);
        screen.invalidate();
        return true;
    },
    isInteractive: true
}, "questions", "hints", "explanations");

