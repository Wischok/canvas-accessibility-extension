import {getActiveTabURL} from "./utils.js";
import { Course, Module, ModuleItem, Page_Error } from "./classes.js";
import { initializeAccordion } from "./accordion.js";

//declare values
const textLookUp = "#:~:text=";
let queryOptions = { active: true, currentWindow: true };
let urlParameters = new Array();
let fullURL;
let _course, activePageId;

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

function displayCourse(course) {
    //update relevant course information
    document.getElementById("course-title").innerText = course.title;//course title
    document.querySelectorAll(".prof-name")[0].value = course.professorName;//prof name
    document.querySelectorAll(".prof-name")[1].value = course.professorName;//prof name
    document.getElementById("total-errors-count").innerText = course.gatherErrorCount();//course error count
    document.getElementById("total-modules-count").innerText = course.moduleCount;//course modules
    document.getElementById("modules-checked-count").innerText = course.modulesCheckedCount();//course modules checked

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
    document.getElementById('container4').classList.remove('no-display');
    if(!document.getElementById('container1').classList.contains('no display')) {
        document.getElementById('container1').classList.add('no-display');
    }
    if(!document.getElementById('container2').classList.contains('no display')) {
        document.getElementById('container2').classList.add('no-display');
    }
    if(!document.getElementById('container3').classList.contains('no display')) {
        document.getElementById('container3').classList.add('no-display');
    }
}

function createAccordionPair_Module(module, index) {
    //button / accordion heading
    let head = document.createElement('div');
    head.classList.add("head");

    let button = document.createElement('button');
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", "sect" + index.toString());
    button.id = "accordion" + index.toString();

    let span = document.createElement('span');
    span.classList.add("title");
    if(module.title.length > 30) {
        span.innerText = module.title.substring(0,30) + "...";
    } else {
        span.innerText = module.title;
    }
    
    button.appendChild(span);

    span = document.createElement('span');
    span.classList.add("icon");
    span.innerHTML = "<img src='/assets/images/caret-icon.png' alt=''>";
    button.appendChild(span);

    head.appendChild(button);
    document.getElementById("accordion-group").appendChild(head);

    //accordion content
    let content = document.createElement('ul');
    content.classList.add('content');
    content.id = "sect" + index.toString();
    content.setAttribute("role", 'region');
    content.setAttribute('aria-labelledby', 'accordion' + index.toString());
    document.getElementById('accordion-group').appendChild(content);

    //module pages
    Object.keys(module.moduleItems).forEach((key) => {
        let item = ModuleItem.deserialize(module.moduleItems[key]);

        let li = document.createElement('li');
        let link = document.createElement('a');
        link.setAttribute('href', item.url);
        link.setAttribute('title', 'Go to ' + item.title);
        link.addEventListener("click", async () => {
            //redirect page
            const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
            const response = await chrome.tabs.sendMessage(tab.id, { type: "REDIRECT-PAGE", url: item.url });
        });

        let div = document.createElement('div');
        div.classList.add('top-row');
        if(item.title.length > 40) {
            div.innerText = item.title.substring(0,40) + "...";
        }
        else {
            div.innerText = item.title;
        }
        link.appendChild(div);

        div = document.createElement('div');
        div.classList.add('bottom-row');
        div.innerHTML = "<div class='error-count-wrapper'><span class='error-count'>" + item.count + "</span> errors</div>";
        link.appendChild(div);

        li.appendChild(link);
        li.appendChild(document.createElement('hr'));
        content.appendChild(li);
    })
    
    //setup accordion javascript
    initializeAccordion(head);
}

async function displayCoursePage() {
    //grab textlookup key for highlighted text
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    const response = await chrome.tabs.sendMessage(tab.id, {type: "URL"});

    //fetch (returns a copy object instance of a module item)
    let moduleItem = ModuleItem.deserialize(_course.fetchModuleItem(response.url.toString()));

    document.querySelectorAll(".prof-name")[0].value = _course.professorName;//prof name
    document.querySelectorAll(".prof-name")[1].value = _course.professorName;//prof name
    document.getElementById("course-page").innerText = "Course Page: " + moduleItem.title;
    document.getElementById('error-counter').innerText = moduleItem.count.toString();
    document.getElementById('page-type').innerText = moduleItem.type;

    //reset course page error accordion
    document.getElementById('accordion-group-errors').innerHTML = "";

    //iterate through error lists and display
    let index = 1;
    Object.keys(moduleItem.errors).forEach((key) => {
        let list = moduleItem.errors[key];

        //create DOM elements
        createAccordionPair_ModuleItem(list, key, index);
        index++;
    })
}

function getPageId() {
    //example url https://mtsac.instructure.com/courses/106139/modules/items/3168294
    //example url https://mtsac.instructure.com/courses/106139/pages/how-to-navigate-this-course?module_item_id=3168295
    if(fullURL.includes('module_item_id=')) {
        let temp = fullURL.split('module_item_id=')[1];
        if(temp.includes('#')) {//acount for textlookup string
            temp = temp.split("#")[0];
        }
        
        return temp;
    }
    else {
        console.log('page missing module-item-id');
        return fullURL;
    }
}

