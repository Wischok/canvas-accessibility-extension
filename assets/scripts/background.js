chrome.webNavigation.onCompleted.addListener((object) => {
    if (object.url && object.url.includes("instructure.com/courses")) {
        //example link https://mtsac.instructure.com/courses/154014/pages/the-biological-old-regime?module_item_id=7241230
        const urlParameters = object.url.split("courses")[1].split("/");
        // const queryParameters = new URLSearchParams(urlParameters[3].split("?")[1]);

        chrome.tabs.sendMessage(object.tabId, {
            type: "NEW",
            courseId: urlParameters[1],//courseID
            pageType: urlParameters[2],//page type (e.g. page, quiz, discussion, etc.)
            pageTitle: urlParameters[3].split("?")[0], //page title
            tabId: object.tabId,
            // moduleItemId: queryParameters.get("module_item_id"),//module item id
        })
    }    
})
