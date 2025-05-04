(() => {
    let courseID = "";
    let profName = "";
    let courseTitle = "";
    let reviewer = "Aaron Evans";
    let canvasLeftControls;
    let currentErrors;

    // error types for dropdown
    const errorList = ("All Caps:Extensive all caps are present:When all caps are present, screen readers state them like acronyms. Consider an entire sentence in all caps being stated LETTER BY LETTER.$Abbreviation:Difficult abbreviation is present:Screen readers state abbreviations literally. Ch is not chapter, a screen reader says (chuh). Some abreviations like (gov), still work.$Language:Language, other than english, is present without proper code:Language must be programmatically determinable.$List:Handmade list is present. Should be made with list tool:Lists should only be made with a list tool, so assistive technologies can traverse them in helpful ways for students.$Link(URL):Exposed link is present:When links are exposed, they are read letter by letter, instead of word by word.$Link(long):Link text can be shortened to be more concise:Assistive Technology users can have a list of links read out loud. They should be able to know where the link leads without surrounding context.$Link(non-descriptive):Link text is not descriptive:Assistive Technology users can have a list of links read out loud. They should be able to know where the link leads without surrounding context.$Heading(skipped):Skipped heading is present:Assistive Technology users rely heavily on headings, they should be in order.$Heading(accidental):Regular sentence is tagged as a heading:Headings should reflect information that is below them.$Heading(list):Headings are styled as a hand made list:Lists should only be made with a list tool, so assistive technologies can traverse them in helpful ways for students.$Heading(first level):A second Heading level 1 is present:There can only be one Heading level 1 on a webpage$PDF Present:[For Reviewer to Make Accessible]:PDFs need to be made accessible$Word Doc:[For Reviewer to Make Accessible]:Word docs need to be checked and made accessible$Powerpoint:[For Reviewer to Make Accessible]:Powerpoint docs need to be checked and made accessible$Doc:[For Reviewer to Make Accessible]:Docs need to be checked and made accessible$Image Alt-Text(insufficient):Image alt text is insufficient:Image alternate text needs to accurately describe the image based on context needed$Image Alt-Text(long):Image alt text is too long:Image alt text that is too long can prove to be more harmful than useful$Underline:Underlined text that is not a link is present:Using underline text for things outside of links can be confusing. It's best to keep the standard to links only$Table(headers):Table is missing headers:Headers are important for Assistive Technologies to be able to traverse them properly$Table(title):Table is missing a title or description:A title or description is required for a screen reader to be able to describe its purpose without the user having to go through the whole table$Invisible:Invisible element is present [For Aaron]:Assistive Technologies will discover the hidden elements, desipte them being invisible$Image(decorative):A decorative image has alt text:Additional alt text that isn't necessary can be fun. But too much, can prove to be more confusing and harmful than fun.$Blank line:Blank line(s) present:Screen readers detect blank lines (the empty space that happens when we hit 'enter'). When an empty one is detected, they'll read it outloud anyways, confusing the user.$Video(closed captioning):Video closed captioning is insufficient:Videos need proper closed captioning for users who are hard of hearing, or rely on them to help with understanding.$List(multi):A multi indented list is present:Multi-indented lists are read outloud. If indents are empty, it can be confusing for the user$Color Contrast:The noted text/image/video has insufficient color contrast:Text/images/videos need sufficient color contrast to be easily visible$Color as Meaning:Color as meaning is used:Color as meaning should never be the sole way to convey information. This is difficult for users who have trouble seeing color.$Link(invisible):Inivisble link is present:Invisible links are still detected by Assistive Technologies and should be removed.$Text Size:Text size is less that 10pt:The minimum requirement for text size is 10pt$Link(broken):Broken link is present:Broken links hinder proper navigation.$Audio only:There is only an audio present without transcript: all audio needs a proper transcript if information is conveyed.$Link(redundant):Redundant link is present:Multiple links to the same place can prove to be harmful and confusing.$Image Alt-Text(redundant):Image alt text is redundant compared to surrounding text: Image alt text should be unique to text outside.$").split("$");


    console.log("add listener")

    chrome.runtime.onMessage.addListener((obj,sender, response) => {
        const {type, value, moduleItemId, pageTitle, pageType, courseId} = obj;
        console.log("we in here");
        
        if (type === "NEW") {
            currentItem = moduleItemId;
            NewCoursePageLoaded(obj);
        }


        let doc = document.getElementById("application");
        if (doc) {
            doc.addEventListener("mouseup", () => {
                var selected = getSelection();
                var range = selected.getRangeAt(0);

                console.log(range);
                if (selected.toString().length > 1) {
                    // var newNode = document.createElement("span");
                    // newNode.setAttribute("class", "red");
                    // range.surroundContents(newNode);
                }
                // selected.removeAllRanges();                
            });
        }

        
        //display accessibility elements for aiding visual review
        let styleEl = document.createElement('style');
        styleEl.type = 'text/css';
        styleEl.innerText = 'p:hover,h1:hover,h2:hover,h3:hover,h4:hover,h5:hover,h6:hover { background-color: rgb(225, 225, 225) } .red {background-color: red} .error-blank-line {background-color: yellow}';
        document.head.appendChild(styleEl);
        
        //add cursor console for adding errors
        let consoleEl = document.createElement('style');
        consoleEl.innerText = 'p:hover,h1:hover,h2:hover,h3:hover,h4:hover,h5:hover,h6:hover { background-color: rgb(225, 225, 225) } .red {background-color: red} .error-blank-line {background-color: yellow}';
        document.head.appendChild(consoleEl);

        //look for empty p tags and mark them as error
        let pTags = document.getElementById("content").querySelectorAll('p');
        pTags.forEach((el) => {
            if(el.innerHTML === "&nbsp;") {
                el.classList.add("error-blank-line")
            }
        })

        //look for all caps and mark them as error
    })

    const InitializeCourseSave = (courseID) => {
        //
    }

    const NewCoursePageLoaded = (obj) => {
        //if "add-error" button is missing, add it
        if(!document.getElementById("cae-addErrorBtn")) {
            const errorBtn = document.createElement("li");

            errorBtn.id = "cae-addErrorBtn";
            errorBtn.className = "menu-item " + "ic-app-header__menu-list-item"
            errorBtn.title = "click to add an accessibility error";
            errorBtn.appendChild(document.createElement("button"));
        
            canvasLeftControls = document.getElementsByClassName("ic-app-header__menu-list")[0];
            canvasLeftControls.appendChild(errorBtn);
        }

        //save attributes
        courseID = obj.courseId;

        //add 'text highlighted' event
        // document.addEventListener('mouseup', () => {
        //     //if text is highlighted
        //     const selection = window.getSelection();

        //     if(selection.length < 0) {return;}

        //     document.getElementById("new-error-desc").value = selection.toString();
        // })
    }

    const addNewErrorEventHandler = () => {
        let errorElements = document.getElementsByClassName("combo-option");
        let selected;
        errorElements.forEach((el) => {
            if(el.getAttribute("aria-selected") === "true") {
                selected = el;
                console.log(el);
            }
        });

        //open menu on add event
        const newError = {
            courseID: courseId,
            name: selected.innerHTML,
            desc: selected.getAttribute("value"),
            tooltip: selected.getAttribute("tooltip"),
            htmlRef: document.getElementById("new-error-desc").value
        }
        console.log(newError);

        //check storage
        chrome.storage.sync.set({
            [currentPage]: JSON.stringify([...currentErrors, newError])
        });

        //get html from highlighted text and 
        // input into new error 'form'

        
    }

    const isTextHighlighted = () => {
        const selection = window.getSelection();
        return selection.toString().length > 0;
    }

    const getSelection = () => {
        var seltxt = '';
         if (window.getSelection) { 
             seltxt = window.getSelection(); 
         } else if (document.getSelection) { 
             seltxt = document.getSelection(); 
         } else if (document.selection) { 
             seltxt = document.selection.createRange().text; 
         }
        else return;
        return seltxt;
    }
})();

