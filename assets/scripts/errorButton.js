import {getActiveTabURL} from "./utils.js"

//form inputs
const textLookUp = "#:~:text=";
let queryOptions = { active: true, currentWindow: true };

class Course {   

    constructor(courseId, modules = new Array(), count = 0) {
        this.modules = modules;
        this.count = count;
        this.id = courseId;
    }

    addModule(module) {//add new module
        this.count = this.modules.push(module);
        console.log(this.modules);
        return this.modules[this.count - 1];
    }

    getModule(moduleId) {
        this.modules.forEach((mod) => {
            if(mod.id === moduleId) {
                return mod;
            }
        })

        return -1;
    }

    serialize() {
        return JSON.stringify(this);
    }

    static deserialize(serialized) {
        const obj = JSON.parse(serialized);
        return new Course(obj.id, obj.modules, obj.count);
    }
}

class Module {

    constructor(number, moduleItems = new Array(), count = 0) {
        this.moduleItems = moduleItems;
        this.count = count;
        this.id = number;
    }

    addItem(item) {
        this.count = this.moduleItems.push(item);
        return this.moduleItems[this.count - 1];
    }

    serialize() {
        return JSON.stringify(this);
    }

    static deserialize(serialized) {
        const obj = JSON.parse(serialized);
        return new Module(obj.id, obj.moduleItems, obj.count);
    }
}

class ModuleItem {

    constructor(id, type, title, count = 0, errors = {}) {
        this.errors = errors;
        this.count = count;
        this.id = id;
        this.title = title;
        this.type = type;
    }

    addError(e) {
        let tempJSON = {};
        //if errors exist
        if(this.count > 0) {
            tempJSON = JSON.parse(this.errors);
        }

        //if error exists on page already
        if(tempJSON.hasOwnProperty(e.name)) {
            tempJSON[e.name].push(e.serialize());
        }
        else {//if errror type doesn't exist
            tempJSON[e.name] = [];
            tempJSON[e.name].push(e.serialize());
        }
        
        this.errors = JSON.stringify(tempJSON);
        this.count++;
    }

    errorCountAll() {
        return this.count;
    }

    errorCountSingle(name) {
        const tempJSON = JSON.parse(this.errors);

        //if specific errors exist
        if(name in tempJSON) {
            return tempJSON[name].length;
        } else {//if error type not on page
            return 0;
        }
    }

    errorsList() {
        return this.errors;
    }

    serialize() {
        return JSON.stringify(this);
    }

    static deserialize(serialized) {
        const obj = JSON.parse(serialized);
        return new ModuleItem(obj.id, obj.type, obj.title, obj.count, obj.errors);
    }
}

class Page_Error {
    constructor(name, desc, tooltip,htmlRef) 
    {
      this.name = name;
      this.desc = desc;
      this.tooltip = tooltip;
      this.htmlRef = htmlRef;
    }
  
    serialize() {
      return JSON.stringify(this);
    }
  
    static deserialize(serialized) {
      const obj = JSON.parse(serialized);
      return new Page_Error(obj.name, obj.desc, obj.tooltip, obj.htmlRef);
    }
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
    selected.getAttribute("tooltip"),urlEnd);

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

    let btn = document.createElement('button');
    btn.classList.add("button1");
    btn.addEventListener("click", () => {//add show error function
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            var currentUrl = tabs[0].url;
            if(currentUrl.includes("#:~:text=")) {
                currentUrl = currentUrl.split("#:~:text=")[0];
                console.log("current url has lookup, must erase");
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

    el2 = document.createElement('div');
    el2.classList.add("desc");
    el2.innerText = error.desc;
    btn.appendChild(el2);

    el2 = document.createElement('button');
    el2.classList.add("delete");
    el2.setAttribute("aria-label", "delete-error");
    let el3 = document.createElement('img');
    el3.setAttribute('alt', "");
    el3.setAttribute("src", "assets/images/trash.png");
    el2.appendChild(el3);
    btn.appendChild(el2);

    el3 = document.createElement('div');
    el3.classList.add('tooltip');
    el3.setAttribute("aria-live", "polite");
    el3.innerText = error.tooltip;

    el.appendChild(el3);

    document.getElementById("errors").appendChild(el);
}

function SaveError(_e, saveInfo) {
    var course;

    try {
        chrome.storage.local.get([_e.courseId], (data) => {
            
            if (data[_e.courseId]) {//if course data already exists
                console.log("course found")

                course = Course.deserialize(course);
            }
            else {//else if course data doesn't exist
                console.log("course needs to be created");

                course = CreateNewCourseData(_e, saveInfo);
                chrome.storage.local.set({
                    [course.id]: course.serialize(),
                })
            }
        });
    }
    catch (e) {
        console.log("course needs to be created");

        course = CreateNewCourseData(_e, saveInfo);
        chrome.storage.local.set({
            [course.id]: course.serialize(),
        })
    };

    console.log(course);
}

function AddErrorToCourse(course) {

}

function CreateNewCourseData(e, saveInfo) {
    //create new course
    let course = new Course(saveInfo.courseId);

    console.log(new Module(saveInfo.moduleId));

    //create new module
    let module = course.addModule(new Module(saveInfo.moduleId));

    //create new module item
    let moduleItem = module.addItem(new ModuleItem(saveInfo.moduleItemId,saveInfo.moduleItemType, saveInfo.pageTitle.replaceAll("-", " ")));
    
    console.log(moduleItem);

    //create new error
    moduleItem.addError(e);

    return course;
}

function LoadErrors() {

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
        pageId: urlParameters[3].split("=")[1]
    };
    if(!activeTab.url.includes("instructure.com/courses/")) {
        return
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



