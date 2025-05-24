/*

Portfolio Index Page
Author: Aaron Evans
Referenced Source: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
Last Update: 02/04/2024

*/
"use strict";

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
const errorList = "Abbreviation$All Caps$Repeating Characters$Audio only$Blank line$Color Contrast$Color as Meaning$Doc$Heading(accidental)$Heading(first level)$Heading(list)$Heading(skipped)$Image Alt-Text(insufficient)$Image Alt-Text(long)$Image Alt-Text(redundant)$Image(decorative)$Invisible$Language$Link(URL)$Link(broken)$Link(invisible)$Link(long)$Link(non-descriptive)$Link(redundant)$List(multi)$List$List(handmade)$PDF Present$Powerpoint$Table(headers)$Table(title)$Text Size$Underline$Video(closed captioning)$Word Doc";

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

//init select
window.addEventListener('load', function () {
    const combo = document.getElementById("combo1");
    if(combo.classList.contains("init")) {
        return;
    }
    else {
        combo.classList.add("init");
        new Select(combo);
    }
});