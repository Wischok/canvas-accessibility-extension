import {getActiveTabURL} from "./utils.js";
import { Course, Module, ModuleItem, Page_Error } from "./classes.js";

//declare values
const textLookUp = "#:~:text=";
let queryOptions = { active: true, currentWindow: true };
let urlParameters = new Array();

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

    //create course object with course Id
    let _course = new Course(urlParameters[1]);

    //grab list of module elements
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    const moduleElements = await chrome.tabs.sendMessage(tab.id, {type: "NEW-PAGE"});
    console.log(JSON.parse(moduleElements));
}

function addError(urlEnd, url) {
    //grab error information
    let errorElements = document.getElementsByClassName("combo-option");
    let selected;
    for(let i = 0; i < errorElements.length; i++) {
        if(errorElements[i].getAttribute("aria-selected") === "true") {
            selected = errorElements[i];
            break;
        }
    }

    //create error
    let e = new Page_Error(selected.innerHTML,selected.getAttribute("value"),
    selected.getAttribute("tooltip"),urlEnd, (url.courseId + url.pageId + uniqueId()));

    let tempId = document.getElementById('module-input').value;
    const saveInfo = {
        courseId: url.courseId,
        pageTitle: url.pageTitle,
        moduleItemId: url.pageId,
        moduleItemType: url.pageType,
        moduleId: tempId,
    }

    //add error to DOM
    addErrorElementToDOM(e);

    //save error to chrome tabs storage local
    SaveError(e, saveInfo);
};

function addErrorElementToDOM(error) {
    let el = document.createElement('li');
    el.setAttribute("htmlRef", error.htmlRef);
    el.setAttribute("title", "Accessibility Error. Click to display error.");
    el.setAttribute("id", error.id);

    let btn = document.createElement('button');
    btn.classList.add("button1");
    btn.addEventListener("click", () => {//add show error function
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            var currentUrl = tabs[0].url;
            if(currentUrl.includes("#:~:text=")) {
                currentUrl = currentUrl.split("#:~:text=")[0];
            }
            let text = currentUrl + "#:~:text=" + error.htmlRef;
    
            chrome.tabs.query(queryOptions, ([tab]) => {
                chrome.tabs.sendMessage( tab.id, {
                    type: "SHOW-ERROR",
                    url: text,
                })
            });
        });
    });
    el.appendChild(btn);

    let el2 = document.createElement('div');
    el2.classList.add("name");
    el2.innerText = error.name;
    btn.appendChild(el2);

    el2 = document.createElement('button');
    el2.classList.add("delete");
    el2.setAttribute("aria-label", "delete-error");
    let el3 = document.createElement('img');
    el3.setAttribute('alt', "");
    el3.setAttribute("src", "assets/images/trash.png");
    el2.appendChild(el3);
    el2.addEventListener("click", removeError.bind(error.id));
    btn.appendChild(el2);

    el3 = document.createElement('div');
    el3.classList.add('tooltip');
    el3.setAttribute("aria-live", "polite");
    el3.innerText = error.tooltip;

    el.appendChild(el3);

    document.getElementById("errors").appendChild(el);
}

async function SaveError(_e, saveInfo) {
    let course;
    await fetchCourse(saveInfo.courseId).then((result) => {
        if(result === null || result === undefined) {
            console.log("course needs to be created");
            course = CreateNewCourseData(_e, saveInfo);
        }
        else {
            course = result;
        }

        course.addError(_e, saveInfo);
        chrome.storage.local.set({
            [course.id]: course.serialize(),
        })
    });

    return course;
}

async function removeError(id) {
    //grab url information
    const activeTab = await getActiveTabURL();
    const urlParameters = activeTab.url.split("courses")[1].split("/");
    const url = {
        courseId: urlParameters[1], 
        pageType: urlParameters[2], 
        pageTitle: urlParameters[3].split("?")[0],
        pageId: urlParameters[3].split("=")[1].replaceAll("#:~:text", "")
    };
    
    let tempId = document.getElementById('module-input').value;
    const saveInfo = {
        courseId: url.courseId,
        pageTitle: url.pageTitle,
        moduleItemId: url.pageId,
        moduleItemType: url.pageType,
        moduleId: tempId,
    }

    //remove error from course
    await fetchCourse(url.courseId).then((result) => {
        if (result === null || result === undefined) {
            return;
        } else {
            result.removeError(id, saveInfo);
            chrome.storage.local.set({
                [url.courseId]: result.serialize(),
            })
        }
        let num = parseInt(document.getElementById("error-counter").innerText)
        document.getElementById("error-counter").innerText = num - 1;
    })
}

