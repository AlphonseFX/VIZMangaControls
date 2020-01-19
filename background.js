// ==UserScript==
// @name         Hotkeys for VIZMedia Manga
// @version      0.0.3
// @description  Adds basic media controls to VIZ manga reader
// @author       Adakenko
// @match        https://www.viz.com/shonenjump/*
// @grant        none
// ==/UserScript==

// Mostly wrote this for funsies,
// not exactly clean or well written
// Be kind please :D

(function () {
    'use strict';

    // VARIABLES
    let _isFullscreen = false; // Should always start off false

    // CONSTS
    const LOAD_AFTER_LAST = true; // true: goes to next chapter on hitting last page
    const NAVIGATION_KEYS = [65, 68]; // A & D by default
    const SMODE_KEY = 83;
    const PREV_KEY = 81;
    const NEXT_KEY = 69;
    

    // ON PAGE LOAD
    window.onload = function (e) {
        window.addVIZControlListeners();
        window.toggleFullscreen(); // Hate having to fullscreen it every time
        window.toggleSingleMode();
    }

    // EVENT LISTENERS
    window.addVIZControlListeners = function () {
        document.addEventListener("keydown", function (keyEvent) {
            var key = keyEvent.which || keyEvent.keyCode;

            if (key == 70) {
                window.toggleFullscreen();
            }
            else if (key == SMODE_KEY) {
                window.toggleSingleMode();
            }
            else if (key == PREV_KEY) {
                window.clickEndBtn('prev');
            }
            else if (key == NEXT_KEY) {
                window.clickEndBtn('next');
            }
        });


        window.bindNavArrows();
        window.bindScrollWheel();
    }

    // CLICK NEXT/PREV CHAPTER
    window.clickEndBtn = function (type) {
        var endBtn = document.querySelectorAll("#end_page_end_card .o_chapter-container");

        if (endBtn) {
            if (type === 'prev') {
                endBtn = endBtn[1];
            }
            else if (type === 'next') {
                endBtn = endBtn[0];
            }
        }

        endBtn.click()
    }

    // RETURN WHETHER OR NOT YOU'RE AT THE END PAGE
    window.viewingFinalPage = function () {
        var endCardLeftPos = document.querySelector("#end_page_end_card").style.left;
        if (endCardLeftPos === "-3000px") {
            return false;
        }

        return true;
    }

    // TOGGLE FS VIA "F" KEY
    window.toggleFullscreen = function (readerOnly) {
        var fullscreenBtn = document.querySelector(".reader-icon-fullscreen");

        if (fullscreenBtn) {
            if (_isFullscreen) {
                document.querySelector(".reader-icon-embed").click();

                if (document.fullscreenElement) {
                    document.exitFullscreen();
                }

                _isFullscreen = false;
            }
            else {
                document.querySelector(".reader-icon-popout").click();

                document.documentElement.requestFullscreen().then(function () {
                    _isFullscreen = true;
                });
            }
        }
    }

    // TOGGLE SINGLE COLUMN DISPLAY MODE
    window.toggleSingleMode = function () {
        checkAndWaitElement(".reader-icon-single-page-mode").then(function (element) {
            var singleModeBtn = document.querySelector(".reader-icon-single-page-mode");
            singleModeBtn.click();
        });
    }

    // TODO: add deets & private variable
    window.bindScrollWheel = function () {
        var scriptContent = `// wheel up/down for navigation
        window.addEventListener("wheel", function (event) {
            if (event.deltaY < 0) {
                var event = new KeyboardEvent('keydown', {'keyCode':39, 'which':39});
                document.dispatchEvent(event);
            }
            else if (event.deltaY > 0) {
                var event = new KeyboardEvent('keydown', {'keyCode':37, 'which':37});
                document.dispatchEvent(event);
            }
        });`;

        injectScript(scriptContent);
    }


    // BINDS _navigationKeys TO NAV ARROWS
    // - Creates a script element for executing the binding code
    // - Optionally, arrows & binds move to next chapter on reaching the last page (LOAD_AFTER_LAST)
    // [Doesn't use the VIZControl listener because permissions idk]
    window.bindNavArrows = function () {
        var scriptContent = `window.isLastPage = function() {
                return window.elementInViewport(document.querySelector("#end_page_end_card"));
            }

            document.onkeydown = function (keyEvent) {
            var key = keyEvent.which || keyEvent.keyCode;

            var arrowPressed = false;
            switch (key) {
                case ` + NAVIGATION_KEYS[0] + `:
                    var event = new KeyboardEvent('keydown', {'keyCode':37, 'which':37});
                    document.dispatchEvent(event);
                    break;
                case ` + NAVIGATION_KEYS[1] + `:
                    var event = new KeyboardEvent('keydown', {'keyCode':39, 'which':39});
                    document.dispatchEvent(event);
                    break;
                case 37:
                    arrowPressed = true;
                    break;
                case 39:
                    arrowPressed = true;
                    break;
            }

            if (arrowPressed) {
                if (` + LOAD_AFTER_LAST + ` && window.isLastPage()) {
                    var endBtnNext = document.querySelector("#end_page_end_card .o_chapter-container");
                    endBtnNext.click();
                    arrowPressed = false;
                }
            }
        }`;

        injectScript(scriptContent);
    }

    // INJECT A SCRIPT INTO THE PAGE AS AN ELEMENT
    window.injectScript = function (str) {
        var scriptElement = document.createElement("script");
        scriptElement.type = "text/javascript";
        scriptElement.innerHTML = str;

        document.head.appendChild(scriptElement);
    }

    // WAIT FOR ELEMENT TO EXIST (Thanks Bergi https://stackoverflow.com/a/47775618/4805034!)
    async function checkAndWaitDocument(elementQueryStr, documentName) {
        while (documentName.querySelector(elementQueryStr) === null) {
            await rafAsync();
        }

        while (documentName.querySelector(elementQueryStr).hasAttributes() === false) {
            await rafAsync();
        }

        return true;
    }

    async function checkAndWaitElement(elementQueryStr) {
        while (document.querySelector(elementQueryStr) === null) {
            await rafAsync();
        }

        while (document.querySelector(elementQueryStr).hasAttributes() === false) {
            await rafAsync();
        }

        return true;
    }

    function rafAsync() {
        return new Promise(resolve => {
            requestAnimationFrame(resolve); // >setTimeout()
        });
    }
})();
