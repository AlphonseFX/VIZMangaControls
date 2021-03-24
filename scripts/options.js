let _defaultSettings = undefined;

window.onload = function() {

    // regular choice variables
    let autoPopoutChoice = document.querySelector("#autoPopout");
    let autoSingleModeChoice = document.querySelector("#autoSingleMode");
    let autoFinalLoadChoice = document.querySelector("#autoFinalLoad");
    let enableScrollbindChoice = document.querySelector("#enableScrollbind");
    let enableReverseScrollChoice = document.querySelector("#enableReverseScroll");
    let immersiveFsChoice = document.querySelector("#immersiveFsChoice");

    // key choice variables 
    let pageNextKeyChoice = document.querySelector("#pageNextKeyChoice");
    let pagePrevKeyChoice = document.querySelector("#pagePrevKeyChoice");
    let chapterNextKeyChoice = document.querySelector("#chapterNextKeyChoice");
    let chapterPrevKeyChoice = document.querySelector("#chapterPrevKeyChoice");
    let singleColKeyChoice = document.querySelector("#singleColKeyChoice");
    let fullscreenKeyChoice = document.querySelector("#fullscreenKeyChoice");
    let popoutKeyChoice = document.querySelector("#popoutKeyChoice");
    

    // use event listeners to allow only automatic key input 
    let listenElements = [ pageNextKeyChoice, pagePrevKeyChoice, chapterNextKeyChoice, 
                          chapterPrevKeyChoice, singleColKeyChoice, fullscreenKeyChoice,
                          popoutKeyChoice ];

    for(let index = 0; index < listenElements.length; index++) {
        listenElements[index].addEventListener("keyup", keyEvent => {
            listenElements[index].value = keyEvent.key.toLowerCase();
        });
    }

    // checkbox event listener to disable enableReverseScroll when unableScrollbind is unchecked
    let scrollBindChoice = document.querySelector("#enableScrollbind");
    scrollBindChoice.addEventListener("click", () => {
        document.querySelector("#enableReverseScroll").disabled = !scrollBindChoice.checked;
    });

    // fill inputs with default values
    function loadSettingValues(settingsObj) {
        autoPopoutChoice.checked = settingsObj.auto_popout;
        autoSingleModeChoice.checked = settingsObj.auto_singlemode;
        autoFinalLoadChoice.checked = settingsObj.load_on_final;
        enableScrollbindChoice.checked = settingsObj.enable_scrollbind;
        enableReverseScrollChoice.checked = settingsObj.reverse_scrollbind;
        immersiveFsChoice.checked = settingsObj.immersive_fs;
        if (!enableScrollbindChoice.checked) enableReverseScrollChoice.disabled = true;
    
        pageNextKeyChoice.value = settingsObj.page_nav_keys[0];
        pagePrevKeyChoice.value = settingsObj.page_nav_keys[1];
    
        chapterNextKeyChoice.value = settingsObj.chapter_nav_keys[0];
        chapterPrevKeyChoice.value = settingsObj.chapter_nav_keys[1];
    
        singleColKeyChoice.value = settingsObj.smode_key;
        fullscreenKeyChoice.value = settingsObj.fullscreen_key;
        popoutKeyChoice.value = settingsObj.popout_key;
    }

    // i'm getting bored here
    let settingsEntryTrim = undefined;
    chrome.storage.local.get("settings", settingsEntry => {
        settingsEntryTrim = settingsEntry?.settings;
        console.log(settingsEntry, settingsEntryTrim);

        // fetch the setting configuration file
        fetch(chrome.runtime.getURL("../../cfg/defaults.json")).then(defaultFetch => {
            // get the text from our file fetch
            defaultFetch.text().then(defaultStr => {
                // load the default values
                let parsedDefaults = JSON.parse(defaultStr);

                // create easily accessible backup for this page
                _defaultSettings = parsedDefaults;

                // check if the entry is undefined or has a length of zero
                if (!settingsEntry || Object.keys(settingsEntry).length < 1) {
                    // store initial settings
                    loadSettingValues(parsedDefaults);
                    chrome.storage.local.set({ "settings": parsedDefaults });
                }
                else {
                    // load the default values
                    loadSettingValues(settingsEntryTrim);
                }
            });
        });


    });

    function getModifiedSettings() {
        let settings = {
            "auto_popout": autoPopoutChoice.checked,
            "auto_singlemode": autoSingleModeChoice.checked, 
            "load_on_final": autoFinalLoadChoice.checked,
            "enable_scrollbind": enableScrollbindChoice.checked,
            "reverse_scrollbind": enableReverseScrollChoice.checked,
            "page_nav_keys": [ pageNextKeyChoice.value, pagePrevKeyChoice.value ], 
            "chapter_nav_keys": [ chapterNextKeyChoice.value, chapterPrevKeyChoice.value ], 
            "smode_key": singleColKeyChoice.value, 
            "fullscreen_key": fullscreenKeyChoice.value, 
            "popout_key": popoutKeyChoice.value,
            "immersive_fs": immersiveFsChoice.checked
        };

        return settings;
    }

    document.querySelector("#saveOptionsBtn").addEventListener("click", () => {
        if (settingsEntryTrim) {
            chrome.storage.local.set({ "settings": getModifiedSettings() });
            document.querySelector("#saveStatus").textContent = "Your preferences have been saved. :)";
        }
        else {
            document.querySelector("#saveStatus").textContent = "Your preferences could NOT be saved!";
        }
    });

    document.querySelector("#resetOptionsBtn").addEventListener("click", () => {
        if (_defaultSettings) loadSettingValues(_defaultSettings);
    });

}

