// variables
let _isFullscreen = false; // default: false
let _readerSettings = undefined; // settings from the extension

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
                if (_readerSettings.immersive_fs) {
                    toggleReaderUI();
                    toggleCursor();
                }
                toggleFullscreen();
                break;
            case _readerSettings.popout_key:
                toggleReaderOpen();
                break;
            case _readerSettings.chapter_nav_keys[0]:
                loadPrevChapter();
                break;
            case _readerSettings.chapter_nav_keys[1]:
                loadNextChapter();
                break;
            case _readerSettings.page_nav_keys[0]:
                loadNextPage();
                break;
            case _readerSettings.page_nav_keys[1]:
                loadPrevPage();
                break;
        }
    });

    // mouse wheel listener
    let readerIDs = [ "#embedded_desktop_wrapper", "#modal-reader" ];
    for(id of readerIDs) {
        let reader = document.querySelector(id);
        if (reader) {
            reader.addEventListener("wheel", function (event) {
                event.preventDefault();
    
                if(_readerSettings.enable_scrollbind) {
                    if(_readerSettings.reverse_scrollbind) {
                        if (event.deltaY < 0) loadPrevPage();
                        else if (event.deltaY > 0) loadNextPage();
                    }
                    else {
                        if (event.deltaY < 0) loadNextPage();
                        else if (event.deltaY > 0) loadPrevPage();
                    }
                }
            });
        }
    }
}

// moves backward by one page, unless that would make the page number negative
function loadPrevPage() {
    let oldPage = page;
    let newPage = (page - 1) < 0 ? 0 : (page - 1);

    if (newPage != oldPage) {
        page = newPage;
        loadPages();
    } 
}

// moves forward by one page, unless you're on the final page
function loadNextPage() {
    let prevPage = page;

    if ((page + 1) != prevPage) {
        page++;
        loadPages();
    }

    if (_readerSettings.load_on_final) {
        if (isFinalPage()) loadNextChapter(); // load next chapter if we're on the final page
        else if (page == prevPage) loadNextChapter(); // do the same while catching a bug, where the page index is duplicated
    }
}

// loads the next chapter
function loadNextChapter() {
    let endBtns = document.querySelectorAll("#end_page_end_card .o_chapter-container");
    if (endBtns[0]) endBtns[0].click();
}

// loads the previous chapter
function loadPrevChapter() {
    let endBtns = document.querySelectorAll("#end_page_end_card .o_chapter-container");
    if (endBtns[1]) endBtns[1].click();
}

// toggles single column mode
function toggleSingleMode() {
    let pageModeBtn = document.getElementsByClassName("reader-page-mode")[0];
    let oldPageMode = pageMode;

    let toggleInterval = setInterval(() => {
        if (pageMode == oldPageMode) pageModeBtn.click();
        else clearInterval(toggleInterval);
    }, 300);
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
            // ensure the reader was open
            let interval = setInterval(() => {
                if (!readerOpen) document.querySelector("#reader_button a").click()
                else clearInterval(interval);
            }, 200);
        }
    }
}

// toggle hide/show for the reader's user interface
function toggleReaderUI() {
    let readerHeader = document.querySelector("#reader_header");
    readerHeader.hidden = !readerHeader.hidden;

    let readerFooter = document.querySelector("#reader_bottom_container");
    readerFooter.hidden = !readerFooter.hidden;
}

// toggle hide/show for the mouse
function toggleCursor() {
    if (document.body.style.cursor == "none") 
        document.body.style = "cursor: default;";
    else 
        document.body.style = "cursor: none;";
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
    return page > getPageCount();
}

