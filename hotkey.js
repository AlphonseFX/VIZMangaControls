// variables
let _isFullscreen = false; // default: false
let _singleModeActive = false;
let _readerSettings = undefined;

// onload override
window.onload = function() {
    _readerSettings = JSON.parse(document.querySelector("#settingsSpan").textContent);

    // auto popout (disabled on manga pages with action=read parameter)
    if (!window.location.href.includes("digital?action=read", "/product/")) {
        if (_readerSettings.auto_popout) toggleReaderOpen();
    }

    // auto single pade mode
    if (_readerSettings.auto_singlemode) toggleSingleMode();

    // keydown event listener for shortcuts
    document.addEventListener("keydown", (keyEvent) => {
        switch (keyEvent.key.toLowerCase()) {
            case _readerSettings.smode_key: 
                toggleSingleMode();
                break;
            case _readerSettings.fullscreen_key:
                toggleFullscreen();
                if (_readerSettings.immersive_fs) toggleReaderUI();
                break;
            case _readerSettings.popout_key:
                toggleReaderOpen();
                break;
            case _readerSettings.chapter_nav_keys[0]:
                gotoPrevChapter();
                break;
            case _readerSettings.chapter_nav_keys[1]:
                gotoNextChapter();
                break;
            case _readerSettings.page_nav_keys[0]:
                gotoNextPage();
                break;
            case _readerSettings.page_nav_keys[1]:
                gotoPrevPage();
                break;
        }
    });

    addMouseEventListeners();
}

// toggle hide/show for the reader's user interface
function toggleReaderUI() {
    let readerHeader = document.querySelector("#reader_header");
    readerHeader.hidden = !readerHeader.hidden;

    let readerFooter = document.querySelector("#reader_bottom_container");
    readerFooter.hidden = !readerFooter.hidden;
}

// moves backward by one page, unless that would make the page number negative
function gotoPrevPage() {
    window.page = (window.page - 1) < 0 ? 0 : (window.page - 1);
    window.loadPages();
}

// moves forward by one page, unless you're on the final page
function gotoNextPage() {
    if (isFinalPage() && _readerSettings.load_on_final) {
        var endBtnNext = document.querySelector("#end_page_end_card .o_chapter-container");
        endBtnNext.click();
    }

    window.page = isFinalPage() ? window.page : (window.page + 1);
    window.loadPages();
}

// loads the next chapter
function gotoNextChapter() {
    let endBtns = document.querySelectorAll("#end_page_end_card .o_chapter-container");
    if (endBtns[0]) endBtns[0].click();
}

// loads the previous chapter
function gotoPrevChapter() {
    let endBtns = document.querySelectorAll("#end_page_end_card .o_chapter-container");
    if (endBtns[1]) endBtns[1].click();
}

// toggles single column mode
function toggleSingleMode() {
    let oldPageMode = window.pageMode;
    let pageModeBtn = document.getElementsByClassName("reader-page-mode")[0];
    pageModeBtn.click();

    // double check that it got toggled
    if ((oldPageMode != 1) && window.pageMode == 2) {
        let interval = setInterval(() => {
            if (window.pageMode == 2) pageModeBtn.click();
            else clearInterval(interval);
        }, 300);
    }
}

// toggles popout
function toggleReaderOpen() {
    let isShonenJump = window.location.href.includes("viz.com/shonenjump/");

    if(readerOpen) {
        if(embedded) {
            popOut();
        }
        else {
            if(isShonenJump) embed();
            else closeReader();
        }
    }
    else {
        if(isShonenJump) popOut();
        else {
            document.querySelector("#reader_button a").click();

            // ensure the reader was open
            let interval = setInterval(() => {
                if (!readerOpen) document.querySelector("#reader_button a").click()
                else clearInterval(interval);
            }, 200);
        }
    }
}

// toggles fullscreen 
function toggleFullscreen() {
    if(_isFullscreen) {
        window.fullScreenExit()
        _isFullscreen = false;
    }
    else {
        window.goFullScreen();
        _isFullscreen = true;
    }
}

// returns whether or not you're at the last page
function isFinalPage() {
    let endCardLeftPos = document.querySelector("#end_page_end_card").style.left;
    if (endCardLeftPos === "-3000px") return false;
    return true;
}

function addMouseEventListeners() {
    document.querySelector("#modal-reader")?.addEventListener("wheel", function (event) {
        event.preventDefault();

        if(_readerSettings.enable_scrollbind) {
            if(_readerSettings.reverse_scrollbind) {
                if (event.deltaY < 0) gotoPrevPage();
                else if (event.deltaY > 0) gotoNextPage();
            }
            else {
                if (event.deltaY < 0) gotoNextPage();
                else if (event.deltaY > 0) gotoPrevPage();
            }
        }
    });

    document.querySelector("#embedded_desktop_wrapper")?.addEventListener("wheel", function (event) {
        event.preventDefault();

        if(_readerSettings.enable_scrollbind) {
            if(_readerSettings.reverse_scrollbind) {
                if (event.deltaY < 0) gotoPrevPage();
                else if (event.deltaY > 0) gotoNextPage();
            }
            else {
                if (event.deltaY < 0) gotoNextPage();
                else if (event.deltaY > 0) gotoPrevPage();
            }
        }
    });
}
