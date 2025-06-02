chrome.debugger.onEvent.addListener( (source, method, params) => {
    if(method === "Log.entryAdded") {
        console.log('log log log');
    }
})