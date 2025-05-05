//form inputs
const textLookUp = "#:~:text=";
let queryOptions = { active: true, currentWindow: true };

document.getElementById("add-error1").addEventListener("click" , (() => {
    //skip if error type is not selected
    if(document.getElementById("error-type").getAttribute("value").length < 2) {
        alert("no Error type selected");
        return;
    }

    chrome.tabs.query(queryOptions, function(tabs) {
        chrome.tabs.query(queryOptions, ([tab]) => {
            chrome.tabs.sendMessage( tab.id, {
                type: "ADD-ERROR",
            })
            .then((response) => {
                console.log(response);
            });
        })
    })
    

    return;

    browser.tabs
      .query({
        currentWindow: true,
        active: true,
      })
      .then(sendMessageToTabs)
      .catch(onError);
}));

function addError() {
    //grab error information
    let errorElements = document.getElementsByClassName("combo-option");
    let selected;
    for(let i = 0; i < errorElements.length; i++) {
        if(errorElements[i].getAttribute("aria-selected") === "true") {
            selected = errorElements[i];
            break;
        }
    }

    let ref;

    //get highlighted text ref
    for (const tab of tabs) {
        browser.tabs
            .sendMessage(tab.id, {
                type: "ADD-ERROR",
            })
            .then((response) => {
                ref = response.response;
            })
            .catch(onError);
    }

    //create error
    const newError = {
        //add course id
        name: selected.innerHTML,
        desc: selected.getAttribute("value"),
        tooltip: selected.getAttribute("tooltip"),
        htmlRef: ref,
    }

    document.getElementById("errors").appendChild(createErrorElement(newError));
};

function createErrorElement(error) {
    let el = document.createElement('li');
    el.setAttribute("htmlRef", error.htmlRef);
    el.setAttribute("title", "Accessibility Error. Click to display error.");

    let btn = document.createElement('button');
    btn.classList.add("button1");
    btn.addEventListener("click", showError());
    el.appendChild(btn);

    let el2 = document.createElement('div');
    el2.classList.add("name");
    el2.innerText = error.name;
    btn.appendChild(el2);

    el2 = document.createElement('div');
    el2.classList.add("desc");
    el2.innerText = error.desc;

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

function showError(error, element) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        var currentUrl = tabs[0].url;
        console.log(currentUrl);
        if(currentUrl.includes(textLookUp)) {
            currentUrl = currentUrl.split("#")[0];
            console.log("current url has lookup, must erase");
        }
        let text = currentUrl + textLookUp + button.parentElement.getAttribute("htmlRef");

        chrome.tabs.query(queryOptions, ([tab]) => {
            chrome.tabs.sendMessage( tab.id, {
                type: "SHOW-ERROR",
                url: text,
            })
        });
    });
};

function onError(error) {
    console.error(`Error: ${error}`);
}