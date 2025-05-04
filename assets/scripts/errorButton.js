//form inputs
const textLookUp = "#:~:text=";
// let queryOptions = { active: true, currentWindow: true };
// button.addEventListener("click", () => {
//     chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
//         var currentUrl = tabs[0].url;
//         if(currentUrl.contains(textLookUp)) {
//             currentUrl = currentUrl.split("#")[0];
//         }
//         let text = currentUrl + textLookUp + button.parentElement.getAttribute("htmlRef");

//         chrome.tabs.query(queryOptions, ([tab]) => {
//             chrome.tabs.sendMessage( tab.id, {
//                 type: "SHOW-ERROR",
//                 url: text,
//             })
//         });
//     });
// });

document.getElementById("add-error1").addEventListener ("click", () => {
    console.log("clicked");
})

document.getElementById("form1").addEventListener("submit", () => {
    console.log("error added");
    chrome.tabs.query(queryOptions, ([tab]) => {
        chrome.tabs.sendMessage(tab.id, {
            type: "ADD-ERROR"
        })
    });
});