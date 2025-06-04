// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const ORIGIN = 'instructure.com';

// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url) return;

  // Enables the side panel on Canvas instructure
  if (new URL(tab.url).host.includes(ORIGIN)) {
    await chrome.sidePanel.setOptions({
      tabId,
      path: '/assets/html/sidepanel.html',
      enabled: true
    });
  } else {
    // Disables the side panel on all other sites
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: false
    });
  }
});

chrome.webNavigation.onCompleted.addListener((object) => {
    if (object.url && object.url.includes("instructure.com/courses")) {
        //example link https://mtsac.instructure.com/courses/154014/pages/the-biological-old-regime?module_item_id=7241230
        const urlParameters = object.url.split("courses")[1].split("/");
        // const queryParameters = new URLSearchParams(urlParameters[3].split("?")[1]);

        chrome.tabs.sendMessage(object.tabId, {
            type: "NEW",
            courseId: urlParameters[1],//courseID
            pageType: urlParameters[2],//page type (e.g. page, quiz, discussion, etc.)
            tabId: object.tabId,
        })
    }    
})
