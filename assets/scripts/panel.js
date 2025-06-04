import {getActiveTabURL} from "./utils.js";
import { Course, Module, ModuleItem, Page_Error, Pseudo_Element } from "./classes.js";
import { initializeAccordion } from "./accordion.js";

//declare values
const textLookUp = "#:~:text=";
let urlParameters = new Array();
let _course;
let HTML_CHUNKS_DOC;

// helpful functions
function exists(obj) {return (obj != null && obj != undefined)}//check if element / object was successfuly retrieved

function isOnModulesPage() {//check if user is on module page of course
    let condition = false;
    urlParameters.forEach((param) => {
        if(param === "modules") {
            condition = true;
        }
    })

    return condition;
}

//Canvas functions
async function generateCourse() {
    //cancel course generation if not on course modules page
    if(!isOnModulesPage()) {alert("Course must be generated on Course 'Modules' Page."); return;}

    //grab list of module elements
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    const course = await chrome.tabs.sendMessage(tab.id, {type: "GENERATE-COURSE"});
    _course = Course.deserialize(course);

    //save course
    saveCourse(course);

    displayCourse(Course.deserialize(course));
}

//load in an html chunk / code file
async function fetchHTMLChunk(path) {
    //HTML chunk document
    let document;

    await fetch(path)
        .then(response => {
            //when page is loaded, convert to text
            return response.text();
        })
        .then(html => {
            //initialize DOM parser
            const parser = new DOMParser();

            //parse the text
            const doc = parser.parseFromString(html, "text/html");

            document = doc;
        })
        .catch(error => {
            console.error('failed to fetch HTML: ', error);
        })

    return document;
}

async function displayCourse(course) {
    if(HTML_CHUNKS_DOC === null || HTML_CHUNKS_DOC === undefined) {
        HTML_CHUNKS_DOC = await fetchHTMLChunk('/assets/html-code-chunks/panel-elements.html');
    }

    //update relevant course information
    if(course.title.length > 14) {
        document.getElementById("course-name").value = course.title.substr(0,14) + "...";//course title
    } else {
        document.getElementById("course-name").value = course.title;
    }
    document.getElementById("prof-name").value = course.professorName;//prof name
    document.getElementById("total-errors-count").innerText = course.gatherErrorCount();//course error count
    document.getElementById("total-modules-count").innerText = course.moduleCount;//course modules
    document.getElementById("modules-checked-count").innerText = course.modulesCheckedCount();//course modules checked

    document.getElementById('accordion-group').innerHTML = "";

    //display modules and module pages
    //create accordion modules and dropdowns for course
    let index = 1;
    Object.keys(course.modules).forEach((key) => {
        let m = Module.deserialize(course.modules[key]);//grab module

        //create DOM elements
        createAccordionPair_Module(m, index);
        index++;
    });

    //display the correct containers
    if(!document.getElementById('course-header').classList.contains('display-flex')) {
        document.getElementById('course-header').classList.add('display-flex');
    }
    if(!document.getElementById('course-description1-container').classList.contains('display')) {
        document.getElementById('course-description1-container').classList.add('display');
    }
    if(!document.getElementById('course-modules-container').classList.contains('display')) {
        document.getElementById('course-modules-container').classList.add('display');
    }

    //remove display for other containers
    if(!document.getElementById('course-generation-container').classList.contains('display')) {
        document.getElementById('course-generation-container').classList.remove('display');
    }
    if(document.getElementById('course-list-container').classList.contains('display')) {
        document.getElementById('course-list-container').classList.remove('display');
    }
    if(document.getElementById('add-error-container').classList.contains('display')) {
        document.getElementById('add-error-container').classList.remove('display');
    }
    if(document.getElementById('errors-container').classList.contains('display')) {
        document.getElementById('errors-container').classList.remove('display');
    }
    if(document.getElementById('course-list-container').classList.contains('display')) {
        document.getElementById('course-list-container').classList.remove('display');
    }
    if(document.getElementById('console-container').classList.contains('display')) {
        document.getElementById('console-container').classList.remove('display');
    }
}

