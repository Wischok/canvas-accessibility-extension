/*
    Helper Functions and Input Management
    Imported from inputManager.js
*/

//Save a list of actions for various UI elements
//each HTML interactive element functions off of these user actions
var SelectActions = {
    Close: 0,//escape
    CloseSelect: 1,
    First: 2,
    Last: 3,
    Next: 4,
    Open: 5,
    PageDown: 6,
    PageUp: 7,
    Previous: 8,
    Select: 9,
    Type: 10,
};

// error types for dropdown
const errorList = "Abbreviation$All Caps$Repeating Characters$Audio only$Blank line$Color Contrast$Color as Meaning$Doc$Heading(accidental)$Heading(empty)$Heading(first level)$Heading(list)$Heading(long)$Heading(skipped)$Image Alt-Text(insufficient)$Image Alt-Text(long)$Image Alt-Text(redundant)$Image(decorative)$Invisible$Language$Link(URL)$Link(broken)$Link(invisible)$Link(long)$Link(non-descriptive)$Link(redundant)$List Item(empty)$List(multi)$List$List(handmade)$PDF Present$Powerpoint$Table(headers)$Table(title)$Text Size$Underline$Video(closed captioning)$Word Doc";

/*
    Helper Functions
*/

var event = 5;//naturally set event to open

// map a key press to an action
//when 'event', 'evt', or 'e' are used in a functinon 
//it is automatically passed to event handlers to provide extra features and information
function getActionFromKey(event, menuOpen) {
    const {key, altKey, ctrlKey, metaKey} = event;//store key information
    const openKeys = ['Enter', 'ArrowDown', 'ArrowUp', ' '];//all the keys that will cause combo box to expand

    //handle opening when closed
    if(openKeys.includes(key) && !menuOpen) {
        return SelectActions.Open;
    }

    //home and end move he selected option when open or closed
    if(key === "Home") {
        return SelectActions.First;
    }
    if(key === "End") {
        return SelectActions.Last;
    }

    //handle typing characters when open or closed
    if(//if any key, number, or symbal is pressed
        key === 'Backspace' ||
        key === 'Clear' ||
        (key.length === 1 && key != ' ' && !altKey && !ctrlKey && !metaKey)
    ) {
        return SelectActions.Type;
    }

    //handle keys when open
    if(menuOpen) {
        if(key === 'ArrowUp' && altKey) {
            return SelectActions.CloseSelect;
        } else if (key === 'ArrowDown' && !altKey) {
            return SelectActions.Next;
        } else if (key === 'ArrowUp') {
            return SelectActions.Previous;
        } else if (key === 'PageUp') {
            return SelectActions.PageUp;
        }else if (key === 'PageDown') {
            return SelectActions.PageDown;
        }else if (key === 'Escape') {
            return SelectActions.Close;
        }else if (key === 'Enter' || key === ' ') {
            return SelectActions.Select;
        }
    }
};

// return the index of an option from an array of options, based on a search string
// if the filter is multiple iterations of the same letter (e.g "aaa"), then cycle through first-letter matches
function getIndexByLetter(options, filter, startIndex = 0) {
    const orderedOptions = {
        ...options.slice(startIndex),//iterate through options and slice to the start index
        ...options.slice(0, startIndex),//iterate through options and slice to the start index
    };

    //grab the firstMatch, if present, when filtering key press against combobox array options
    const firstMatch = filterOptions(orderedOptions, filter)[0];

    //a function named allSameLetter that takes an array as a parameter
    //every method below tests whether the elemts in the array pass the test provided
    const allSameLetter = (array) => array.every((letter) => letter === array[0]);

    //first check if there is an exact match for the typed string
    if (firstMatch) {//if match exists
        return options.indexOf(firstMatch);
    }

    //if the same letter is being repeated, cycle through first letter matches
    else if (allSameLetter(filter.split(''))) {
        const matches = filterOptions(orderedOptions, filter[0]);
        return options.indexOf(matches[0]);
    }

    //if no matches, return -1
    else {
        return -1;
    }
};

//get an updated option index after performing an action
function getUpdatedIndex(currentIndex, maxIndex, action) {
    const pageSize = 4; //used for pageup/pagedown

    switch(action) {
        case SelectActions.First:
            return 0;
        case SelectActions.Last:
            return maxIndex
        case SelectActions.Previous:
            return Math.max(0, currentIndex - 1);
        case SelectActions.Next:
            return Math.min(maxIndex, currentIndex + 1);
        case SelectActions.PageUp:
            return Math.max(0, currentIndex - pageSize);
        case SelectActions.PageDown:
            return Math.min(maxIndex, currentIndex + pageSize);
        default:
            return currentIndex;
    }
};

//check if element is visible in browser view port
function isElementInView(element) {
    var bounding  = element.getBoundingClientRect();

    return (
        bounding.top >= 0 &&
        bounding.left >= 0 &&
        bounding.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
        bounding.right <=
        (window.innerWidth || document.documentElement.clientWidth)
    );
};

//check if an element currently scrollable
function isScrollable(element) {
    return element && element.clientHeight < element.scrollHeight;
}

//ensure a given child element is within the parent's visible scroll area
//if the child is not visible, scroll the parent
function maintainScrollVisibility(activeElement, scrollParent) {
    const {offsetHeight, offsetTop} = activeElement;
    const {offsetHeight: parentOffsetHeight, scrollTop} = scrollParent;

    const isAbove = offsetTop < scrollTop;
    const isBelow = offsetTop + offsetHeight >  scrollTop + parentOffsetHeight;

    if(isAbove) {
        scrollParent.scrollTo(0,offsetTop);
    } else if (isBelow) {
        scrollParent.scrollTo(0, offsetTop - parentOffsetHeight + offsetHeight);
    }//if else, then the element is already in view
};