function createAccordionPair_ModuleItem(list, key, index) {    
    //button / accordion heading
    let head = document.createElement('div');
    head.classList.add("head");

    let button = document.createElement('button');
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", "sect" + index.toString());
    button.id = "accordion" + index.toString();

    let span = document.createElement('span');
    span.classList.add("title");
    span.innerText = key + ": " + list.length.toString() + " instances";
    
    button.appendChild(span);

    span = document.createElement('span');
    span.classList.add("icon");
    span.innerHTML = "<img src='/assets/images/caret-icon.png' alt=''>";
    button.appendChild(span);

    head.appendChild(button);

    //accordion content
    let content = document.createElement('ul');
    content.classList.add('content');
    content.id = "sect" + index.toString();
    content.setAttribute("role", 'region');
    content.setAttribute('aria-labelledby', 'accordion' + index.toString());

    list.forEach((error) => {
        let e = Page_Error.deserialize(error);

        let li = document.createElement('li');
        li.id = e.id;
        
        let button2 = document.createElement('button');
        if(e.match.length > 0) {li.title = button2.setAttribute('title', e.match)};
        button2.classList.add('link');
        //remove error function

        let div = document.createElement('div');
        div.classList.add('top-row');
        div.innerText = key;
        button2.appendChild(div);

        li.appendChild(button2);
        li.appendChild(document.createElement('hr'));
        content.appendChild(li);
    })

    //skip if no errors are present
    if(list.length < 1) {
        return;
    }

    //append head to error list parent
    document.getElementById("accordion-group-errors").appendChild(head);
    document.getElementById('accordion-group-errors').appendChild(content);

    //setup accordion javascript
    initializeAccordion(head);
}

function saveCourse(course) {
    chrome.storage.local.set({
        [Course.deserialize(course).id]: course,
    })
}

async function showError(error) {
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    const response = await chrome.tabs.sendMessage(tab.id, {type: "SHOW-ERROR", url: error.htmlRef});
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

document.getElementById("add-error1").addEventListener("click" , (async () => {
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
    const url = await chrome.tabs.sendMessage(tab.id, {type: "URL"});

    let moduleItem = ModuleItem.deserialize(_course.fetchModuleItem(url.url.toString()));
    let module = Module.deserialize(_course.fetchModule(url.url.toString()));


    moduleItem.removeError(id);
    module.setModuleItem(moduleItem)
    _course.setModule(module);
    _course.errorCount--;

    saveCourse(_course.serialize());
    displayCoursePage();
}

document.getElementById("save").addEventListener("click", async () => {
    //get web url info (course & page id)
    const activeTab = await getActiveTabURL();
    const urlParameters = activeTab.url.split("courses")[1].split("/");
    const url = {
        courseId: urlParameters[1], 
        pageType: urlParameters[2], 
        pageTitle: urlParameters[3].split("?")[0],
        pageId: urlParameters[3].split("=")[1].replaceAll("#:~:text", "")
    };
    if(!activeTab.url.includes("instructure.com/courses/")) {
        return
    }
    console.log(JSON.stringify(document.getElementById("tinymce").innerHTML));
});

document.getElementById('fix-all').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    const response = await chrome.tabs.sendMessage(tab.id, {type: "AUDIT"});
});

document.getElementById('clear').addEventListener('click', () => {
    chrome.storage.local.clear();
})

document.getElementById('next-page').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    const response = await chrome.tabs.sendMessage(tab.id, {type: "NEXT"});
});

document.getElementById("course-gen").addEventListener("click", generateCourse.bind());

document.querySelectorAll(".prof-name").forEach((el) => {
    el.addEventListener('change', () => {
        if (_course != null && _course != undefined) {
            _course.professorName = el.value;
        }

        saveCourse(_course.serialize());
    })
})

async function pageSetup() {
    //display the correct containers
    document.getElementById('container3').classList.remove('no-display');
    if(!document.getElementById('container1').classList.contains('no display')) {
        document.getElementById('container1').classList.add('no-display');
    }
    if(!document.getElementById('container2').classList.contains('no display')) {
        document.getElementById('container2').classList.add('no-display');
    }
    if(!document.getElementById('container4').classList.contains('no display')) {
        document.getElementById('container4').classList.add('no-display');
    }

    // chrome.storage.local.clear();
    console.log(await chrome.storage.local.get());
    
    //grab url information
    const activeTab = await getActiveTabURL();
    urlParameters = activeTab.url.split("courses")[1].split("/");
    fullURL = activeTab.url;

    if(!exists(urlParameters)) {return;}//cancel out load in if parameters no retreived

    //check if on Canvas website and if loaded into a course
    if(!activeTab.url.includes("instructure.com/")) {
        if(!activeTab.url.includes(/[0-9]/.test(str))) {
            return;
        }
    }

    //hide "extension only available within canvas" msg
    document.getElementById("container3").classList.add('no-display');
    
    //check if course records exist
    await fetchCourse(urlParameters[1]).then((result) => {_course = result; })//hold onto course records

    //if course is nonexistant: display course generation button
    if (_course === null || _course === undefined) {
        document.getElementById("container2").classList.remove("no-display");
        return;
    }

    //if on modules page, display course information
    if(_course != null && _course != undefined && activeTab.url.includes("modules")) {
        displayCourse(_course);
        return;
    }

    //if course exits: display course page records
    document.getElementById("container1").classList.remove("no-display");

    displayCoursePage();

    let moduleItem = ModuleItem.deserialize(_course.fetchModuleItem(activeTab.url.toString()));
    let module = Module.deserialize(_course.fetchModule(activeTab.url.toString()));
    if(!moduleItem.checked) {
        moduleItem.checked = true;

        const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
        chrome.tabs.sendMessage(tab.id, { type: "AUDIT" }, function (response) {
            console.log(response);
            if (response != null) {
                if (JSON.parse(response).length > 0) {
                    let errors = JSON.parse(response);
                    console.log(errors);

                    errors.forEach((error) => {
                        moduleItem.addError(Page_Error.deserialize(error));
                    })
                }
            }

            console.log(moduleItem);
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
});

//setup page and extension on load
window.addEventListener("load", pageSetup());