(async () => {
    let val;
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    console.log(tab);
    await chrome.debugger.sendCommand(tab.id, "Log.LogEntry", {source: "javascript",level: "info",text: "log log log"})
    .then(respone => {
        console.log(respone);
    })
})();

