(() => {
    let _errors = new Array();
    const textLookUp = "#:~:text=";

    class Course {   

        constructor(courseId, version, title, modules = {}, moduleCount = 0, errorCount = 0, professorName = "") {
            this.modules = modules;
            this.moduleCount = moduleCount;
            this.id = courseId;
            this.errorCount = errorCount;
            this.version = version;
            this.title = title
            this.professorName = professorName
        }
    
        addModule(module) {//add new module
            this.moduleCount++;
            this.modules[module.id] = module.serialize();
            return this.modules[module.id];
        }
    
        hasModule(moduleId) {
            this.modules.forEach((mod) => {
                let m = Module.deserialize(mod);
                if(m.id === moduleId) {
                    return m;
                }
            })
    
            return -1;
        }
    
        setProfName(name) {this.professorName = name; }
    
        modulesCheckedCount() {
            let count = 0;
            Object.keys(this.modules).forEach((key) => {
                let m = Module.deserialize(this.modules[key]);
    
                if(m.checked()) {
                    count++;
                }
            })
    
            return count;
        }
    
        setModule(module) {
            this.modules[module.id] = module.serialize();
        }
    
        addError(e, pageId) {
            //returns desired module (or a new copy if it doesn't exist) as Module Item
            Object.keys(this.modules).forEach((key) => {
                let module = Module.deserialize(this.modules[key]);
    
                Object.keys(module.moduleItems).forEach((_key) => {
                    let item = ModuleItem.deserialize(module.moduleItems[_key]);
    
                    if(item.id = pageId) {
                        item.addError(e);
                        module.moduleItems[_key] = item.serialize();
                        this.modules[key] = module.serialize();
                    }
                })
            });
            this.totalErrors += 1;
            console.log(this.totalErrors);
        }
    
        removeError(errorId, saveInfo) {
            //returns desired module (or a new copy if it doesn't exist) as Module Item
            _module.removeError(errorId, saveInfo);
            this.setModule(_module);
            this.totalErrors--;
        }
    
        fetchModuleItem(url) {
            let moduleItem;
            Object.keys(this.modules).forEach((key) => {
                if(moduleItem != null && moduleItem != undefined) {return moduleItem; }
                let m = Module.deserialize(this.modules[key]);
    
                Object.keys(m.moduleItems).forEach((_key) => {
                    if(moduleItem != null && moduleItem != undefined) {return moduleItem; }
                    let i = ModuleItem.deserialize(m.moduleItems[_key]);
    
                    //check by module item id
                    if(url.includes(i.id)) {
                        moduleItem = i;
                    }
    
                    //check by secondary module item id (url path or 6-7 digit code - depending on page type)
                    if(url.includes(i.id2)) {
                        moduleItem = i;
                    }
                })
            })
    
            return moduleItem.serialize();
        }
    
        fetchModule(url) {
            let module;
            Object.keys(this.modules).forEach((key) => {
                if(module != null && module != undefined) {return module; }
                let m = Module.deserialize(this.modules[key]);
    
                Object.keys(m.moduleItems).forEach((_key) => {
                    if(module != null && module != undefined) {return module; }
                    let i = ModuleItem.deserialize(m.moduleItems[_key]);
    
                    //check by module item id
                    if(url.includes(i.id)) {
                        module = m;
                    }
    
                    //check by secondary module item id (url path or 6-7 digit code - depending on page type)
                    if(url.includes(i.id2)) {
                        module = m;
                    }
                })
            })
    
            return module.serialize();
        }
    
        serialize() {//serialize course for JSON
            return JSON.stringify(this);
        }
    
        static deserialize(serialized) {
            const obj = JSON.parse(serialized);
            return new Course(obj.id, obj.version, obj.title, obj.modules, obj.moduleCount, obj.errorCount, obj.professorName);
        }
    }
    class Module {
    
        constructor(number, title, published = true, moduleItems = {}, count = 0) {
            this.moduleItems = moduleItems;
            this.count = count;
            this.id = number;
            this.errorCount;
            this.title = title;
            this.published = published;
        }
    
        addItem(item) {
            this.count++;
            this.moduleItems[item.id] = item.serialize();
            return this.moduleItems[item.id];
        }
    
        addError(e, saveInfo) {
            let item = this.getModuleItem(saveInfo);
            item.addError(e)
            this.setModuleItem(item);
        }
    
        removeError(errorId, saveInfo) {
            let item = this.getModuleItem(saveInfo);
            item.removeError(errorId)
            this.setModuleItem(item);
        }
    
        getModuleItem(saveInfo) {
            let _item;
    
            //check if module Item already created
            if(this.moduleItemExists(saveInfo.moduleItemId)) {
                _item = this.moduleItems[saveInfo.moduleItemId];
            }
    
            if(_item != null && _item != undefined) {return ModuleItem.deserialize(_item); }
    
            //recursion | return new module if one not found
            this.moduleItems[saveInfo.moduleItemId] = new ModuleItem(saveInfo.moduleId, saveInfo.moduleItemId, saveInfo.pageType, saveInfo.pageTitle).serialize();
            return this.getModuleItem(saveInfo);
        }
    
        moduleItemExists(moduleItemId) {
            let condition = false;
            Object.keys(this.moduleItems).forEach(function(key) {
                if(moduleItemId === key) {
                    condition = true;
                    return condition;
                }
            });
    
            return condition;
        }
    
        checked() {
            if (this.count < 1) { return false; }
    
            let modules = this.moduleItems;
            Object.keys(this.moduleItems).forEach(function (key) {
                let item = ModuleItem.deserialize(modules[key]);
                if (item.checked === false) {
                    return false;
                }
            })
    
            return true;
        }
    
        setModuleItem(moduleItem) {
            this.moduleItems[moduleItem.id] = moduleItem.serialize();
        }
    
        serialize() {
            return JSON.stringify(this);
        }
    
        static deserialize(serialized) {
            const obj = JSON.parse(serialized);
            return new Module(obj.id, obj.title, obj.published, obj.moduleItems, obj.count);
        }
    }
    class ModuleItem {
    
        constructor(id, type, title, url, id2 = null, count = 0, errors = {}, checked = false) {
            this.errors = errors;
            this.count = count;
            this.id = id;
            this.url = url;
            this.title = title;
            this.type = type;
            this.checked = checked;
            this.id2 = id2;
        }
    
        addError(e) {
            //grab error or make a new one if needed
            if(this.errorArrayExists(e)) {
                this.errors[e.name].push(e.serialize());
            }
            else {
                this.errors[e.name] = [];
                this.errors[e.name].push(e.serialize());
            }
            this.count++;
        }
    
        removeError(errorId) {
            Object.keys(this.errors).forEach(function(key) {
                let index = 0;
                this.errors[key].forEach((error) => {
                    let _e = Page_Error.deserialize(error);
    
                    if(_e.id === errorId) {
                        this.errors[key].splice(index, 1);
                        return;
                    }
                    index++;
                })
            });
            this.count--;
        }
    
        findError(id) {
            let _key, _index;
            Object.keys(this.errors).forEach(function(key) {
                let index= 0;
                this.errors[key].forEach((error) => {
                    let e = Page_Error.deserialize(error);
                    if(error.id === id) {
                        _key = key;
                        _index = index;
                    }
                    index++;
                })
            });
    
            const respone = {
                index: _index,
                key: _key,
            }
    
            return respone;
        }
    
        errorArrayExists(e) {
            let condition = false;
            Object.keys(this.errors).forEach(function(key) {
                if(e.name === key) {
                    condition = true;
                    return condition;
                }
            });
    
            return condition;
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
            return new ModuleItem(obj.id, obj.type, obj.title, obj.url, obj.id2, obj.count, obj.errors, obj.checked);
        }
    }
    class Page_Error {
        constructor(name, htmlRef, required = false) 
        {
          this.name = name;
          this.htmlRef = htmlRef;
          this.required = required
        }
      
        serialize() {
          return JSON.stringify(this);
        }
      
        static deserialize(serialized) {
          const obj = JSON.parse(serialized);
          return new Page_Error(obj.name, obj.htmlRef, obj.required);
        }
    }

    //audit code
    const regexAbbreviation = /((?<![a-z])[a-z]{1,3}(\.|\/)([a-z]{1,1})?(\.|\/)?)|\bch\b|\bp\b|\bpp\b/idgm;
    const regexListNo = /^\d{1,2}\.\s{1,1}/gmd;
    const regexListHyphen = /^[-]{1,2}\s{1,1}/gmd;
    const regexAllCaps = /\b[A-Z\s\'\"\:]{7,}\b/gmd;
    const regexImageInsufficient = /\b(JPEG|GIF|PNG|TIFF|BMP|JPG)\b/igm;
    const regexLinkURL = /\b(www|https)\b/igm;
    const regexDocument = /\b[\.]{1,1}((pdf|docx|doc|docm|dotx|dotm)[^com]?$)\b/i;//check a tags for href strings and compare them to rg
    const regexTextSize = /\bfont-size[\:\s]{1,}[^\d]\d{1,1}pt\b/d;
    const regexUnderline = /\btext-decoration[\:\s]{1,}underline\b/d;
    //underline: check each span if has style attribute and if it has underline
    //alt text long: check alt text image string length
    //heading skipped: get a list of headings and check their numerical order
    //link invisible: check each a element if it has inner text or not
    //list muli: check if it has child elements of list 1 down and if it has child elements of ul or ol
    //table title: check if table has title element

    /* Audit Functions */
    //audit a list of elements' innertext against an abbreviation regex
    const auditRegexInstaces = (elements, regex) => {
        let foundIssues = new Array();

        //iterate through elements
        elements.forEach((el) => {
            let lastIndex = 0;
            let str = "";

            //record information of each found error
            while (match = regex.exec(el.innerText)) {
                //record error text
                foundIssues.push(buildLookUpText(match, regex.lastIndex));

                str += match.input.substr(lastIndex, match.index - lastIndex);
                str += "$SPANTOCHANGE1$";
                str += match.input.substr(match.index, regex.lastIndex - match.index);
                str += "$SPANTOCHANGE2$";

                lastIndex = regex.lastIndex;
            }

            if(lastIndex != 0) {
                str += el.innerText.substr(lastIndex, (el.innerText.length - lastIndex) - 1);
                el.innerText = str;
            }
        });

        //return errors if found, otherwise return an error (-1) value
        return foundIssues.length > 0 ? obj = foundIssues: -1;
    }

    const buildLookUpText = (match, lastIndex) => {
        let index = match.index;
        let start, end;

        //if givin highlight is large enough, build a standard text search string
        if (match[0].length > 14) {
            while (index > 0) {
                let temp = index - 1;
                if (match.input[temp] === " ") {
                    start = index;
                    break;
                }

                if (index < -9999) {
                    alert("infinite loop");
                    return;
                }
                index--;
            }
            index = lastIndex;
            while (index < match.input.length - 1) {
                let temp = index + 1;
                if (match.input[temp] === " ") {
                    end = index;
                    break;
                }

                if (index > 9999) {
                    alert("infinite loop");
                    return;
                }

                index++;
            }

            return match.input.substr(start, end - start).replaceAll(" ", "%20");
        }

        if((match.index - 10) < 0) {
            start = 0;
        }
        else {
            index -= 10;
            while (index > 0) {
                let temp = index - 1;

                if (match.input[temp] === " ") {
                    start = index;
                    break;
                }

                if (index < -9999) {
                    alert("infinite loop");
                    return;
                }
                index--;
            }
        }
        
        if((lastIndex + 10) > (match.input.length - 1)) {
            end = match.input.length - 1;
        }
        else {
            index = lastIndex + 10;
            while (index < match.input.length - 1) {
                let temp = index + 1;
                if (match.input[temp] === " ") {
                    end = temp;
                    break;
                }

                if (index > 9999) {
                    alert("infinite loop");
                    return;
                }

                index++;
            }
        }

        let str = "";
        str += match.input.substr(start, match.index - start);
        str += "-,";
        str += match[0];
        str += ",-";
        str += match.input.substr(lastIndex, end - lastIndex);
        return str.replaceAll(" ", "%20");
    }

    const auditRegexElements = (elements, regex, attribute) => {
        let foundIssues = new Array();

        //iterate through instances and look for underline
        elements.forEach((el) => {
            if(el.hasAttribute(attribute)) {
                if(el.getAttribute(attribute).match(regex)) {
                    foundIssues.push(el);
                }
            }
        });

        //if issues found, return found issues or return -1 if none found
        return foundIssues.length > 0 ? foundIssues : -1;
    }

    //audit images for long alt text
    const auditImagesAltTextLong = (images) => {
        let totalInstances = new Array();//found issues

        //iterate through instances and look for underline
        images.forEach((image) => {
            if(image.hasAttribute("alt")) {
                if(image.getAttribute("alt").length > 100) {
                    totalInstances.push(image);
                }
            }
        });

        //if issues found, return found issues or return -1 if none found
        return totalInstances.length > 0 ? totalInstances : -1;
    }

    //audit links for invisible links
    const auditGhostLinks = (links) => {
        let totalInstances = new Array();//found issues

        //iterate through instances and look for underline
        links.forEach((link) => {
            if(link.innerText.length < 1) {
                totalInstances.push(link);
            }

            else if (link.innerText.includes("Links to an external site.") && link.innerText.length < 28) {
                totalInstances.push(link);
            }
        });

        //if issues found, return found issues or return -1 if none found
        return totalInstances.length > 0 ? totalInstances : -1;
    }

    //audit lists for multi indentations
    const auditListsMulti = (lists) => {
        let totalInstances = new Array();//found issues
        
        //check if list elements have child elements one level down
        lists.forEach((list) => {
            let hasLiChild = false;
            list.querySelectorAll("li").forEach((li) => {
                if(li.parentNode === list) {
                    hasLiChild = true;
                }
            })

            //if no child found, add to issues list
            if(!hasLiChild) {
                totalInstances.push(list);
                hasLiChild = false;
            }
        })

        //if issues found, return found issues or return -1 if none found
        return totalInstances.length > 0 ? totalInstances : -1;
    }

    //generate course records and pass to extension for saving
    const generateCourse = () => {
        //declare course object
        let courseId = window.location.href.split("instructure.com/")[1].split("/")[1];
        let courseName = document.head.querySelector("title").innerHTML.replaceAll("Course Modules: ", "");
        let course = new Course(courseId, "1.0.0", courseName);//current course version = 1.0.0
        
        /*add all modules to course*/
        //grab module elements
        let modules = document.getElementsByClassName("context_module");
        let _modules = new Array();

        //check elements for needed attributes and push to new array
        for(let i = 0; i < modules.length; i++) {
            if(modules[i].hasAttribute("data-module-id") && modules[i].getAttribute("data-module-id") != "{{ id }}") {_modules.push(modules[i]); }
        }


        //create new modules
        for(let i = 0; i < _modules.length; i++) {
            //create new module instance to be added
            let moduleId = _modules[i].getAttribute("data-module-id");
            let published = (_modules[i].getAttribute("data-workflow-state") === "active");
            let title = _modules[i].querySelectorAll('span.name')[0].getAttribute('title');
            let module = new Module(moduleId, title , published);

            //create new pages (module items) for each module
            let pages = _modules[i].querySelectorAll(".context_module_item");
            for(let k = 0; k < pages.length; k++) {
                //get module item / page information
                const params = {
                    moduleItemId: pages[k].getAttribute("id").replace("context_module_item_", ""),
                    type: pages[k].querySelectorAll("span.type_icon")[0].getAttribute("title"),
                    title: pages[k].querySelectorAll("a")[0].getAttribute("title"),
                    url: "https://mtsac.instructure.com" + pages[k].querySelectorAll("a")[0].getAttribute("href"),
                    id2: "",

                }

                //depending on specific page type, grab secondary id
                if(params.type === "Quiz" || params.type === "Discussion Topic" || params.type === "Assignment") {
                    params.id2 = pages[k].querySelectorAll("span.lock-icon")[0].getAttribute("data-content-id");
                }
                else {
                    params.id2 = pages[k].querySelectorAll("div.ig-admin span.publish-icon")[0].getAttribute("data-module-item-name").toLowerCase().replaceAll(":", "").replaceAll('"',"").replaceAll(" ", "-").replaceAll("---", "-").replaceAll("--","-");
                }

                let item = new ModuleItem(params.moduleItemId, params.type, params.title, params.url, params.id2);

                //add module item
                module.addItem(item);
            }

            //if module has pages, add module to course 
            if(module.count > 0) {course.addModule(module); }
        }

        console.log(course);
        return(course.serialize());
    }

    //audit automations for page contents
    const audit = () => {
        let contentEl;
        let errors = new Array();

        //determine main content element based on page type
        if(window.location.href.includes('pages')) {
            contentEl = document.querySelectorAll("#content div.user_content")[0];
        }
        else if(window.location.href.includes('quizzes')) {
            contentEl = document.querySelectorAll('header.quiz-header .row-fluid .description')[1];
        }
        else if(window.location.href.includes('discussion_topics')) {
            contentEl = document.querySelectorAll('#module_sequence_footer_container div.userMessage')[0];
        }
        else {
            contentEl = document.querySelectorAll('#assignment_show div.description')[0];
        }

        console.log(contentEl);

        //display accessibility elements for aiding visual review
        let styleEl = document.createElement('style');
        styleEl.type = 'text/css';
        styleEl.innerText = 'p:hover,h1:hover,h2:hover,h3:hover,h4:hover,h5:hover,h6:hover { background-color: rgb(225, 225, 225) } .red {background-color: red} .error-blank-line {background-color: yellow}';
        document.head.appendChild(styleEl);
        
        //add cursor console for adding errors
        let consoleEl = document.createElement('style');
        consoleEl.innerText = 'p:hover,h1:hover,h2:hover,h3:hover,h4:hover,h5:hover,h6:hover { background-color: rgb(225, 225, 225) } .red {background-color: red} .error-blank-line {background-color: yellow}';
        document.head.appendChild(consoleEl);

        /* check p tags */
        //grab paragraph tags in content
        let pTags = contentEl.querySelectorAll("p");

        //check for abbreviations
        let abbreviations = auditRegexInstaces(pTags, regexAbbreviation);
        if (abbreviations) {
            abbreviations.forEach((key) => {
                errors.push((new Page_Error("Abbreviation", key)).serialize());
            });
        }

        //check for handmade lists
        let handmadeLists_no = auditRegexInstaces(pTags, regexListNo);
        if (handmadeLists_no) {
            handmadeLists_no.forEach((key) => {
                errors.push((new Page_Error("List", key)).serialize());
            });
        }

        let handmadeLists_hyphen = auditRegexInstaces(pTags, regexListHyphen);
        if (handmadeLists_hyphen) {
            handmadeLists_no.forEach((key) => {
                errors.push((new Page_Error("List", key)).serialize());
            });
        }

        //check for all caps
        let allCaps_p = auditRegexInstaces(pTags, regexAllCaps);
        if(allCaps_p) {
            allCaps_p.forEach((key) => {
                errors.push((new Page_Error("All Caps",key)).serialize());
            });
        }

        /*check image tags */
        //grab images tags in content
        let iTags = contentEl.querySelectorAll("img");

        //check alt text length
        let longAltTextInstaces = auditImagesAltTextLong(iTags);
        if(longAltTextInstaces) {
            longAltTextInstaces.forEach((key) => {
                errors.push((new Page_Error("Image Alt-Text(long)", "")).serialize());
            });
        }

        //check if alt text is insufficient
        let insAltTextInstances = auditRegexElements(iTags, regexImageInsufficient, "alt");
        if(insAltTextInstances) {
            insAltTextInstances.forEach((key) => {
                errors.push((new Page_Error("Image Alt-Text(insufficient)", "")).serialize());
            });
        }

        /* check links */
        //grab link tags from content
        let aTags = contentEl.querySelectorAll("a");
        
        //check for invisible links
        let invisibleLinks = auditGhostLinks(aTags);
        if(invisibleLinks) {
            invisibleLinks.forEach((key) => {
                errors.push((new Page_Error("Link(invisible)", "")).serialize());
            });
        }

        //check for links too long

        //check for documents
        let documents = auditRegexElements(aTags, regexDocument, "href");
        if(documents) {
            documents.forEach((key) => {
                errors.push((new Page_Error("Doc", "")).serialize());
            });
        }

        /* check lists */
        //grab unordered lists in content
        let listsUnordered = contentEl.querySelectorAll("ul");
        let listsOrdered = contentEl.querySelectorAll("ul");

        //check if multi indented lists are present
        // let multiIndentedLists_ul = auditListsMulti(listsUnordered);
        // if(multiIndentedLists_ul) {
        //     multiIndentedLists_ul.forEach((key) => {
        //         errors.push((new Page_Error("List(multi)", "")).serialize());
        //     });
        // }
        // let multiIndentedLists_ol = auditListsMulti(listsOrdered);
        // if(multiIndentedLists_ol) {
        //     multiIndentedLists_ol.forEach((key) => {
        //         errors.push((new Page_Error("List(multi)", "")).serialize());
        //     });
        // }

        /* check span tags */
        //grab all span tags in content
        let sTags = contentEl.querySelectorAll("span");
        
        //check for underline
        let underlinedElements = auditRegexElements(sTags, regexUnderline, "style");
        if(underlinedElements) {
            underlinedElements.forEach((key) => {
                errors.push((new Page_Error("Underline", "")).serialize());
            });
        }

        //check for proper text size
        let smallText = auditRegexElements(sTags, regexTextSize, "style");
        if(smallText) {
            smallText.forEach((key) => {
                errors.push((new Page_Error("Text Size", "")).serialize());
            });
        }

        /* check tables */
        //grab all tables and check for titles and headers

        /* check headings */

        pTags.forEach((pTag) => {
            pTag.innerHTML = pTag.innerHTML.replaceAll("$SPANTOCHANGE1$", '<span class="error-blank-line">');
            pTag.innerHTML = pTag.innerHTML.replaceAll("$SPANTOCHANGE2$", '</span>');
        })


        return(errors);
    }

    const NewCoursePageLoaded = async () => {
        //run automated accessibility checker

        //look for empty p tags and mark them as error
        let pTags = document.getElementById("content").querySelectorAll('p');
        pTags.forEach((el) => {
            if(el.innerHTML === "&nbsp;") {
                el.classList.add("error-blank-line")
            }
        })
        
        const response = await chrome.runtime.sendMessage({type: "NEW-PAGE-LOADED"});
    }

    const addNewErrorEventHandler = () => {
        let errorElements = document.getElementsByClassName("combo-option");
        let selected;
        errorElements.forEach((el) => {
            if(el.getAttribute("aria-selected") === "true") {
                selected = el;
            }
        });
        
        

        //check storage
        // chrome.storage.sync.set({
        //     [currentPage]: JSON.stringify([...currentErrors, newError])
        // });

        //get html from highlighted text and 
        // input into new error 'form'

        
    }

    const navigateToError = (text) => {
        text.replace(" ", "%20");
        window.history.replaceState({}, '', window.location.href + textLookUp + "");
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

    chrome.runtime.onMessage.addListener(
        async function (request, sender, sendResponse) {
            const { type, value, moduleItemId, pageTitle, pageType, courseId, url } = request;

            //new page request
            if (type === "NEW") {
                if (window.location.href.includes(".instructure.com/courses/") && !window.location.href.includes("modules")) {
                    if (window.location.href.includes("quizzes") || window.location.href.includes("pages") ||
                        window.location.href.includes("discussion_topics") || window.location.href.includes("assignments")) {
                        NewCoursePageLoaded();
                        return;
                    }
                }
            }

            if(type === "AUDIT") {
                sendResponse(JSON.stringify(audit()));
            }

            if(type === "GENERATE-COURSE") {//return module list items
                let course = generateCourse();//generate course (return value is serialized)
                sendResponse(course);
            }

            //add error request
            if (type === "ADD-ERROR") {
                //check for highlighted text
                var selected = getSelection();
                var range = selected.getRangeAt(0);

                //wrap around beginning and end of words
                index = range.startOffset;
                while(index > 0) {
                    let temp = index - 1;
                    if (range.commonAncestorContainer.nodeValue[temp] == " ") {
                        range.setStart(range.commonAncestorContainer.parentNode.firstChild, index);
                        break;
                    }

                    if(index < -9999) {
                        alert("infinite loop");
                        return;
                    }


                    index--;
                }
                index = range.endOffset;
                while(index < range.commonAncestorContainer.nodeValue.length - 1) {
                    let temp = index + 1;
                    if(range.commonAncestorContainer.nodeValue[temp] == ' ') {
                        range.setEnd(range.commonAncestorContainer.parentNode.firstChild, index + 1);
                        break;
                    }

                    if(index > 9999) {
                        alert("infinite loop");
                        return;
                    }

                    index++;
                }

                if (range.toString().length > 1) {
                    sendResponse({ textLookUpKey: range.toString().replaceAll(" ", "%20") });
                }
                else {
                    sendResponse({ textLookUpKey: "null" });
                }

                return;
            }

            if (type === "SHOW-ERROR") {
                console.log(url);
                window.location.replace(url)
                return;
            }

            if (type === "URL") {
                sendResponse({url: window.location.href});
            }

            if (type === "REDIRECT-PAGE") {
                console.log('clicked');
                window.location.href = url;
            }
        }
    );
})();