function createAccordionPair_Module(module, index) {
    //clone head element to create new instance
    let head = HTML_CHUNKS_DOC.querySelector('.head').cloneNode(true);

    //adjust button attributes
    let button = head.querySelector('button');
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", "sect" + index.toString());
    button.id = "accordion" + index.toString();

    //adjust page title
    let span = button.querySelector('.top-row span');
    
    if(module.title.length > 28) {
        span.innerText = module.title.substr(0,25) + "...";
    } else {
        span.innerText = module.title;
    }

    head.querySelector('.page-count').innerText = module.count;

    document.getElementById("accordion-group").appendChild(head);

    //accordion content
    let content = HTML_CHUNKS_DOC.querySelector('.pages').cloneNode(false);
    content.id = "sect" + index.toString();
    content.setAttribute('aria-labelledby', 'accordion' + index.toString());
    document.getElementById('accordion-group').appendChild(content);

    //module pages
    Object.keys(module.moduleItems).forEach((key) => {
        let item = ModuleItem.deserialize(module.moduleItems[key]);

        let li = HTML_CHUNKS_DOC.querySelector('.pages li').cloneNode(true);
        let link = li.querySelector('a');
        link.setAttribute('href', item.url);
        link.setAttribute('title', 'Go to ' + item.title);
        link.addEventListener("click", async () => {
            //redirect page
            const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { type: "REDIRECT-PAGE", url: item.url });
        });

        let div = li.querySelector('.top-row span');
        
        if(item.title.length > 28) {
            div.innerText = item.title.substr(0, 28) + "...";

        } else {
            div.innerText = item.title;
        }

        li.querySelector('.error-count').innerText = item.count;

        content.appendChild(li);
    })
    
    //setup accordion javascript
    initializeAccordion(head);
}

async function displayCoursePage() {
    if(HTML_CHUNKS_DOC === null || HTML_CHUNKS_DOC === undefined) {
        HTML_CHUNKS_DOC = await fetchHTMLChunk('/assets/html-code-chunks/panel-elements.html');
    }

    //grab textlookup key for highlighted text
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    const response = await chrome.tabs.sendMessage(tab.id, {type: "URL"});

    //fetch (returns a copy object instance of a module item)
    let moduleItem = ModuleItem.deserialize(_course.fetchModuleItem(response.url.toString()));

    document.getElementById("prof-name").value = _course.professorName;//prof name
    //update relevant course information
    if(_course.title.length > 14) {
        document.getElementById("course-name").value = _course.title.substr(0,14) + "...";//course title
    } else {
        document.getElementById("course-name").value = _course.title;
    }

    if(moduleItem.title.length > 13) {
        document.getElementById("title").innerText = moduleItem.title.substring(0,12) + '...';
    } else {
        document.getElementById("title").innerText = moduleItem.title;
    }
    
    document.getElementById('page-error-count').innerText = moduleItem.count.toString();
    document.getElementById('page-type').innerText = moduleItem.type;

    //reset course page error accordion
    document.getElementById('error-list').innerHTML = "";

    //iterate through error lists and display
    let index = 1;
    Object.keys(moduleItem.errors).forEach((key) => {
        let list = moduleItem.errors[key];

        //create DOM elements
        createAccordionPair_ModuleItem(list, key, index);
        index++;
    })
}

