import {getActiveTabURL} from ".utils.js";



//save new error row to group
const addNewError = () => {};
const viewErrors = () => {};
const setErrorAttributes = () => {};

document.addEventListener("DOMContentLoaded", async () => {
    const activeTab = 
});

var ErrorStates = {
    Complete: "[Changed and/or Fixed]",
    Professor: "[For Professor]",
    Reviewer: "[For Reviewer"
}

function Error (name, url, desc) {
    this.count = 0;//instances of this error
    this.name = name;
    this.url = url;
    this.desc = desc;

    this.
}

function ErrorInsance (error, location) {
    this.error = error;
    this.location = location;
    this.state = ""
}