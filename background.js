// ==UserScript==
// @name         VIZControl
// @version      0.0.1
// @description  Adds basic media controls to VIZ manga reader.
// @author       Adakenko
// @match        https://www.viz.com/shonenjump/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // VARIABLES
    var _isFullscreen = false; // Should always start off false

    // CONSTS
    const NAVIGATION_KEYS = [65, 68]; // A & D by default
    const SMODE_KEY = 83;
    const PREV_KEY = 81;
    const NEXT_KEY = 69;

    // ON PAGE LOAD
    window.onload = function (e) {
        window.toggleVIZControlListeners();
        window.toggleFullscreen(); // Hate having to fullscreen it every time
    }

    // EVENT LISTENERS
    window.toggleVIZControlListeners = function () {
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
    }

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

    // TOGGLE FS VIA "F" KEY
    window.toggleFullscreen = function () {
        checkAndWaitElement(".reader-icon-fullscreen").then(function (element) {
            var fullscreenBtn = document.querySelector(".reader-icon-fullscreen");

            if (_isFullscreen) {
                document.querySelector(".reader-icon-embed").click();

                if (document.fullscreenElement) {
                    document.exitFullscreen();
                }

                _isFullscreen = false;
            }
            else {
                document.querySelector(".reader-icon-popout").click();

                fullscreenBtn.requestFullscreen().then(function () {
                    _isFullscreen = true;
                });
            }
        });
    }

    // TOGGLE SINGLE COLUMN DISPLAY MODE
    window.toggleSingleMode = function () {
        checkAndWaitElement(".reader-icon-single-page-mode").then(function (element) {
            var singleModeBtn = document.querySelector(".reader-icon-single-page-mode");
            singleModeBtn.click();
        });
    }

    // BINDS _navigationKeys TO NAV ARROWS
    // Creates a script element for executing the binding code
    // [Doesn't use the VIZControl listener for the time being!]
    window.bindNavArrows = function () {
        var scriptContent = `document.onkeydown = function (keyEvent) {
            var key = keyEvent.which || keyEvent.keyCode;

            if (key == ` + NAVIGATION_KEYS[0] + `) {
            var event = new KeyboardEvent('keydown', {'keyCode':37, 'which':37});
            document.dispatchEvent(event);
            }
            else if (key == ` + NAVIGATION_KEYS[1] + `) {
            var event = new KeyboardEvent('keydown', {'keyCode':39, 'which':39});
            document.dispatchEvent(event);
            }
        }`;

        var scriptElement = document.createElement("script");
        scriptElement.type = "text/javascript";
        scriptElement.innerHTML = scriptContent;

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