function fetchCourse(id) {
    return new Promise ((resolve) => {
        chrome.storage.local.get([id], obj => {
            resolve(obj[id] ? Course.deserialize(obj[id]) : null);
        })
    })
}

function uniqueId() {
    const dateString = Date.now().toString(36);
    const randomness = Math.random().toString(36).substr(2);
    return dateString + randomness;
};

function CreateNewCourseData(e, saveInfo) {
    //create new course
    let course = new Course(saveInfo.courseId);

    //create new module
    let module = Module.deserialize(course.addModule(new Module(saveInfo.moduleId)));

    //create new module item
    let moduleItem = ModuleItem.deserialize(module.addItem(new ModuleItem(saveInfo.moduleId, saveInfo.moduleItemId,saveInfo.moduleItemType, saveInfo.pageTitle.replaceAll("-", " "))));

    //create new error
    moduleItem.addError(e);

    return course;
}

function fetchErrors(course, moduleItemId) {
    let result;

    Object.keys(course.modules).forEach(function (key_i) {
        let moduleItems = Module.deserialize(course.modules[key_i]).moduleItems;
        Object.keys(moduleItems).forEach(function (key_k) {
            if(moduleItemId === key_k) {
                result = ModuleItem.deserialize(moduleItems[key_k]).errors;
            }
        });
    });

    return result;
}

document.getElementById("add-error1").addEventListener("click" , (async () => {
    //skip if error type is not selected
    if(document.getElementById("error-type").getAttribute("value").length < 2) {
        alert("no Error type selected");
        return;
    }

    if(document.getElementById('module-input').value < 0 ) {
        alert("no module # selected");
        return;
    }

    //grab url information
    const activeTab = await getActiveTabURL();
    const urlParameters = activeTab.url.split("courses")[1].split("/");
    const url = {
        courseId: urlParameters[1], 
        pageType: urlParameters[2], 
        pageTitle: urlParameters[3].split("?")[0],
        pageId: urlParameters[3].split("=")[1].replaceAll("#:~:text", "")
    };
    if(!activeTab.url.includes("instructure.com/courses/")) {
        return;
    }

    //grab textlookup key for highlighted text
    (async () => {
        const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
        const response = await chrome.tabs.sendMessage(tab.id, {type: "ADD-ERROR"});
        // do something with response here, not outside the function

        //adderror
        addError(response.textLookUpKey, url);

        //update error counter
        let count = parseInt(document.getElementById("error-counter").innerText);
        document.getElementById("error-counter").innerHTML = count + 1;
    })(); 
}));

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

    chrome.storage.local.set({
        [url.courseId + url.pageId]: JSON.stringify(document.getElementById("tinymce").innerHTML)
    })

    console.log(JSON.stringify(document.getElementById("tinymce").innerHTML));
});

document.getElementById("course-gen").addEventListener("click", generateCourse.bind());

window.addEventListener("load", async () => {
    chrome.storage.local.clear();
    console.log(await chrome.storage.local.get());
    
    //grab url information
    const activeTab = await getActiveTabURL();
    urlParameters = activeTab.url.split("courses")[1].split("/");
    console.log(urlParameters);

    if(!exists(urlParameters)) {return;}//cancel out load in if parameters no retreived

    //check if on Canvas website and if loaded into a course
    if(!activeTab.url.includes("instructure.com/")) {
        if(!activeTab.url.includes(/[0-9]/.test(str))) {
            return;
        }
    }

    //hide "extension only available within canvas" msg
    document.getElementById("container3").classList.add('no-display');
    
    let course;//canvas course records
    //check if course records exist
    await fetchCourse(urlParameters[1]).then((result) => {course = result; })

    //if nonexistant: display course generation button
    if (course === null || course === undefined) {
        document.getElementById("container2").classList.remove("no-display");
        return;
    }

    //if exits: display course records
    document.getElementById("container1").classList.remove("no-display");


    //display errors
    // await fetchCourse(url.courseId).then((result) => {
    //     let count = 0;
    //     if (result === null || result === undefined) {
    //         return;
    //     } else {
    //         let errors = fetchErrors(result, url.pageId);
    //         Object.keys(errors).forEach(function (key) {
    //             errors[key].forEach((error) => {
    //                 error = Page_Error.deserialize(error);
    //                 addErrorElementToDOM(error);
    //                 count++;
    //             })
    //         });
    //     }
    //     document.getElementById("error-counter").innerText = count;
    // })
})