function createAccordionPair_ModuleItem(list, key, index) {    
    //button / accordion heading
    let _li = HTML_CHUNKS_DOC.querySelector('.error-type').cloneNode(true);

    //set button attributes
    let button = _li.querySelector('button');
    button.setAttribute("aria-controls", "sect" + index.toString());
    button.id = "accordion" + index.toString();

    //add error name and count
    button.querySelector('.p1').innerText = key;
    button.querySelector('.error-instance-count').innerText = list.length.toString();

    //set up accordion content element
    let content = HTML_CHUNKS_DOC.querySelector('.region').cloneNode(false);
    content.id = "sect" + index.toString();
    content.setAttribute('aria-labelledby', 'accordion' + index.toString());

    for (let i = 0; i < list.length; i++) {
        let e = Page_Error.deserialize(list[i]);

        let li = HTML_CHUNKS_DOC.querySelector('.region li').cloneNode(true);
        li.id = e.id;

        let button2 = li.querySelector('button');
        if (e.match.length > 0) { li.title = button2.setAttribute('title', e.match) };

        button2.addEventListener('click', removeError.bind(this, e.id));

        let div = button2.querySelector('.match');
        if (e.match.length < 1) {
            div.innerText = e.name + ': #' + (i + 1);
        } else if (e.match.length > 30) {
            div.innerText = (e.match.substring(0, 30) + '...')
        } else {
            div.innerText = e.match
        }

        content.appendChild(li);
    }

    _li.appendChild(content);

    //skip if no errors are present
    if(list.length < 1) {
        return;
    }

    //append head to error list parent
    document.getElementById("error-list").appendChild(_li);

    //setup accordion javascript
    initializeAccordion(_li);
}

function saveCourse(course) {
    chrome.storage.local.set({
        [Course.deserialize(course).id]: course,
    })
}

function fetchCourse(id) {
    return new Promise ((resolve) => {
        chrome.storage.local.get([id], obj => {
            resolve(obj[id] ? Course.deserialize(obj[id]) : null);
        })
    })
}

function findError() {
    //grab error information
    let errorElements = document.getElementsByClassName("combo-option");
    let selected;
    for(let i = 0; i < errorElements.length; i++) {
        if(errorElements[i].getAttribute("aria-selected") === "true") {
            selected = errorElements[i];
            break;
        }
    }

    return selected;
}

async function CreateDisplayWindowElement(response) {
    //grab HTMl chunks doc
    if(HTML_CHUNKS_DOC === null || HTML_CHUNKS_DOC === undefined) {
        HTML_CHUNKS_DOC = await fetchHTMLChunk('/assets/html-code-chunks/panel-elements.html');
    }

    let pseudoElement = Pseudo_Element.deserialize(response);

    //grab html chunk
    let html = HTML_CHUNKS_DOC.querySelector('.selected-element-code').cloneNode(true);

    if(document.getElementById('element-selected').getAttribute('path') === 'null') {
        document.getElementById('element-selected').setAttribute('path', pseudoElement.path);
    }

    html.querySelector('.tagName1').innerText = pseudoElement.tagName;

    //set up attributes
    Object.keys(pseudoElement.attributes).forEach(key => {
        console.log(pseudoElement.attributes[key]);
        let attributeBase = HTML_CHUNKS_DOC.querySelector('.element-attribute-wrapper').cloneNode(true);
        attributeBase.querySelector('.element-attribute').innerText = key;
        attributeBase.querySelector('.element-string').innerText = '"' + pseudoElement.attributes[key] + '" ';
        attributeBase.querySelector('.element-attribute').innerText = key;

        html.querySelector('.element-attribute-container').appendChild(attributeBase);
    })

    //set inner text
    html.querySelector('.innertext').innerText = pseudoElement.innerText;

    //add child elements
    pseudoElement.children.forEach( async (child) => {
        await CreateDisplayWindowElement(child)
        .then(result => {
            html.querySelector('.innerHTML').appendChild(result);
        })

        html.querySelector('.innerHTML').setAttribute('aria-hidden', 'false');
    })

    //set tag name
    html.querySelector('.tagName2').innerText = pseudoElement.tagName;
    return html;
}

document.getElementById("add").addEventListener("click" , (async () => {
    //skip if error type is not selected
    if(document.getElementById("error-type").getAttribute("value").length < 2) {
        alert("no Error type selected");
        return;
    }

    let selected = findError();
    console.log(selected);

    //grab textlookup key for highlighted text
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    const response = await chrome.tabs.sendMessage(tab.id, {type: "ADD-ERROR"});

    //create error
    let name = selected.innerText;
    let key = "Nothing to Show";
    // TO FIX <- error hrefs are broken

    let e = new Page_Error(name, key);
    
    addError(e);
}));

