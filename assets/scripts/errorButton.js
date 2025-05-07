import {getActiveTabURL} from "./utils.js"

//form inputs
const textLookUp = "#:~:text=";
let queryOptions = { active: true, currentWindow: true };

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
    let textLookUpKey;
    (async () => {
        const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
        const response = await chrome.tabs.sendMessage(tab.id, {type: "ADD-ERROR"});
        // do something with response here, not outside the function
        textLookUpKey = response.textLookUpKey;

        //adderror
        addError(textLookUpKey, url);

        //update error counter
        let count = parseInt(document.getElementById("error-counter").innerText);
        document.getElementById("error-counter").innerHTML = count + 1;
    })(); 
}));

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
    let e = new Page_Error(selected.innerHTML,selected.getAttribute("value"),selected.getAttribute("tooltip"),urlEnd,url.courseId,url.pageType,url.pageTitle, url.pageId);

    console.log(urlEnd);

    document.getElementById("errors").appendChild(createErrorElement(e));

    //save error to chrome tabs storage
    
    console.log(e.serialize());

    //find course

    //find page



    // chrome.storage.local.get([e.courseId + "-" + ], 
};

function createErrorElement(error) {
    let el = document.createElement('li');
    el.setAttribute("htmlRef", error.htmlRef);
    el.setAttribute("title", "Accessibility Error. Click to display error.");

    let btn = document.createElement('button');
    btn.classList.add("button1");
    btn.addEventListener("click", () => {//show error function
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

    return el;
}

function onError(error) {
    console.error(`Error: ${error}`);
}

class Page_Error {
    constructor(name, desc, tooltip,htmlRef,courseId,
        pageType,pageTitle, pageId) 
    {
      this.name = name;
      this.desc = desc;
      this.tooltip = tooltip;
      this.htmlRef = htmlRef;
      this.courseId = courseId;
      this.pageType = pageType;
      this.pageTitle = pageTitle;
      this.pageId = pageId;
    }
  
    serialize() {
      return JSON.stringify(this);
    }
  
    static deserialize(serialized) {
      const obj = JSON.parse(serialized);
      return new Page_Error(obj.name, obj.desc, obj.tooltip,
        obj.htmlRef, obj.courseId, obj.pageType, obj.pageTitle);
    }
}

function LoadErrors() {

}

function SaveError() {

}