(() => {
    let courseID = "";
    let profName = "";
    let courseTitle = "";
    let date = "";
    let reviewer = "Aaron Evans";
    let canvasLeftControls;

    chrome.runtime.onMessage.addListener((obj,sender, response) => {
        const {type, value, moduleItemId, pageTitle, pageType, courseId} = obj;

        console.log("message recieved");

        if (type === "NEW") {
            currentItem = moduleItemId;
            NewCoursePageLoaded(obj);
        }
    })

    const NewCoursePageLoaded = () => {

        //if add error button is missing, add it
        if(!document.getElementById("cae-addErrorBtn")) {
            const errorBtn = document.createElement("button");

            errorBtn.id = "cae-addErrorBtn";
            errorBtn.className = "menu-item " + "ic-app-header__menu-list-item"
            errorBtn.title = "click to add an accessibility error";
        
            canvasLeftControls = document.getElementsByClassName("ic-app-header__menu-list")[0];
            canvasLeftControls.appendChild(errorBtn);
            errorBtn.addEventListener("click");
        }

        //course selection dropdown is missing, add it

        //ic-app-header__menu-list
    }

    const addNewErrorEventHandler = () => {
        //open menu on add event

        //get html from highlighted text and 
        // input into new error 'form'

        
    }
})();