//get index of item from an array
function indexOf(array, key) {
    for(let i = 0; i < array.length; i++) {
        if(array[i] === key) {
            return i;
        }
    }

    return -1;
}

/*
    Select Component Class
    Accecpts a combobox element and an array of string options
*/Select
function Select (el) {//define as class
    //element refs
    this.el = el;
    this.comboEl = el.querySelector('[role=combobox]');
    this.listboxEl = el.querySelector('[role=listbox');

    //data
    this.idBase = this.comboEl.id || 'combo'; //short curcuit evaluation for 'combo' default
    this.options = new Array();

    //state
    this.activeIndex = 0;
    this.open = false;
    this.searchString = '';
    this.searchTimeout = null;
    this.count = 0;

    //init
    if(el && this.comboEl && this.listboxEl) {
        this.init();//initialization function
    }
};

Select.prototype.init = function() {
    //add event listeners
    this.comboEl.addEventListener('blur', this.onComboBlur.bind(this));
    this.listboxEl.addEventListener('focusout', this.onComboBlur.bind(this));
    this.comboEl.addEventListener('click', this.onComboClick.bind(this));
    this.comboEl.addEventListener('keydown', this.onComboKeyDown.bind(this))

    //setup options / parse errors from list
    const errors = errorList.split("$").sort();
    this.comboEl.setAttribute('placeholder', errors[0]);
    errors.forEach((error) => {
        this.setupOption(error);
    });
};

//create and return Option Html element
Select.prototype.setupOption = function (error) {
    let index = this.count;
    this.count++;

    //create element
    let el = document.createElement("div");
    el.role = "option";
    el.id = this.idBase + "-" + this.count;
    el.classList.add("combo-option");
    el.innerHTML = error;

    //set attribute to false unless first instance
    (this.count === 1) ? el.setAttribute("aria-selected","true") : el.setAttribute("aria-selected","false");
    

    el.addEventListener('click', (event) => {
        event.stopPropagation();
        this.onOptionClick(index--);
    });
    el.addEventListener('mousedown', this.onOptionMouseDown.bind(this));

    this.listboxEl.appendChild(el);
    this.options.push(el);
};

