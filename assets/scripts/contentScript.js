(() => {
    let _errors = new Array();
    let contentEl;
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
                if (m.id === moduleId) {
                    return m;
                }
            })

            return -1;
        }

        gatherErrorCount() {
            let count = 0
            Object.keys(this.modules).forEach((key) => {
                let m = Module.deserialize(this.modules[key]);

                Object.keys(m.moduleItems).forEach((key) => {
                    let i = ModuleItem.deserialize(m.moduleItems[key]);

                    count += i.count;
                })
            })

            return count;
        }

        setProfName(name) { this.professorName = name; }

        modulesCheckedCount() {
            let count = 0;
            Object.keys(this.modules).forEach((key) => {
                let m = Module.deserialize(this.modules[key]);

                if (m.checked()) {
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

                    if (item.id = pageId) {
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
                if (moduleItem != null && moduleItem != undefined) { return moduleItem; }
                let m = Module.deserialize(this.modules[key]);

                Object.keys(m.moduleItems).forEach((_key) => {
                    if (moduleItem != null && moduleItem != undefined) { return moduleItem; }
                    let i = ModuleItem.deserialize(m.moduleItems[_key]);

                    //check by module item id
                    if (url.includes(i.id)) {
                        moduleItem = i;
                    }

                    //check by secondary module item id (url path or 6-7 digit code - depending on page type)
                    if (url.includes(i.id2)) {
                        moduleItem = i;
                    }
                })
            })

            return moduleItem.serialize();
        }

        fetchModule(url) {
            let module;
            Object.keys(this.modules).forEach((key) => {
                if (module != null && module != undefined) { return module; }
                let m = Module.deserialize(this.modules[key]);

                Object.keys(m.moduleItems).forEach((_key) => {
                    if (module != null && module != undefined) { return module; }
                    let i = ModuleItem.deserialize(m.moduleItems[_key]);

                    //check by module item id
                    if (url.includes(i.id)) {
                        module = m;
                    }

                    //check by secondary module item id (url path or 6-7 digit code - depending on page type)
                    if (url.includes(i.id2)) {
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
            if (this.moduleItemExists(saveInfo.moduleItemId)) {
                _item = this.moduleItems[saveInfo.moduleItemId];
            }

            if (_item != null && _item != undefined) { return ModuleItem.deserialize(_item); }

            //recursion | return new module if one not found
            this.moduleItems[saveInfo.moduleItemId] = new ModuleItem(saveInfo.moduleId, saveInfo.moduleItemId, saveInfo.pageType, saveInfo.pageTitle).serialize();
            return this.getModuleItem(saveInfo);
        }

        moduleItemExists(moduleItemId) {
            let condition = false;
            Object.keys(this.moduleItems).forEach(function (key) {
                if (moduleItemId === key) {
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
            if (title === null) {
                this.title = "Placeholder Title";
            }
            else {
                this.title = title;
            }
            this.type = type;
            this.checked = checked;
            this.id2 = id2;
        }

        addError(e) {
            //grab error or make a new one if needed
            if (this.errorArrayExists(e)) {
                this.errors[e.name].push(e.serialize());
            }
            else {
                this.errors[e.name] = [];
                this.errors[e.name].push(e.serialize());
            }
            this.count++;
        }

        removeError(error) {
            Object.keys(this.errors).forEach(function (key) {
                console.log(error.name + " " + key);
                if (key === error.name) {
                    console.log(this.errors[key])
                    this.errors[key].splice(1, 0);
                }
            });
            this.count--;
        }

        findError(id) {
            let _key, _index;
            Object.keys(this.errors).forEach(function (key) {
                let index = 0;
                this.errors[key].forEach((error) => {
                    let e = Page_Error.deserialize(error);
                    if (error.id === id) {
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
            Object.keys(this.errors).forEach(function (key) {
                if (e.name === key) {
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
            if (name in tempJSON) {
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
        constructor(name, path = -1, startIndex = -1, endIndex = -1,match = "", id = -1, changes = {}, required = false) {
            this.name = name;
            this.required = required;
            this.startIndex = startIndex;
            this.endIndex = endIndex;
            this.id = id
            this.path = path;
            this.changes = changes;
            this.match = match;
        }

        serialize() {
            return JSON.stringify(this);
        }

        static deserialize(serialized) {
            let obj;

            //try and parse
            try {
                obj = JSON.parse(serialized);
            }
            catch {//if fail, serialize, then try and parse again
                obj = JSON.parse(JSON.stringify(serialized));
            }

            return new Page_Error(obj.name, obj.path, obj.startIndex, obj.endIndex, obj.match, obj.id, obj.changes, obj.required);
        }
    }

    /* Helpful Functions */

    //build lookup text that goes at the end of a url
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
    
    //load in an html chunk / ccode file
    const fetchHTMLChunk = async (path) => {
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
            console.error('failed ot fetch page: ', error);
        })

        return document;
    }

    //load external css chunk / code file
    const fetchCSSChunk = async path => {
        //CSS style sheet
        let css;

        await fetch(path)
        .then(response => {
            //when stylesheet is loaded, convert to text
            return response.text();
        })
        .then(text => {
            //return css text
            css = text;
        })
        .catch(error => {
            console.error('failed to fetch css: ', error);
        })

        return css;
    }

    /**
     * builds a path for retracing back to given node
     * @param {Element} node node being searched for
     * @param {int} count times function was recursed
     * @param {string} str search path (type string)
     * @returns {string} the string to locate the given element
    */
    const buildNodePath = (node, count = 0, str = "") => {

        //skip adding a seperator if this is the first instance
        if(count > 0) {
            str = str + '$';
        }

        //if main content element isn't found within a depth of 15, 
        // break out of recursion
        if (count > 15) {
            return -1;
        }

        //setup to find the index of current node
        for(let i = 0; i < node.parentNode.childNodes.length; i++) {
            if(node === node.parentNode.childNodes[i]) {
                //add index to node path string
                str += i.toString();

                //break loop
                break;
            }
        }

        //if parent node is the main content element, end recursion
        if(node.parentNode === contentEl) {
            return str;
        }

        //if parent node is not main content element, 
        //continue recursion until found
        return buildNodePath(node.parentNode, ++count, str);
    }

    
    /**
     * 
     * find desired Element node from provided path
     * | example of path: '2$1$1$31'
     * @param {Element} parentEl parent element
     * @param {Array<string>} indexes indexes for search
     * @returns {Element} the desired element
    */
    const searchNode = (parentEl, _indexes) => {
        let indexes = _indexes.toString().split('$');//split path

        //array needs to have elements
        if(indexes.length < 1) {
            throw new Error('array needs to have elements');
        }

        //if there is only a single element left
        //return desired node
        if(indexes.length < 2) {
            return parentEl.childNodes[parseInt(indexes.pop())];//return desired element
        }

        //recurse to locate node 
        let index = indexes.pop();//'pop' end off array
        return searchNode(parentEl.childNodes[parseInt(index)], indexes.join('$'));
    }

    /* Audit Regex Combinations and checking requirements */
    const regexAbbreviation = /((?<![a-z])[a-z]{1,3}(\.|\/)([a-z]{1,1})?(\.|\/)?)|\bch\b|\bp\b|\bpp\b/idgm;
    const regexListNo = /^(\()?\d{1,2}(\.|\)|\-){1,1}/gmd;
    const regexListPart = /^\bPart\s{1,2}\d\b/gmd;
    const regexListHyphen = /^[-]{1,2}\s{1,1}/gmd;
    const regexAllCaps = /\b[A-Z\s\'\"\:]{7,}\b/gmd;
    const regexImageInsufficient = /\b(JPEG|GIF|PNG|TIFF|BMP|JPG)\b/igm;
    const regexLinkURL = /\b(www|https)\b/igm;
    const regexDocument = /\b[\.]{1,1}((pdf|docx|doc|docm|dotx|dotm)[^com]?$)\b/i;//check a tags for href strings and compare them to rg
    const regexTextSize = /\bfont-size[\:\s]{1,}[^\d]\d{1,1}pt\b/d;
    const regexUnderline = /\btext-decoration[\:\s]{1,}underline\b/d;
    const regexRepeatingChars = /(.)\1{9,}/igmd;
    //underline: check each span if has style attribute and if it has underline
    //alt text long: check alt text image string length
    //heading skipped: get a list of headings and check their numerical order
    //link invisible: check each a element if it has inner text or not
    //list muli: check if it has child elements of list 1 down and if it has child elements of ul or ol
    //table title: check if table has title element

    /* Audit Functions */
    /**
     * Audit an element's inner text against the provided regex
     * @param {Element} el the element being checked 
     * @param {RegExp} regex regex used to audit
     * @param {string} errorType type of error being checked for
     * @returns {Array<Page_Error>} a list containing errors found (serealized / JSON)
     */
    const auditRegexInstaces = (el, regex, errorType) => {
        let foundIssues = new Array();

        //check only against the current elements inner text; don't check inner text of children
        let str = [].reduce.call(el.childNodes, function (a, b) { return a + (b.nodeType === 3 ? b.textContent : ''); }, '');

            //iterate through each found issue
            while (match = regex.exec(str)) {
                //create error from location on page where it was found
                foundIssues.push(
                    new Page_Error(
                    errorType,
                    buildNodePath(el),
                    match.index,
                    regex.lastIndex,
                    match[0],
                    ).serialize()
                );
            }

        //return errors if found, otherwise return an error (-1) value
        return foundIssues;
    }

    /**
     * Audit an element's attribute for accessibility
     * @param {Element} el 
     * @param {RegExp} regex 
     * @param {string} errorType 
     * @param {Array<string>} attributes 
     * @returns {Array<Page_Error>} a list containing errors found (serealized / JSON)
     */
    const auditRegexElement = (el, regex, errorType, attributes = new Array()) => {
        let foundIssues = new Array();

        //if empty attribute array, check entite outerHTML
        if (attributes.length < 1) {
            if (el.innerHTML.match(regex)) {
                foundIssues.push(
                    new Page_Error(
                        errorType,
                        buildNodePath(el),
                    ).serialize()
                );
            }

            return foundIssues;
        }

        //check each given expected attribute within element
        attributes.forEach(attribute => {

            //check if element has attribute before access
            if(el.hasAttribute(attribute)) {

                //if issues found in attribute, save
                if(el.getAttribute(attribute).match(regex)) {
                    foundIssues.push(
                        new Page_Error (
                            errorType,
                            buildNodePath(el),
                        ).serialize()
                    );
                }
            }
        })

        //return issues found
        return foundIssues;
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

    /* Audit by DOM element type / tag */

    /**
     * audit a list of paragraph elements for accessibility
     * @param {Array<Element>} paragraphs list of paragraph elements from DOM
     * @returns {Array<Page_Error>} a list of serialized (JSON) errors
    */
    const audit_paragraphs = (paragraphs) => {
        let errorsFoundList = new Array();
        
        //iterate through each present p tag
        paragraphs.forEach(p => {
            //if an image element wrapped in a paragraph, skip
            if(p.classList.contains('image-block-alt-display-setup')) {
                return;
            } else if (p.firstChild) {
                try {
                    if (p.firstChild.classList.contains('image-block-alt-display-setup')) {
                        return;
                    }
                }
                catch {}
            }

            //check for blank lines issue
            if(p.innerHTML === '&nbsp;') {

                //highlight p tag
                p.classList.add('error-blank-line');

                //add error
                errorsFoundList.push(
                    new Page_Error(//new error and parameters
                        'Blank line',
                        buildNodePath(p),
                    ).serialize()//serialize error
                );

                //skip to next p tag
                return;
            }

            //check for abbreviations
            errorsFoundList.push(...auditRegexInstaces(p, regexAbbreviation, 'Abbreviation'));

            //check for all caps
            errorsFoundList.push(...auditRegexInstaces(p, regexAllCaps, 'All Caps'));

            //check for repeating characters
            errorsFoundList.push(...auditRegexInstaces(p, regexRepeatingChars, 'Repeating Characters'));

            //check for handmade lists
            errorsFoundList.push(...auditRegexInstaces(p, regexListNo, 'List(handmade)'));//numbered
            errorsFoundList.push(...auditRegexInstaces(p, regexListHyphen, 'List(handmade)'));//hyphened
            errorsFoundList.push(...auditRegexInstaces(p, regexListPart, 'List(handmade)'));//'part' list
        })
        
        return errorsFoundList;
    }

    /**
     * audit a list of span elements for accessibility
     * @param {Array<Element>} spans a list of span elements from the DOM
     * @returns {Array<Page_Error>} a list of serialized (JSON) errors
    */
    const audit_spans = (spans) => {
        let errorsFoundList = new Array();

        //iterate through each span tag
        spans.forEach(span => {

            //skip if span was placed by audit algorithm
            if(span.classList.contains('image-block-alt-display-setup')) {
                return;
            }

            //skip if span has no text
            if(span.innerText.length < 1) {
                return;
            }

            //check for underline
            errorsFoundList.push(...auditRegexElement(span, regexUnderline, 'Underline', ['style']));

            //check for small font
            errorsFoundList.push(...auditRegexElement(span, regexTextSize, 'Text Size', ['style']));
        });

        return errorsFoundList;
    }

    /**
     * audit a list of link (a) tags for accessibility
     * @param {Array<Element>} links a list of a elements from the DOM
     * @returns {Array<Page_Error>} a list of serialized (JSON) errors
    */
    const audit_links = (links) => {
        let errorsFoundList = new Array();

        //iterate through each link (a) tag
        links.forEach(a => {

            //skip if a read speaker link
            if(a.classList.contains('rspkr_dr_link')) {
                return;
            }

            //check if invisible link
            if(a.innerText.length < 1) {
                errorsFoundList.push(
                    new Page_Error(
                        'Link(invisible)',
                        buildNodePath(a)
                    ).serialize()
                )

                //skip checking for other errors if link is invisible
                return;
            }

            //check if visible URL
            errorsFoundList.push(...auditRegexElement(a, regexLinkURL, 'Link(invisible)'));
        })

        return errorsFoundList;
    }

    /**
     * audit a list of img elements for accessibility
     * @param {Array<Element>} images a list of image elements from the DOM
     * @returns {Array<Page_Error>} a list of serialized (JSON) errors
     */
    const audit_img = (images) => {
        let errorsFoundList = new Array();

        //iterate through each img tag
        images.forEach(img => {

            //check if alt text is too long
            if(img.hasAttribute("alt")) {
                if(img.getAttribute("alt").length > 100) {
                    errorsFoundList.push(
                        new Page_Error(
                            'Image Alt-Text(long)',
                            buildNodePath(img),
                        ).serialize()
                    )
                }
            }

            //check if alt text is insufficient 
            errorsFoundList.push(...auditRegexElement(img, regexImageInsufficient, 'Image Alt-Text(insufficient)', ['alt']))
        });

        return errorsFoundList;
    }

    /**
     * audit a list of heading elements for accessibility
     * @param {Array<Element>} headings a list of heading elements from the DOM
     * @returns {Array<Page_Error>} a list of serialized (JSON) errors
     */
    const audit_headings = (headings) => {
        let errorsFoundList = new Array();
        
        //check for repeating heading levels
        //default: multiple heading level 1's
        let count = 0;//count of instances found
        for (let i = 0; i < headings.length; i++) {

            //if desired instance found, add to count
            if (headings[i].tagName === 'h1') {
                count++;

                //if count has exceeded 1, add error
                if (count < 1) {
                    errorsFoundList.push(
                        new Page_Error(
                            'Heading(first level)',
                            buildNodePath(headings[i]),
                        ).serialize()
                    );
                }
            }
        }

        //keep track of previous heading level to check
        //for skips
        let prevLevel = 1;//default (heading 1)
        headings.forEach(h => {//iterate through headings
            //check if skipped heading
            let currLevel = parseInt(h.tagName[1]);//heading level (int)

            //if heading level is skipped
            if((currLevel - prevLevel) > 1) {
                errorsFoundList.push(
                    new Page_Error(
                        'Heading(skipped)',
                        buildNodePath(h)
                    ).serialize()
                );
            }

            //check if empty
            if(h.innerText.length < 1) {
                errorsFoundList.push(
                    new Page_Error(
                        'Heading(empty)',
                        buildNodePath(h),
                    ).serialize()
                );

                //skip checking the rest of errors; they won't occur
                return;
            }

            //check if too long
            if(h.innerText.length > 80) {
                errorsFoundList.push(
                    new Page_Error(
                        'Heading(long)',
                        buildNodePath(h),
                    ).serialize(),
                );
            }

            //check if list heading
            errorsFoundList.push(...auditRegexInstaces(h, regexListNo, 'Heading(list)'));//numbered list
            errorsFoundList.push(...auditRegexInstaces(h, regexListPart, 'Heading(list)'));//'part' list
            errorsFoundList.push(...auditRegexInstaces(h, regexListHyphen, 'Heading(list)'));//hyphened list

            //check if all caps
            errorsFoundList.push(...auditRegexInstaces(h, regexAllCaps, 'All Caps'));

            //check for abbreviations
            errorsFoundList.push(...auditRegexInstaces(h, regexAbbreviation, 'Abbreviation'));

            //check for repeating characters
            errorsFoundList.push(...auditRegexInstaces(h, regexRepeatingChars, 'Repeating Characters'))

            //udpate previous heading level
            prevLevel = currLevel;
        })

        return errorsFoundList;
    }

    /**
     * audit a list of list elements for accessibility
     * @param {Array<Element>} lists a list of list elements from the DOM
     * @returns {Array<Page_Error>} a list of serialized (JSON) errors
     */
    const audit_lists = (lists) => {
        let errorsFoundList = new Array();

        //iterate through lists
        lists.forEach(list => {

            //check for double nested lists
            //TODO

            //iterate through list items
            list.querySelectorAll('li').forEach(li => {

                //check if li is empty
                if(li.innerText.length < 1) {
                    errorsFoundList.push(
                        new Page_Error (
                            'List Item(empty)',
                            buildNodePath(li),
                        ).serialize()
                    );

                    //since no text, don't check for other errors
                    return;
                }

                //check for all caps
                errorsFoundList.push(...auditRegexInstaces(li, regexAllCaps, 'All Caps'));

                //check for abbreviations
                errorsFoundList.push(...auditRegexInstaces(li, regexAbbreviation, 'Abbreviation'));

                //check for repeating characters
                errorsFoundList.push(...auditRegexInstaces(li, regexRepeatingChars, 'Repeating Characters'));
            })
        })

        return errorsFoundList;
    }

    //audit automations for page contents
    const audit = async () => {
        let errors = new Array();

        //determine main content element based on page type
        if(window.location.href.includes('pages')) {
            contentEl = document.querySelectorAll("#content div.user_content")[0];
        }
        else if(window.location.href.includes('quizzes')) {
            contentEl = document.querySelectorAll('div.user_content')[0];
        }
        else if(window.location.href.includes('discussion_topics')) {
            contentEl = document.querySelectorAll('div.userMessage')[0];
        }
        else {
            contentEl = document.querySelectorAll('#assignment_show div.description')[0];
        }

        /* HTML Chunks to insert into DOM */

        //HTML CHunks reference document; to query for needed chunks
        const HTML_CHUNK_REF_DOC = await fetchHTMLChunk('https://raw.githubusercontent.com/Wischok/canvas-accessibility-extension/refs/heads/main/assets/html-code-chunks/error-found.html');
        const CSS_CHUNK = await fetchCSSChunk('https://raw.githubusercontent.com/Wischok/canvas-accessibility-extension/refs/heads/main/assets/styles/errors-found.css')
        

        /* Load stylesheet into current document */

        //create style el
        let styleEl = document.createElement('style');
        styleEl.type = 'text/css';
        styleEl.innerText = CSS_CHUNK;//add css chunk from github REPO
        document.head.appendChild(styleEl);//append to head


        /* audit by DOM element type */

        //audit paragraphs for accessibility
        errors.push(...audit_paragraphs(contentEl.querySelectorAll("p")));
        //audit span tags for accessibility
        errors.push(...audit_spans(contentEl.querySelectorAll("span")));
        //audit img tags for accessibility
        errors.push(...audit_img(contentEl.querySelectorAll("img")));
        //audit link tags for accessibility
        errors.push(...audit_links(contentEl.querySelectorAll("a")));
        //audit heading tags for accessibility
        errors.push(...audit_headings(contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6')));
        //audit li tags for accessibility
        errors.push(...audit_lists(contentEl.querySelectorAll('ul, ol')));

        //remove any undefined errors from audit
        errors = errors.filter(e => Page_Error.deserialize(e).name !== undefined);


        /* Diplay Errors on Web Page */
        displayErrors(errors);

        return errors;

        let count = 1;
        pArr.forEach((_el) => {
            let str;
            if(_el.hasAttribute('style')) {
                str = _el.getAttribute('style') + 'line-height: 2.3';
            }
            else {
                str = 'line-height: 2.3';
            }
            
            _el.setAttribute('style', str);

            _el.querySelectorAll('.error-found-input').forEach((el) => {
                //copy html chunk to replicate for each error
                let node = HTML_CHUNK_REF_DOC.querySelector('.error-found-input').cloneNode(true);
                
                //grab input error from copied html chunk
                let input = node.querySelector('input');
                input.style.width = el.innerText.length.toString() + 'ch';//update width
                input.setAttribute('value', el.innerText);//set input text
                input.id = 'error-found-input-' + count;//create id
                
                //add event listener on type.
                input.addEventListener('keydown', UpdateInputWidth.bind(input.id));

                //display editor console: add event listener to error node on focus and lose focus
                node.addEventListener('focusin', ToggleDisplay.bind());
                node.addEventListener('focusout', ToggleDisplay.bind());

                //display editor console: add event listener to error node editor console on focus and lose focus
                node.querySelector('.editor-console').addEventListener('focusin', ToggleDisplay.bind());
                node.querySelector('.editor-console').addEventListener('focusout', ToggleDisplay.bind());

                //add editor console event listeners | pass in referenced input element id for updating
                //bold
                node.querySelector('#ec-bold').addEventListener('click', toggleBold.bind(this, input.id))

                //italic
                node.querySelector('#ec-italic').addEventListener('click', toggleItalic.bind(this, input.id))

                //decrease font size
                node.querySelector('#ec-lowercase').addEventListener('click', lowercaseText.bind(this, input.id))

                //highlight
                node.querySelector('#ec-highlight-text').addEventListener('click', toggleHighlight.bind(this, input.id))

                //set html
                el.replaceWith(node);

                //add to counter
                count++;
            })
        })

        hTags.forEach((hTag) => {
            hTag.innerHTML = hTag.innerHTML.replaceAll("$SPANTOCHANGE1$", '<span class="error-blank-line">');
            hTag.innerHTML = hTag.innerHTML.replaceAll("$SPANTOCHANGE2$", '</span>');
        })

        lTags.forEach((lTag) => {
            lTag.innerHTML = lTag.innerHTML.replaceAll("$SPANTOCHANGE1$", '<span class="error-blank-line">');
            lTag.innerHTML = lTag.innerHTML.replaceAll("$SPANTOCHANGE2$", '</span>');
        })

        return(errors);
    }

    /* Display Errors and User Edit Functions */

    /**
     * display errors on page
     * @param {Array<Page_Error>} errors a list of serialized Page Error objects 
     */
    const displayErrors = (errors) => {
        //list of ranges
        //list is used to avoid altering elements until end
        let ranges = new Array()

        //object to help with display ranges
        function x_Range(range, error, isElement = false) {
            this.range = range;
            this.error = error;
            this.isElement = isElement;
        }

        //display each
        errors.forEach(e => {
            _e = Page_Error.deserialize(e);

            let range = document.createRange()//new display range
            let node = searchNode(contentEl, _e.path);//find node
            range.selectNodeContents(node);//direct to node contents
            
            //display part of element
            if(_e.match.length > 0) {//if matched to instance within element

                //direct to area within element
                range.setStart(node.firstChild, _e.startIndex);
                range.setEnd(node.firstChild, _e.endIndex)
            
                //add range to array as partial element
                ranges.push(new x_Range(range, _e));
                return;
            }

            //add range to array as full element
            ranges.push(new x_Range(range, _e, true));
        })

        ranges.forEach(r => {
            if(r.isElement) {//if full element, add class
                console.log(r.error.path);
                searchNode(contentEl, r.error.path).classList.add('highlight');
            } else {//if partial element, wrap in span
                let span = document.createElement('span');
                span.classList.add('highlight');

                r.range.surroundContents(span);
            }
        })
    }

    /* Course Generation Function */

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

    const UpdateInputWidth = (event) => {
        if (event.srcElement.hasAttribute('style')) {
            event.srcElement.style.width = event.srcElement.value.length.toString() + 'ch';
        }
    }

    //toggle display class on element interacted with
    const ToggleDisplay = (event) => {
        if(event.srcElement.classList.contains('display')) {
            event.srcElement.classList.remove('display');
        }else {
            event.srcElement.classList.add('display');
        }
    }

    //toggle bold class on element based on id given
    const toggleBold = (id) => {
        let el = document.getElementById(id);

        if(el.classList.contains('bold')) {
            el.classList.remove('bold')
        }else {
            el.classList.add('bold');
        }
    }

    //toggle italic class on element based on id given
    const toggleItalic = (id) => {
        let el = document.getElementById(id);

        if(el.classList.contains('italic')) {
            el.classList.remove('italic')
        }else {
            el.classList.add('italic');
        }
    }

    const lowercaseText = (id) => {
        let el = document.getElementById(id);

        el.value = el.value.toLowerCase();
    }

    const toggleHighlight = (id) => {
        let el = document.getElementById(id);

        if(el.classList.contains('highlight')) {
            el.classList.remove('highlight')
        }else {
            el.classList.add('highlight');
        }
    }

    const NewCoursePageLoaded = async () => {
        let contentEl;

        //determine main content element based on page type
        if(window.location.href.includes('pages')) {
            contentEl = document.querySelectorAll("#content div.user_content")[0];
        }
        else if(window.location.href.includes('quizzes')) {
            contentEl = document.querySelectorAll('div.user_content')[0];
        }
        else if(window.location.href.includes('discussion_topics')) {
            contentEl = document.querySelectorAll('div.userMessage')[0];
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
        consoleEl.innerText = 'p:hover,h1:hover,h2:hover,h3:hover,h4:hover,h5:hover,h6:hover { background-color: rgb(225, 225, 225) } .red {background-color: red} .error-blank-line {background-color: yellow} h1 {position: relative; } h1::after {content: "h1"; position: absolute; width: 3rem; height: 2rem; font-size: 15px; background-color: black; color: white; bottom: 0; left: 0; display: flex; justify-content: center; align-items: center; text-align: center;} h2 {position: relative; } h2::after {content: "h2"; position: absolute; width: 3rem; height: 2rem; font-size: 15px; background-color: black; color: white; bottom: 0; left: 0; display: flex; justify-content: center; align-items: center; text-align: center;} h3 {position: relative; } h3::after {content: "h3"; position: absolute; width: 3rem; height: 2rem; font-size: 15px; background-color: black; color: white; bottom: 0; left: 0; display: flex; justify-content: center; align-items: center; text-align: center;} h4 {position: relative; } h4::after {content: "h4"; position: absolute; width: 3rem; height: 2rem; font-size: 15px; background-color: black; color: white; bottom: 0; left: 0; display: flex; justify-content: center; align-items: center; text-align: center;} h5 {position: relative; } h5::after {content: "h5"; position: absolute; width: 3rem; height: 2rem; font-size: 15px; background-color: black; color: white; bottom: 0; left: 0; display: flex; justify-content: center; align-items: center; text-align: center;} h6 {position: relative; } h6::after {content: "h6"; position: absolute; width: 3rem; height: 2rem; font-size: 15px; background-color: black; color: white; bottom: 0; left: 0; display: flex; justify-content: center; align-items: center; text-align: center;} .image-block-alt-display-setup {position: relative; display: block;} .image-block-alt-display {position: absolute; padding-inline:1rem; height: 2rem; font-size: 15px; background-color: black; color: white; bottom: 0; left: 0; display: flex; justify-content: start; align-items: center; text-align: start;}' ;
        document.head.appendChild(consoleEl);

        const addClass = (name) => {
            let elements = contentEl.querySelectorAll(name);
            if(elements != undefined && elements != null) {
                if(elements.length > 0) {
                    elements.forEach((el) => {
                        el.classList.add("." + name);
                    })
                }
            }
        }

        addClass('h1');
        addClass('h2');
        addClass('h3');
        addClass('h4');
        addClass('h5');
        addClass('h6');

        contentEl.querySelectorAll('p').forEach((el) => {
            if(el.innerHTML === "&nbsp;") {
                el.classList.add("error-blank-line");
            }
        })

        contentEl.querySelectorAll("img").forEach((el) => { 
            el.parentElement.classList.add('image-block-alt-display-setup');
            let alt = document.createElement('span');
            alt.innerText = el.getAttribute('alt');
            alt.classList.add('image-block-alt-display');
            el.parentElement.appendChild(alt);
        });

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
                return;
            }

            if(type === "NEXT") {
                document.querySelectorAll('span.module-sequence-footer-button--next a')[0].click();
            }

            if(type === "GENERATE-COURSE") {//return module list items
                let course = generateCourse();//generate course (return value is serialized)
                sendResponse(course);
                return;
            }

            //add error request
            if (type === "ADD-ERROR") {
                //check for highlighted text
                var selected = getSelection();
                var range = selected.getRangeAt(0);

                if(selected === null || selected === undefined) {
                    sendResponse({ textLookUpKey: "none" });
                    return;
                }

                if(selected.toString().length < 1) {
                    sendResponse({ textLookUpKey: "none" });
                    return;
                }

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
                    sendResponse({ textLookUpKey: "none" });
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