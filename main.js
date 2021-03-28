function insertSettings(settingsObj) {
    // create our settings span
    let settingsSpan = document.createElement("span");
    settingsSpan.id = "settingsSpan";
    settingsSpan.hidden = "true";

    // load default config if none is available
    // otherwise, load the user's settings config
    if (!settingsObj || Object.keys(settingsObj).length < 1) {
        fetch(chrome.runtime.getURL("../../cfg/defaults.json")).then(defaultFetch => {
            // get the text from our file fetch
            defaultFetch.text().then(defaultStr => {
                settingsSpan.textContent = defaultStr; // set the span's text value to the configuration file's contents
                document.head.appendChild(settingsSpan); // append the span now that it's prepared
            });
        });
    }
    else {
        settingsSpan.textContent = JSON.stringify(settingsObj); // set the span's text value to the stored configuration
        document.head.appendChild(settingsSpan); // append the span now that it's prepared
    }
}

function insertControlScript() {
    let controlScript = document.createElement("script");
    controlScript.src = chrome.runtime.getURL("/scripts/hotkey.js");
    document.head.appendChild(controlScript);
}

chrome.storage.local.get("readerSettings", settingEntry => {
    insertSettings(settingEntry['readerSettings']);
    insertControlScript();
});