Select.prototype.getSearchString = function (char) {
    // reset typing timeout and start new timeout
    // this allows us to make multiple-letter matches, like a native select
    if(typeof this.searchTimeout === 'number') {//couldn't we just perform type conversion through '=='?
        window.clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = window.setTimeout(() => {
        this.searchString = '';
    }, 500);

    //add most recent letter to saved search string
    this.searchString += char;
    return this.searchString;
};

Select.prototype.onComboBlur = function (event) {
    // do nothing if relatedTarget is contained within listboxEl
    if (this.listboxEl.contains(event.relatedTarget)) {
        return;
    }

    //select current option and close
    if (this.open) {
        this.selectOption(this.activeIndex);
        this.updateMenuState(false, false);
    }
};

Select.prototype.onComboClick = function (event) {
    this.updateMenuState(!this.open, false);
};

Select.prototype.onComboKeyDown = function (event) {
    const {key} = event;
    const max = this.errorList.length - 1;

    const action = getActionFromKey(event, this.open);

    switch(action) {
        case SelectActions.Last:
        case SelectActions.First:
            this.updateMenuState(true);
        //intentional fallthrough
        case SelectActions.Next:
        case SelectActions.Previous:
        case SelectActions.PageUp:
        case SelectActions.PageDown:
            event.preventDefault();
            return this.onOptionChange(
                getUpdatedIndex(this.activeIndex, max, action)
            );
        case SelectActions.CloseSelect:
            event.preventDefault();
            this.selectOption(this.activeIndex);
        //intential fallthrough
        case SelectActions.Close:
            event.preventDefault();
            return this.updateMenuState(false);
        case SelectActions.Type:
            return this.onComboKeyDown(key);
        case SelectActions.Open:
            event.preventDefault();
            return this.updateMenuState(true);
        case SelectActions.Select:
            this.selectOption(this.activeIndex);
    }
};

Select.prototype.onComboType = function (letter) {
    //open the listbox if it is closed
    this.updateMenuState(true);

    //find the index of the first matching option
    const searchString = this.getSearchString(letter);
    const searchIndex = getIndexByLetter(
        this.options,
        searchString,
        this.activeIndex + 1
    );

    //if a match was found, go for it
    if(searchIndex >= 0) {
        this.onOptionChange(searchIndex);
    }
    //if no matches, clear the timeout and search string
    else {
        window.clearTimeout(this.searchTimeout);
        this.searchString = '';
    }
};

Select.prototype.onOptionChange = function (index) {
    //update state
    this.activeIndex = index;

    //update aria-activedescendent
    this.comboEl.setAttribute('aria-activedescendent', `${this.idBase}-${index}`);

    //update active option styles
    const options = this.el.querySelectorAll('[role=option]');
    [...options].forEach((optionEl) => {//this method works for option lists with < 50 options
        optionEl.classList.remove('option-current');
    });
    options[index].classList.add('option-current');

    //ensure the new option is in view
    if(isScrollable(this.listboxEl)) {
        maintainScrollVisibility(options[index], this.listboxEl);
    }

    //ensure the new options is visible on screen
    //ensure the new option is in view
    if(!isElementInView(options[index])) {
        options[index].scrollIntoView({behavior: 'smooth', block: 'nearest'});
    }
};

Select.prototype.onOptionClick = function (index) {
    this.onOptionChange(index);
    this.selectOption(index);
    this.updateMenuState(false);
}

Select.prototype.onOptionMouseDown = function () {
    //clicking an optoin will causee a blur event.
    //but we don't want to perform hte default keyboard blur action
    this.ignoreBlur = true;
}

Select.prototype.selectOption = function (index) {
    //update state
    this.activeIndex = index;

    //update displayed value
    const selected = this.options[index];
    this.comboEl.setAttribute("placeholder", selected.innerHTML );

    //update aria-selected
    const options = this.el.querySelectorAll('[role=option]');
    [...options].forEach((optionEl) => {
        optionEl.setAttribute('aria-selected', 'false');
    });
    options[index].setAttribute('aria-selected', 'true');
    this.comboEl.setAttribute('value',selected.innerHTML);
};

Select.prototype.updateMenuState = function (open, callFocus = true) {
    if (this.open === open) {
        return;
    }

    //update state
    this.open = open;

    //update aria-expanded and styles
    this.comboEl.setAttribute('aria-expanded', `${open}`);
    open ? this.el.classList.add('open') : this.el.classList.remove('open');

    //update activedescendent
    const activeID = open ? `${this.idBase}-${this.activeIndex}` : '';
    this.comboEl.setAttribute('aria-activedescendent', activeID);

    if (activeID === '' && !isElementInView(this.comboEl)) {
        this.comboEl.scrollIntoView({behavior: 'smooth', block: 'nearest' });
    }

    //move focus back to the combobox, if needed
    callFocus && this.comboEl.focus();
}

function createCombo(id) {
    const combo = document.getElementById(id);

    new Select(combo);
}

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

    clearErrors() {
        this.errors = {};
        this.count = 0;
        this.checked = false;
    }

    //remove error within object. Return removed error for remove
    //in other areas
    removeError(id) {
        //remove error from list
        for (let i = 0; i < this.errors[id.split('-')[0]].length; i++) {
            if (Page_Error.deserialize(this.errors[id.split('-')[0]][i]).id === id) {
                this.count--;
                //remove error from page and return
                return this.errors[id.split('-')[0]].splice(i, 1);
            }
        }
    }

    findErrorLocation(id) {
        let _key, index;
        Object.keys(this.errors).forEach(key => {
            for (let i = 0; i < this.errors[key].length; i++) {
                let errorId = JSON.parse(this.errors[key][i]).id;
                if (errorId === id) {
                    _key = key;
                    index = i;
                }
            }
        });

        const response = {
            index: index,
            key: _key,
        }

        return response;
    }

    addChangeToError(id, change) {
        //grab location of error
        const location = this.findErrorLocation(id);

        //deserealize error and add change
        let error = Page_Error.deserialize(this.errors[location.key][location.index]);
        error.addChange(change);

        this.errors[location.key][location.index] = error.serialize();
    }

    removeChangeFromError(id, change) {
        //grab location of error
        const location = this.findErrorLocation(id);

        //deserealize error and add change
        let error = Page_Error.deserialize(this.errors[location.key][location.index]);
        error.removeChange(change);

        this.errors[location.key][location.index] = error.serialize();
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
    constructor(name, path = -1, id = -1, startIndex = -1, endIndex = -1, match = "", changes = {}, required = false) {
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

    addChange(change) {
        this.changes[change.key] = change.value;
    }

    removeChange(change) {
        delete this.changes[change.key];
    }

    static generateRandomId(name) {
        return (
            name +
            '-' +
            Math.floor(Math.random() * 9999).toString() +
            '-' +
            Math.floor(Math.random() * 9999).toString() +
            '-' +
            Date.now().toString()
        )
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

        return new Page_Error(obj.name, obj.path, obj.id, obj.startIndex, obj.endIndex, obj.match, obj.changes, obj.required);
    }
}

class Pseudo_Element {
    constructor(tagName, attributes = {}, innerText, path = "-1", children = new Array()) {
        this.tagName = tagName;
        this.attributes = attributes;
        this.children = children;
        this.path = path
        this.innerText = innerText;

        this.voidElements = new Set([
            "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
            "meta", "param", "source", "track", "wbr"
        ]);
    }

    isVoidElement() {
        return (this.voidElements.has(this.tagName));
    }

    serialize() {
        return JSON.stringify(this);
    }

    static deserialize(serialized) {
        const obj = JSON.parse(serialized);
        return new Pseudo_Element(obj.tagName, obj.attributes, obj.innerText, obj.path, obj.children);
    }
}

(() => {
    let _errors = new Array();
    let contentEl;
    const textLookUp = "#:~:text=";
    let activeElement = null, activeRange = null;
    let errorsDisplayed = false;
    /* HTML Chunks to insert into DOM */

    //HTML CHunks reference document; to query for needed chunks
    let HTML_CHUNK_REF_DOC, CSS_CHUNK, addErrorBtn; 

    /* Helpful Functions */
    
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
            console.error('failed to fetch HTML: ', error);
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

        //if main content element isn't found within a depth of 25, 
        // break out of recursion
        if (count > 25) {
            return -1;
        }

        //setup to find the index of current node
        let offset = 0;//account for invisible '#text' nodes
        for(let i = 0; i < node.parentNode.children.length; i++) {
            if(node.parentNode.children[i].nodeName === '#text') {offset++;}
            if(node === node.parentNode.children[i]) {
                //add index to node path string
                str += i + '-' + offset;

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
    const searchNode = (_indexes, parentEl = contentEl) => {
        let indexes = _indexes.toString().split('$');//split path
        //array needs to have elements
        if(indexes.length < 1) {
            throw new Error('array needs to have elements');
        }

        //retrieve index value where element is located
        let value = indexes.pop().split('-');
        let number1 = parseInt(value[0]);
        let number2 = parseInt(value[1]);
        //if webpage is an edit page, alter index
        let index = (window.location.href.includes('/edit')) ? parseInt(number1 - number2) : number1;

        //if there is only a single element left
        //return desired node
        if(indexes.length < 1) {
            return parentEl.children[index];//return desired element
        }

        //recurse to locate node 
        return searchNode(indexes.join('$'), parentEl.children[parseInt(index)]);
    }

    /**
     * Alter search path to still find required element
     * @param {string} path path to be altered 
     * @param {Number} offset number offset to adjust first element by
     * @returns {string} updated path to search node
     */
    const updateSearchPath = (path, offset) => {
        let indexes = path.toString().split('$');//split path

        //adjust first index by offset to account
        //for webpage difference
        let num = (parseInt(indexes[indexes.length - 1].split('-')[0]) + offset);
        if(num < 0) { num = 0; }
        indexes[indexes.length - 1] = num + '-' + indexes[indexes.length - 1].split('-')[1];

        return indexes.join('$');
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
        //let str = [].reduce.call(el.childNodes, function (a, b) { return a + (b.nodeType === 3 ? b.textContent : ''); }, '');

            //iterate through each found issue
            while (match = regex.exec(el.innerText)) {
                //create error from location on page where it was found
                foundIssues.push(
                    new Page_Error(
                    errorType,
                    buildNodePath(el),
                    Page_Error.generateRandomId(errorType),
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
                        Page_Error.generateRandomId(errorType),
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
                            Page_Error.generateRandomId(errorType),
                        ).serialize()
                    );
                }
            }
        })

        //return issues found
        return foundIssues;
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
                        Page_Error.generateRandomId('Blank line'),
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
     * Add error to course
     */
    const addError = async (errorType) => {
        //find course
        let course;
        await chrome.storage.local.get().then(result => {
            Object.keys(result).forEach(key => {
                //find current course
                if (window.location.href.includes(key)) {
                    course = Course.deserialize(result[key]);
                }
            })
        })

        //find page and module
        let moduleItem = ModuleItem.deserialize(course.fetchModuleItem(window.location.href));
        let module = Module.deserialize(course.fetchModule(window.location.href));
        let error;

        if (activeRange) {
            error = new Page_Error(
                errorType,
                buildNodePath(activeElement),
                Page_Error.generateRandomId(errorType),
                activeRange.startOffset,
                activeRange.endOffset,
                activeRange.toString(),
            );

            moduleItem.addError(error);
        }
        else {
            error = new Page_Error(
                document.getElementById('error-type').value,
                buildNodePath(activeElement),
                Page_Error.generateRandomId(document.getElementById('error-type').value)
            );

            moduleItem.addError(error);
        }

        module.setModuleItem(moduleItem)
        course.setModule(module);

        saveCourse(course.serialize());

        activeElement = null;
        activeRange = null;
    
        if (!errorsDisplayed) {
            //array of errors display
            let errors = new Array();

            Object.keys(moduleItem.errors).forEach(key => {
                moduleItem.errors[key].forEach(e => {
                    errors.push(Page_Error.deserialize(e));
                })
            })

            displayErrors(errors);
        }else {
            displayErrorIndividual(error);
        }
        
    }

    const displayErrorIndividual = (error) => {
        let range = document.createRange()//new display range
        let node;//node to find
        if (window.location.href.includes('/edit') && window.location.href.includes('pages')) {
            node = searchNode(updateSearchPath(_e.path, -1));
        } else {
            node = searchNode(error.path);
        }

        range.selectNodeContents(node);//direct to node contents

        //display part of element
        if (error.match.length > 0) {//if matched to instance within element

            let start = error.startIndex;//adjustable value for start index
            //set range start and node
            const setRangeRecursion_Start = (node) => {
                if (start < 0) {//skip the rest of recursion if solution is found
                    return;
                }

                //if node is an element node
                if (node.nodeType === 1) {

                    //iterate through all child nodes
                    node.childNodes.forEach(n => {
                        setRangeRecursion_Start(n);
                    })
                }

                //if node is a #text node
                if (node.nodeType === 3) {

                    //check if start index fits within element string
                    if (node.textContent.length > start) {
                        range.setStart(node, start);
                        start = -1;//set start to -1 as a form of skipping the rest of recursion
                        return;
                    }

                    start -= node.textContent.length;
                }
            }

            setRangeRecursion_Start(node);

            let end = error.endIndex;//adjustable value for end index
            //set range end and node
            const setRangeRecursion_End = (node) => {
                if (end < 0) {//skip the rest of recursion if solution is found
                    return;
                }

                //if node is an element node
                if (node.nodeType === 1) {

                    //iterate through all child nodes
                    node.childNodes.forEach(n => {
                        setRangeRecursion_End(n);
                    })
                }

                //if node is a #text node
                if (node.nodeType === 3) {

                    //check if start index fits within element string
                    if (node.textContent.length > end) {
                        range.setEnd(node, end);
                        end = -1;//set start to -1 as a form of skipping the rest of recursion
                        return;
                    }

                    end -= node.textContent.length;
                }
            }

            setRangeRecursion_End(node);

            //add range to array as partial element
            createEditableErrorInput(range, error);
            return;
        }

        //add range to array as full element
        createEditableErrorElement(range, error);
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
                        buildNodePath(a),
                        Page_Error.generateRandomId('Link(invisible)'),
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
                            Page_Error.generateRandomId('Image Alt-Text(long)'),
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
                            Page_Error.generateRandomId('Heading(first level)'),
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
                        buildNodePath(h),
                        Page_Error.generateRandomId('Heading(skipped)'),
                    ).serialize()
                );
            }

            //check if empty
            if(h.innerText.length < 1) {
                errorsFoundList.push(
                    new Page_Error(
                        'Heading(empty)',
                        buildNodePath(h),
                        Page_Error.generateRandomId('Heading(empty)'),
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
                        Page_Error.generateRandomId('Heading(long)'),
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
                            Page_Error.generateRandomId('List Item(empty)'),
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
        return new Promise((resolve, reject) => {
            let errors = new Array();

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

            errors.forEach(e => console.log(Page_Error.deserialize(e)));

            /* Diplay Errors on Web Page */
            displayErrors(errors);

            const data = JSON.stringify(errors);
            resolve(data);
        });
    }

    /* Course Generation */

    /**
     * generate course records and pass to extension for saving
     * @returns {Course} a new instance of a course to save
     */
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

        return(course.serialize());
    }

    const UpdateInputWidth = (id) => {
        let input = document.getElementById(id).querySelector('input');
        if (input.hasAttribute('style')) {
            input.style.width = input.value.length.toString() + 'ch';
        }
    }

    /* Display Errors and User Edit Functions */

    /**
     * display errors on page
     * @param {Array<Page_Error>} errors a list of serialized Page Error objects 
     */
    const displayErrors = (errors) => {
        if(errorsDisplayed) {
            return;
        }

        errorsDisplayed = true;

        //remove overflow from contentEl
        contentEl.style.overflowX = 'visible'

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
            let node;//node to find
            if(window.location.href.includes('/edit') && window.location.href.includes('pages')) {
                node = searchNode(updateSearchPath(_e.path, -1));
            } else {
                node = searchNode(_e.path);
            }

            range.selectNodeContents(node);//direct to node contents
            
            //display part of element
            if(_e.match.length > 1) {//if matched to instance within element

                let start = _e.startIndex;//adjustable value for start index
                //set range start and node
                const setRangeRecursion_Start = (_node) => {
                    if(start < 0) {//skip the rest of recursion if solution is found
                        return;
                    }

                    //if node is an element node
                    if (_node.nodeType === 1) {

                        //iterate through all child nodes
                        _node.childNodes.forEach(n => {
                            setRangeRecursion_Start(n);
                        })
                    }

                    //if node is a #text node
                    if(_node.nodeType === 3) {

                         //check if start index fits within element string
                        if (_node.textContent.length > start) {
                            range.setStart(_node, start);
                            start = -1;//set start to -1 as a form of skipping the rest of recursion
                            return;
                        }

                        start -= node.textContent.length;
                    } 
                }

                setRangeRecursion_Start(node);

                let end = _e.endIndex;//adjustable value for end index
                //set range end and node
                const setRangeRecursion_End = (node) => {
                    if(end < 0) {//skip the rest of recursion if solution is found
                        return;
                    }

                    //if node is an element node
                    if (node.nodeType === 1) {

                        //iterate through all child nodes
                        node.childNodes.forEach(n => {
                            setRangeRecursion_End(n);
                        })
                    }

                    //if node is a #text node
                    if(node.nodeType === 3) {

                        //check if start index fits within element string
                        if (node.textContent.length > end) {
                            range.setEnd(node, end);
                            end = -1;//set start to -1 as a form of skipping the rest of recursion
                            return;
                        }

                        end -= node.textContent.length;
                    }
                }

                setRangeRecursion_End(node);
            
                //add range to array as partial element
                ranges.push(new x_Range(range, _e));
                return;
            }

            //add range to array as full element
            ranges.push(new x_Range(range, _e, true));
        })

        ranges.forEach(r => {
            let node;//node to find
            //adjust search pattern if on edit page
            if (window.location.href.includes('/edit') && window.location.href.includes('pages')) {
                node = searchNode(updateSearchPath(r.error.path, -1));
            } else {
                node = searchNode( r.error.path);
            }

            if (r.isElement) {//if error is full element, add class
                createEditableErrorElement(r.range, r.error);
            } else {//if partial element, wrap in span
                createEditableErrorInput(r.range, r.error);
            }
        });
    }

    /**
     * create an editable input region for the specified text of an accessbility error
     * @param {Range} range the range showing the errors location 
     * @param {Page_Error} error the associated accessibility error 
     */
    const createEditableErrorInput = async (range, error) => {
        //copy html chunk to replicate for each error
        let node = HTML_CHUNK_REF_DOC.querySelector('.error-found-input').cloneNode(true);
        node.id = error.id;

        //find node and raise line height
        let element;
        //if 'edit' on 'pages' page, change path
        if(window.location.href.includes('/edit') && window.location.href.includes('pages')) {
            element = searchNode( updateSearchPath(error.path, -1));
        } else {
            element = searchNode( error.path);
        }
        
        let str;
        if (element.hasAttribute('style')) {
            str = element.getAttribute('style') + 'line-height: 2.3;';
        }
        else {
            str = 'line-height: 2.3;';
        }

        element.setAttribute('style', str);

        //grab input error from copied html chunk
        let input = node.querySelector('input');
        input.style.width = error.match.length.toString() + 'ch';//update width

        //check if error was already updated
        if('TEXT_UDPATE' in error.changes) {
            //provided change value
            input.setAttribute('value', error.changes['TEXT_UDPATE']);//set input text
        } else {
            input.setAttribute('value', error.match);//set input text
        }

        //add event listener on type.
        input.addEventListener('keydown', UpdateInputWidth.bind(this, node.id));
        input.addEventListener('input', updateErrorText.bind(this, node.id));

        //display editor console: add event listener to error node on focus and lose focus
        node.addEventListener('focusin', ToggleDisplay.bind());
        node.addEventListener('focusout', ToggleDisplay.bind());

        //display editor console: add event listener to error node editor console on focus and lose focus
        node.querySelector('.editor-console').addEventListener('focusin', ToggleDisplay.bind());
        node.querySelector('.editor-console').addEventListener('focusout', ToggleDisplay.bind());

        //add editor console event listeners | pass in referenced input element id for updating
        //bold
        node.querySelector('#ec-bold').addEventListener('click', toggleBold.bind(this, node.id))

        //italic
        node.querySelector('#ec-italic').addEventListener('click', toggleItalic.bind(this, node.id))

        //decrease font size
        node.querySelector('#ec-lowercase').addEventListener('click', lowercaseText.bind(this, node.id))

        //highlight
        node.querySelector('#ec-highlight-text').addEventListener('click', toggleHighlight.bind(this, node.id))

        //delete element / selection
        node.querySelector('#ec-remove').addEventListener('click', removeSelection.bind(this, node.id))

        //delete error
        node.querySelector('#ec-delete').addEventListener('click', deleteError.bind(this, node.id))

        //create span to wrap inner text with
        let span = document.createElement('span');
        span.id = 'REPLACE-ELEMENT';
        range.surroundContents(span);

        //replace previous span with error node
        contentEl.querySelector('#REPLACE-ELEMENT').replaceWith(node);

        //update error based on changes
        Object.keys(error.changes).forEach(key => {
            if (key === 'italic') {
                node.classList.add('italic');
            }

            if (key === 'bold') {
                node.classList.add('bold');
            }

            if (key === 'strikethrough') {
                node.classList.add('strikethrough');
            }

            if (key === 'highlight') {
                node.classList.add('highlight');
            }

            if (key === 'lowercase') {
                node.querySelector('input').value = node.querySelector('input').value.toLowerCase();
            }

            if (key === 'text') {
                node.querySelector('input').value = error.changes[key];
            }
        })
    }

    /**
     * create an editable element console region for the specified text of an accessbility error
     * @param {Range} range the range showing the errors location 
     * @param {Page_Error} error the associated accessibility error 
     */
    const createEditableErrorElement = async (range, error) => {
        //copy html chunk to replicate for each error
        let node = HTML_CHUNK_REF_DOC.querySelector('.element').cloneNode(true);
        let editorConsole = node.querySelector('.editor-console');
        node.id = error.id;

        //find node
        let element;
        //if 'edit' on 'pages' page, change path
        if(window.location.href.includes('/edit') && window.location.href.includes('pages')) {
            element = searchNode( updateSearchPath(error.path, -1));
        } else {
            element = searchNode( error.path);
        }

        //display editor console: add event listener to error node on focus and lose focus
        node.addEventListener('focusin', ToggleDisplay.bind());
        node.addEventListener('focusout', ToggleDisplay.bind());

        //display editor console: add event listener to error node editor console on focus and lose focus
        editorConsole.addEventListener('focusin', ToggleDisplay.bind());
        editorConsole.addEventListener('focusout', ToggleDisplay.bind());

        //add editor console event listeners | pass in referenced input element id for updating
        //bold
        editorConsole.querySelector('#ec-bold').addEventListener('click', toggleBold.bind(this, node.id))

        //italic
        editorConsole.querySelector('#ec-italic').addEventListener('click', toggleItalic.bind(this, node.id))

        //highlight
        editorConsole.querySelector('#ec-highlight-text').addEventListener('click', toggleHighlight.bind(this, node.id))

        //delete element / selection
        editorConsole.querySelector('#ec-remove').addEventListener('click', removeSelection.bind(this, node.id))

        //delete error
        editorConsole.querySelector('#ec-delete').addEventListener('click', deleteError.bind(this, node.id))

        //create span to wrap inner text with
        range.surroundContents(node);

        //append editor console
        node.appendChild(editorConsole);

        //update error based on changes
        Object.keys(error.changes).forEach(key => {
            if (key === 'italic') {
                node.classList.add('italic');
            }

            if (key === 'bold') {
                node.classList.add('bold');
            }

            if (key === 'strikethrough') {
                node.classList.add('strikethrough');
            }

            if (key === 'highlight') {
                node.classList.add('highlight');
            }
        })
    }

    //toggle display class on element interacted with
    const ToggleDisplay = (event) => {
        if(event.srcElement.classList.contains('display')) {
            event.srcElement.classList.remove('display');
        }else {
            event.srcElement.classList.add('display');
        }
    }

    //save error text
    const updateErrorText = (id) => {
        let node = document.getElementById(id);

        //update error within course save
        chrome.storage.local.get().then(result => {
            Object.keys(result).forEach(key => {
                //find current course
                if (window.location.href.includes(key)) {
                    let course = Course.deserialize(result[key]);
                    addChange(course, id, { key: 'text', value: node.querySelector('input').value });
                }
            })
        })
    }

    //toggle bold class on element based on id given
    const toggleBold = (id) => {
        let node = document.getElementById(id);

        if (node.classList.contains('bold')) {
            node.classList.remove('bold');

            //update error within course save
            chrome.storage.local.get().then(result => {
                Object.keys(result).forEach(key => {
                    //find current course
                    if (window.location.href.includes(key)) {
                        let course = Course.deserialize(result[key]);
                        removeChange(course, id, { key: 'bold', value: 'bold' });
                    }
                })
            })
        } else {
            node.classList.add('bold');

            //update error within course save
            chrome.storage.local.get().then(result => {
                Object.keys(result).forEach(key => {
                    //find current course
                    if (window.location.href.includes(key)) {
                        let course = Course.deserialize(result[key]);
                        addChange(course, id, { key: 'bold', value: 'bold' });
                    }
                })
            })
        }

        
    }

    const removeSelection = async (id) => {
        let node = document.getElementById(id);

        if (node.classList.contains('strikethrough')) {
            node.classList.remove('strikethrough');

            //update error within course save
            chrome.storage.local.get().then(result => {
                Object.keys(result).forEach(key => {
                    //find current course
                    if (window.location.href.includes(key)) {
                        let course = Course.deserialize(result[key]);
                        removeChange(course, id, { key: 'strikethrough', value: 'strikethrough' });
                    }
                })
            })
        } else {
            node.classList.add('strikethrough');

            //update error within course save
            chrome.storage.local.get().then(result => {
                Object.keys(result).forEach(key => {
                    //find current course
                    if (window.location.href.includes(key)) {
                        let course = Course.deserialize(result[key]);
                        addChange(course, id, { key: 'strikethrough', value: 'strikethrough' });
                    }
                })
            })
        }
    }

    //toggle italic class on element based on id given
    const toggleItalic = (id) => {
        let node = document.getElementById(id);

        if(node.classList.contains('italic')) {
            node.classList.remove('italic');

            //update error within course save
            chrome.storage.local.get().then(result => {
                Object.keys(result).forEach(key => {
                    //find current course
                    if(window.location.href.includes(key)) {
                        let course = Course.deserialize(result[key]);
                        removeChange(course, id, {key: 'italic', value: 'italic'});
                    }
                })
            })
        }else {
            node.classList.add('italic');

            //update error within course save
            chrome.storage.local.get().then(result => {
                Object.keys(result).forEach(key => {
                    //find current course
                    if(window.location.href.includes(key)) {
                        let course = Course.deserialize(result[key]);
                        addChange(course, id, {key: 'italic', value: 'italic'});
                    }
                })
            })
        }

        
    }

    const addChange = (course, id, change) => {
        let moduleItem = ModuleItem.deserialize(course.fetchModuleItem(window.location.href));
        let module = Module.deserialize(course.fetchModule(window.location.href));

        moduleItem.addChangeToError(id, change);
        module.setModuleItem(moduleItem)
        course.setModule(module);

        saveCourse(course.serialize());
    }

    const removeChange = (course, id, change) => {
        let moduleItem = ModuleItem.deserialize(course.fetchModuleItem(window.location.href));
        let module = Module.deserialize(course.fetchModule(window.location.href));

        moduleItem.removeChangeFromError(id, change);
        module.setModuleItem(moduleItem)
        course.setModule(module);

        saveCourse(course.serialize());
    }

    const saveCourse = (course) => {
        chrome.storage.local.set({
            [Course.deserialize(course).id]: course,
        })
    }

    const lowercaseText = (id) => {
        let input = document.getElementById(id).querySelector('input');

        input.value = input.value.toLowerCase();

        //update error within course save
        chrome.storage.local.get().then(result => {
            Object.keys(result).forEach(key => {
                //find current course
                if (window.location.href.includes(key)) {
                    let course = Course.deserialize(result[key]);
                    addChange(course, id, { key: 'lowercase', value: 'lowercase' });
                }
            })
        })
        
    }

    const deleteError = async (id) => {
        //grab node / element to remove from DOM
        let node = document.getElementById(id);

        let course;//course var
        await chrome.storage.local.get().then(result => {//grab course from save
            Object.keys(result).forEach(key => {
                //find current course
                if (window.location.href.includes(key)) {
                    course = Course.deserialize(result[key]);
                }
            })
        })

        //find module item and module
        let moduleItem = ModuleItem.deserialize(course.fetchModuleItem(window.location.href));
        let module = Module.deserialize(course.fetchModule(window.location.href));

        //remove error
        let error = moduleItem.removeError(id);
        module.setModuleItem(moduleItem)
        course.setModule(module);
        course.errorCount--;

        //save course with removed error
        saveCourse(course.serialize());

        //remove error from DOM
        removeErrorFromDom(node, Page_Error.deserialize(error));
        
        const response = await chrome.runtime.sendMessage({type: "ERROR-REMOVED"});
    }

    const toggleHighlight = (id) => {
        let node = document.getElementById(id);

        if(node.classList.contains('highlight')) {
            node.classList.remove('highlight');

            //update error within course save
            chrome.storage.local.get().then(result => {
                Object.keys(result).forEach(key => {
                    //find current course
                    if(window.location.href.includes(key)) {
                        let course = Course.deserialize(result[key]);
                        removeChange(course, id, {key: 'highlight', value: 'highlight'});
                    }
                })
            })
        }else {
            node.classList.add('highlight');

            //update error within course save
            chrome.storage.local.get().then(result => {
                Object.keys(result).forEach(key => {
                    //find current course
                    if(window.location.href.includes(key)) {
                        let course = Course.deserialize(result[key]);
                        addChange(course, id, {key: 'highlight', value: 'highlight'});
                    }
                })
            })
        }
    }

    const NewCoursePageLoaded = async () => {
        //create style el
        //display accessibility elements for aiding visual review
        let styleEl = document.createElement('style');
        styleEl.type = 'text/css';
        styleEl.innerText = await fetchCSSChunk('https://raw.githubusercontent.com/Wischok/canvas-accessibility-extension/refs/heads/main/assets/styles/page-loaded.css');
        document.head.appendChild(styleEl);

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
    
    const getSelection = async () => {
        //get selection
        var selection;
        if (window.getSelection) {
            selection = window.getSelection();
        } else if (document.getSelection) {
            selection = document.getSelection();
        } else if (document.selection) {
            selection = document.selection.createRange().text;
        } else {selection = null; }

        //if selected element exists within contentEl
        if (contentEl.contains(selection.focusNode.parentElement)) {
            //if selection is text
            if (selection.toString().length > 0) {
                activeElement = selection.focusNode.parentElement;
                activeRange = selection.getRangeAt(0);
            } else {
                activeElement = selection.focusNode.parentElement;
                activeRange = null;
            }
        }

        let pseudoEl = BuildPseudoElement(activeElement);

        const response = await chrome.runtime.sendMessage({type: "ELEMENT-SELECTED", pseudoElement: pseudoEl});
    }

    //create a psuedoelement object
    const BuildPseudoElement = (element) => {
        console.log('building element');
        //get element name
        let tagName = element.tagName.toLowerCase();

        //get element attributes
        let attributes = {};
        for (let i = 0; i < element.attributes.length; i++) {
            attributes[element.attributes.item(i).name] = element.attributes.item(i).value;
        }

        //create pseudo elements for children
        let children = new Array();
        for(let i = 0; i < element.children.length; i++) {
            children.push(BuildPseudoElement(element.children[i]));
        }

        //get element path
        let path = buildNodePath(element);

        //outer html
        let innerText = [].reduce.call(element.childNodes, function (a, b) { return a + (b.nodeType === 3 ? b.textContent : ''); }, '');

        //return pseudo element
        return new Pseudo_Element(tagName, attributes, innerText, path, children).serialize();
    }

    const removeErrorFromDom = (node, error) => {
        //create span to replace error node
        let span = document.createElement('span');

        //if not an element based error (has an input)
        if(!node.classList.contains('element')) {
            span.innerText = error.match;//set inner text
            node.replaceWith(span);//replace
        }else {//if an element based error (does not have an input)
            //remove editor console from node
            node.removeChild(node.querySelector('.editor-console'));

            //save inner HTML to span
            span.innerHTML = node.innerHTML;

            //replace error node with updated span
            node.replaceWith(span);
        }
    }

    /**
     * Function to be ran on Canvas 'edit' page. Updates each error depending on user created changes
     * @param {Array<Page_Error>} errors a list of page errors used to display errors
     */
    const applyErrorChanges = (errors) => {

    }

    window.addEventListener('load', async () => {
        if (window.location.href.includes(".instructure.com/courses/") && !window.location.href.includes("modules")) {
            if (window.location.href.includes("quizzes") || window.location.href.includes("pages") ||
                window.location.href.includes("discussion_topics") || window.location.href.includes("assignments")) {
                /* HTML Chunks to insert into DOM */

                //HTML CHunks reference document; to query for needed chunks
                HTML_CHUNK_REF_DOC = await fetchHTMLChunk('https://raw.githubusercontent.com/Wischok/canvas-accessibility-extension/refs/heads/main/assets/html-code-chunks/error-found.html');
                CSS_CHUNK = await fetchCSSChunk('https://raw.githubusercontent.com/Wischok/canvas-accessibility-extension/refs/heads/main/assets/styles/errors-found.css')

                //determine main content element based on page type
                if (window.location.href.includes('pages')) {
                    contentEl = document.querySelectorAll("#content div.user_content")[0];
                }
                else if (window.location.href.includes('quizzes')) {
                    contentEl = document.querySelectorAll('div.user_content')[0];
                }
                else if (window.location.href.includes('discussion_topics')) {
                    contentEl = document.querySelectorAll('span.user_content')[0];
                }
                else {
                    contentEl = document.querySelectorAll('#assignment_show div.description')[0];
                }

                //if 'edit' version of webpage
                if (window.location.href.includes('/edit')) {
                    const iframe = document.getElementById('wiki_page_body_ifr');
                    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;

                    contentEl = iframeDocument.getElementById('tinymce');

                    let styleEl = iframeDocument.createElement('style');
                    styleEl.type = 'text/css';
                    styleEl.innerText = CSS_CHUNK;//add css chunk from github REPO
                    iframeDocument.head.appendChild(styleEl);//append to head
                } else {
                    contentEl.addEventListener('mouseup', getSelection.bind());
                }

                /* Load stylesheet into current document */

                //create style el
                let styleEl = document.createElement('style');
                styleEl.type = 'text/css';
                styleEl.innerText = CSS_CHUNK;//add css chunk from github REPO
                document.head.appendChild(styleEl);//append to head

                NewCoursePageLoaded();
            }
        } else if (window.location.href.includes(".instructure.com/courses/") && window.location.href.includes("modules")) {
            NewCoursePageLoaded();
        }
    })

    chrome.runtime.onMessage.addListener(
        async function (request, sender, sendResponse) {
            const { type, value, moduleItemId, pageTitle, pageType, courseId, url, errors, error, path, errorType } = request;

            if (type === "AUDIT") {
                audit().then(
                    result => {
                        sendResponse(result);
                    }
                )

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
                addError(errorType);
            }

            if (type === "SHOW-ERROR") {
                window.location.replace(url)
                return;
            }

            if (type === "URL") {
                sendResponse({url: window.location.href});
            }

            if (type === "REDIRECT-PAGE") {
                window.location.href = url;
            }

            if (type === "DISPLAY-ERRORS") {
                displayErrors(JSON.parse(errors));
            }

            if(type === "ERROR-REMOVED") {
                e = Page_Error.deserialize(error);

                removeErrorFromDom(searchNode(e.path), e);
            }

            if(type === "SELECTED-ELEMENT-FOCUS") {
                if(path != 'null') {
                    let el = searchNode(path);

                    if(el.classList.contains('unfocus-element')) {
                        el.classList.remove('unfocus-element');
                    }

                    el.classList.add('focus-element');
                }
            }

            if(type === "SELECTED-ELEMENT-UNFOCUS") {
                if(path != 'null') {
                    let el = searchNode(path);

                    if(el.classList.contains('focus-element')) {
                        el.classList.remove('focus-element');
                    }

                    el.classList.add('unfocus-element');
                }
            }
        }
    );
})();