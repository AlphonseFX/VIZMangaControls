function insertSettings(settingEntry) {

    // shouldn't be needing this but i'm lazy
    let settingEntryTrim = settingEntry?.settings;

    // span creation
    let settingsSpan = document.createElement("span");
    settingsSpan.id = "settingsSpan";
    settingsSpan.hidden = "true";

    // check if the entry is undefined or has a length of zero
    if (!settingEntryTrim || Object.keys(settingEntryTrim).length < 1) {
        // fetch the setting configuration file
        fetch(chrome.runtime.getURL("/cfg/defaults.json")).then(defaultFetch => {
            // get the text from our file fetch
            defaultFetch.text().then(defaultStr => {
                // set the span's text value to the configuration file's contents
                // append the span now that it's prepared
                settingsSpan.textContent = defaultStr;
                document.head.appendChild(settingsSpan);

                // store initial settings
                chrome.storage.local.set({ "settings": JSON.parse(defaultStr) });
            });
        });
    }
    else {
        // set the span's text value to the stored configuration
        // append the span now that it's prepared
        settingsSpan.textContent = JSON.stringify(settingEntryTrim);
        document.head.appendChild(settingsSpan);
    }

}


function insertControlScript() {

    let controlScript = document.createElement("script");
    controlScript.src = chrome.runtime.getURL("/scripts/hotkey.js");
    document.head.appendChild(controlScript);

}


chrome.storage.local.get("settings", settingEntry => {

    insertSettings(settingEntry);
    insertControlScript(settingEntry);

});
