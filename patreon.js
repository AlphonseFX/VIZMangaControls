// Imports
const PUPPETEER = require('puppeteer-core');
const fs = require('fs');
const PATH = require('path');

// Variables
var main_browser;
var main_page;

// Configuration file
// Format: 
// { 
//    "token"  : "",
//    "prefix" : "!vendor"
// }
const CONFIG = require(
    PATH.join(__dirname, 'resources', 'config.json')
);

/* 
 * function :: addPatron ( object )
 * verifies that the patron url is valid, then adds the user data to the list
 */
async function addPatron(obj) {
    try {
        if (obj) {
            var status = await getStatus(obj.url);
            if (status) {
                appendList(obj);
                return true;
            }
            else {
                return false;
            }
        }
        else {
            console.log("(ERROR) Invalid object returned!");
            return false;
        }
    }
    catch (e) {
        console.log("(ERROR) Failed to add Patron: see logs");
        log(e);
    }
};

/* 
 * function :: getStatus ( string )
 * creates a new page at the specified url and grabs the pageUser variables
 */
async function getStatus(url) {
    try {
        var bootstrap = null;
        
        if (isSanitary(url)) { // sanitation check on URLs
            if (!main_browser) { // initialize browser & page, if not already done
                try {
                    main_browser = await PUPPETEER.launch({
                        executablePath: CONFIG.browserPath
                    });
        
                    main_page = await main_browser.newPage();
                }
                catch (e) {
                    console.log("\n(ERROR) Failed to initialize browser; have you configured it properly?");
                    console.log("(ERROR) Cannot continue without browser; exiting program...");
                    log('getStatus:' + e);
                    process.exit(0);
                }
            }
            await main_page.goto(url); // visit the URL
            const scriptPromise = await main_page.evaluate(() => window.patreon); // evaluate patreon variables
            bootstrap = scriptPromise.bootstrap;
        }
        else {
            console.log("(ERROR) Failed to fetch window, malformed URL");
        }
    
        var isPatron = false;
        var included = bootstrap.pageUser.included;

        if (included) {
            included.forEach(item => {
                if (item.type === 'pledge') {
                    var pledgeID = item.relationships.creator.data.id;
                    if (pledgeID === "10501908") { // jack stauber's pledge ID
                        isPatron = true;
                    }
                }
            });
        }
        else {
            return false;  // can't read pledges (private?)
        }
    
        return isPatron;
    }
    catch (e) {
        console.log("(ERROR) Failed to load status of Patron URL: see logs");
        log(e);
    }
};

/* 
 * function :: validateList ( )
 * verifies the patronage of those stored in the local list
 * returns a list of all expired patrons
 */
async function validateList() {
    try {
        var patronList = await readList()['patrons']; 
        var invalidList = [];

        if (patronList) {
            console.log("(NOTICE) Validating the Patron list, please wait...")
            for (var i = 0; i < patronList.length; i++) {
                process.stdout.write("Validating " + (i + 1) + " out of " + patronList.length + "...")

                var status = await getStatus(patronList[i].url);
                if (!status) {
                    invalidList.push(patronList[i].discord);
                    removeListKey(patronList[i].discord);
                }

                // Rate limit unless we've hit the end of the list
                if (i < (patronList.length - 1)) { 
                    await sleep(2000);
                    process.stdout.clearLine();
                    process.stdout.cursorTo(0);
                }
                else {
                    process.stdout.write("\n");
                }
            }

            // Close the browser for efficiency 
            if (main_browser) {
                await main_browser.close();
                main_browser = undefined;
            }

            console.log("(NOTICE) List successfully validated with " + invalidList.length + " expiration(s) detected");
            return invalidList;
        }
    }
    catch (e) {
        console.log("(ERROR) Failed to validate the Patron list: see logs");
        log(e);
    }
};

/* 
 * function :: readList ( )
 * reads from a prespecified JSON file (output.json) and returns the parsed output
 */
function readList() {
    try {
        var listPath = PATH.join(__dirname, 'resources', 'output.json');
        var listJSON = fs.readFileSync(listPath);
        var parsedList = JSON.parse(listJSON);

        return parsedList;
    }
    catch (e) {
        console.log("(ERROR) Failed to read from resource output.json. Is it missing or empty?");
    }
};

/* 
 * function :: appendList ( object )
 * appends JSOB objects to an existing list
 */
function appendList(object) {
    try {
        var newList = readList();

        if (typeof newList['patrons'] !== undefined) {
            let listLength = newList['patrons'].length;
            
            if (listLength && object) {
                newList['patrons'][listLength] = object;
                let listPath = PATH.join(__dirname, 'resources', 'output.json');
                fs.writeFileSync(listPath, JSON.stringify(newList));
            }
        }
        else {
            console.log("(ERROR) Parsed list is undefined");
        }

    }
    catch (e) {
        console.log("(ERROR) Failed to write to resource output.json: see logs");
        log(e);
    }
};

/* 
 * function :: removeListKey ( id )
 * removes a key if it contains the provided discord id
 */
function removeListKey(discordId) {
    let newList = readList()['patrons'];
    for (var i = 0; i < newList.length; i++) {
        if (newList[i].discord == discordId) {
            newList.splice(i, 1);
        }
    }

    let listPath = PATH.join(__dirname, 'resources', 'output.json');
    fs.writeFileSync(listPath, JSON.stringify({"patrons":newList}));
};

/* 
 * function :: isSanitary ( string )
 * ensures that the input is a string of the designated format 
 */
function isSanitary(string) {
    const REGEX = /^https?:\/\/www\.patreon\.com\/([a-zA-Z]){1,23}\/(creators)?$/g;
    const REGEX2 = /^https?:\/\/www\.patreon\.com\/user\?u=\d{8}$/g;
    const REGEX3 = /^https?:\/\/www\.patreon\.com\/user\/creators\?u=\d{8}$/g;

    return (REGEX.test(string) || REGEX2.test(string) || REGEX3.test(string));
};

/* 
 * function :: sleep ( number )
 * asynchronous function for sleep
 */
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

/* 
 * function :: log ( error )
 * logs an error to a file named in milliseconds
 */
function log(e) {
    var listPath = PATH.join(__dirname, 'logs', (new Date()).getTime() + '.txt');
    fs.writeFileSync(listPath, e);
};

// Exports
module.exports.getPatrons = readList;
module.exports.addPatron = addPatron;
module.exports.validateList = validateList;