async function addError(e) {
    const url = await chrome.tabs.sendMessage(tab.id, {type: "URL"});

    let moduleItem = ModuleItem.deserialize(_course.fetchModuleItem(url.url.toString()));
    let module = Module.deserialize(_course.fetchModule(url.url.toString()));

    moduleItem.addError(e);
    module.setModuleItem(moduleItem)
    _course.setModule(module);
    _course.errorCount++;

    saveCourse(_course.serialize());
    displayCoursePage();
}

async function removeError(id) {
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    const url = await chrome.tabs.sendMessage(tab.id, {type: "URL"});

    let moduleItem = ModuleItem.deserialize(_course.fetchModuleItem(url.url.toString()));
    let module = Module.deserialize(_course.fetchModule(url.url.toString()));


    let error = moduleItem.removeError(id);
    module.setModuleItem(moduleItem)
    _course.setModule(module);
    _course.errorCount--;

    chrome.tabs.sendMessage(tab.id, {type: "ERROR-REMOVED", error: error});

    saveCourse(_course.serialize());
    displayCoursePage();
}

document.getElementById('fix-all').addEventListener('click', async () => {
    createPanel();
});

document.getElementById('clear-page-errors').addEventListener('click', async () => {
    //grab tab information
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    const url = await chrome.tabs.sendMessage(tab.id, {type: "URL"});
    
    //grab correct page object and module object
    let moduleItem = ModuleItem.deserialize(_course.fetchModuleItem(url.url.toString()));
    let module = Module.deserialize(_course.fetchModule(url.url.toString()));

    //clear errors
    moduleItem.clearErrors();

    //save changes
    module.setModuleItem(moduleItem)
    _course.setModule(module);
    saveCourse(_course.serialize());
    displayCoursePage();
})

document.getElementById('clear').addEventListener('click', () => {
    chrome.storage.local.clear();
});

document.getElementById('display-errors').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    const url = await chrome.tabs.sendMessage(tab.id, {type: "URL"});
    
    let moduleItem = ModuleItem.deserialize(_course.fetchModuleItem(url.url.toString()));
    
    let errors = new Array();
    Object.keys(moduleItem.errors).forEach((key) => {
        let list = moduleItem.errors[key];

        list.forEach(error => {
            errors.push(error);
        })
    });

    const response = await chrome.tabs.sendMessage(tab.id, {type: "DISPLAY-ERRORS", errors: JSON.stringify(errors)});
});

document.getElementById('next-page').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    const response = await chrome.tabs.sendMessage(tab.id, {type: "NEXT"});
});

document.getElementById("generate").addEventListener("click", generateCourse.bind());

document.getElementById("prof-name").addEventListener('change', () => {
    if (_course != null && _course != undefined) {
        _course.professorName = document.getElementById("prof-name").value;
    }

    saveCourse(_course.serialize());
})

document.getElementById("course-name").addEventListener('change', () => {
    if (_course != null && _course != undefined) {
        _course.title = document.getElementById("course-name").value;
    }

    saveCourse(_course.serialize());
})

document.getElementById('element-selected').addEventListener('mouseenter', async () => {
    //if no path exists, ignore mouse enter
    if(document.getElementById('element-selected').getAttribute('path') === 'null') {return; }

    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, {type: "SELECTED-ELEMENT-FOCUS", 
        path: document.getElementById('element-selected').getAttribute('path')});
})

document.getElementById('element-selected').addEventListener('mouseleave', async () => {
    //if no path exists, ignore mouse enter
    if(document.getElementById('element-selected').getAttribute('path') === 'null') {return; }

    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, {type: "SELECTED-ELEMENT-UNFOCUS", 
        path: document.getElementById('element-selected').getAttribute('path')});
})

async function pageSetup() {
    //default title
    document.getElementById('title').innerText = 'WisCAT';

    //reset all panel content containers (no display on all except default, 'generate course')
    if(!document.getElementById('course-generation-container').classList.contains('display')) {
        document.getElementById('course-generation-container').classList.remove('display');
    }
    if(document.getElementById('course-short-details-container').classList.contains('display')) {
        document.getElementById('course-short-details-container').classList.remove('display');
    }
    if(document.getElementById('add-error-container').classList.contains('display')) {
        document.getElementById('add-error-container').classList.remove('display');
    }
    if(document.getElementById('errors-container').classList.contains('display')) {
        document.getElementById('errors-container').classList.remove('display');
    }
    if(document.getElementById('course-list-container').classList.contains('display')) {
        document.getElementById('course-list-container').classList.remove('display');
    }
    if(document.getElementById('course-description1-container').classList.contains('display')) {
        document.getElementById('course-description1-container').classList.remove('display');
    }
    if(document.getElementById('course-modules-container').classList.contains('display')) {
        document.getElementById('course-modules-container').classList.remove('display');
    }
    if(document.getElementById('console-container').classList.contains('display')) {
        document.getElementById('console-container').classList.remove('display');
    }

    // chrome.storage.local.clear();
    let response = await chrome.storage.local.get();
    Object.keys(response).forEach(key => {
        console.log(Course.deserialize(response[key]));
    })
    
    //grab url information
    const activeTab = await getActiveTabURL();
    urlParameters = activeTab.url.split("courses")[1].split("/");

    if(!exists(urlParameters)) {return;}//cancel out load in if parameters no retreived

    //check if on Canvas website and if loaded into a course
    if(!activeTab.url.includes("instructure.com/")) {
        if(!activeTab.url.includes(/[0-9]/.test(str))) {
            return;
        }
    }
    
    //check if course records exist
    await fetchCourse(urlParameters[1]).then((result) => {_course = result; })//hold onto course records

    //if course is nonexistant: display course generation button
    if (_course === null || _course === undefined) {
        document.getElementById("course-generation-container").classList.add("display");
        return;
    }

    //if on modules page, display course information
    if(_course != null && _course != undefined && activeTab.url.includes("modules")) {
        displayCourse(_course);
        return;
    }

    //if course exits: display course page records
    document.getElementById("course-short-details-container").classList.add("display");
    document.getElementById("add-error-container").classList.add("display");
    document.getElementById("errors-container").classList.add("display");

    displayCoursePage();

    //audit the page if it has not been audited before
    let moduleItem = ModuleItem.deserialize(_course.fetchModuleItem(activeTab.url.toString()));//grab webpage information
    let module = Module.deserialize(_course.fetchModule(activeTab.url.toString()));//grab module information
    if(!moduleItem.checked) {//check if audited
        moduleItem.checked = true;

        const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});

        //run audit function
        chrome.tabs.sendMessage(tab.id, { type: "AUDIT" }, function (response) {
            if (response != null) {
                if (JSON.parse(response).length > 0) {
                    let errors = JSON.parse(response);

                    errors.forEach((error) => {
                        moduleItem.addError(Page_Error.deserialize(error));
                    })
                }
            }

            module.setModuleItem(moduleItem)
            _course.setModule(module);
            _course.errorCount++;
            saveCourse(_course.serialize());
            displayCoursePage();
        });
    }
}

//event listener
chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    if (request.type === "NEW-PAGE-LOADED") {
        pageSetup();
    }

    if(request.type === "PAGE-CHECKED") {
        //grab textlookup key for highlighted text
        const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
        const response = await chrome.tabs.sendMessage(tab.id, {type: "URL"});

        //fetch (returns a copy object instance of a module item)
        let condition = ModuleItem.deserialize(_course.fetchModuleItem(response.url.toString())).checked;
        sendResponse({checked: condition});
    }

    if(request.type === "REMOVE-ERROR") {
        let error = removeError(request.error_id);
        sendResponse({error: error});
    }

    if(request.type === "ERROR-REMOVED") {
        pageSetup();
    }

    if(request.type === "ELEMENT-SELECTED") {
        document.getElementById('element-selected').innerHTML = "";
        document.getElementById('element-selected').setAttribute('path', 'null');
        
        CreateDisplayWindowElement(request.pseudoElement)
        .then (result => {
            document.getElementById('element-selected').appendChild(result);
        })
    }
});


//setup page and extension on load
window.addEventListener("load", pageSetup());