
/*
    Copyright 2016, SAP SE

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at
    
       http://www.apache.org/licenses/LICENSE-2.0
    
    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

/**
 * Scripts for the app.html web page.
 */

console.info("Start app window");

document.addEventListener("DOMContentLoaded", function () {
    // App options.
    var options = {
        url: ""
    };
    // App info - passed in from "main.js".
    var appInfo = {};
    // App init.
    var appInit = true;
    // Tabs.
    var tabs = [];
    var newTabId = 1;
    var activeTab = undefined;

    // Get the DOM controls.
    var webviews = document.getElementById("webViews");
    var helpWindow = document.getElementById("helpWindow");
    var helpOkButton = document.getElementById("helpOkButton");
    var optionsWindow = document.getElementById("optionsWindow");
    var optionsOkButton = document.getElementById("optionsOkButton");
    var optionsResetButton = document.getElementById("optionsResetButton");
    var status = document.getElementById("status");
    var homePageUrlInput = document.getElementById("homePageUrlInput");
    var splashScreenWindow = document.getElementById("splashScreenWindow");
    var popupWindows = document.getElementById("popupWindows");
    var popupWindowBlocker = document.getElementById("popupWindowBlocker");
    var contentBlockerLayer = document.getElementById("contentBlocker");
    var helpDesktopInfo = document.getElementById("helpDesktopInfo");
    var helpAppVersionInfo = document.getElementById("helpAppVersionInfo");
    
    var tabButtons = document.getElementById("tabButtons");
    var toolbar = document.getElementById("toolbar");
    var homeButton = document.getElementById("homeButton");
    var urlInput = document.getElementById("urlInput");
    var fullscreenButton = document.getElementById("fullscreenButton");
    var settingsButton = document.getElementById("settingsButton");
    var newTabButton = document.getElementById("newTabButton");
    var allTabButtons = document.getElementById("allTabButtons");

    // Create a browser (webview tag) new tab.
    var newTab = function (url) {
        var webview = document.createElement("webview");
        var tabButton = document.createElement("span");
        var tabCloseButton = document.createElement("span");

        // Add the tab (webview and status message) to the list of tabs.
        var tab = {
            id: newTabId,
            url: url,
            status: "",
            hasLoadError: false,
            webview: webview,
            button: tabButton
        };
        tabs.push(tab);
        console.log("New tab [" + tab.id + "]");

        // When the user presses the bat button switch to that tab.
        tabButton.addEventListener("click", function (e) {
            // Switch to the selected tab.
            switchTab(webview.id);
        });

        // When the user clicks the close tab button - close it.
        tabCloseButton.addEventListener("click", function (e) {
            // Close this tab.
            var tab = findTab(webview.id);
            closeTab(tab);
        });

        tabButton.className = "tab";
        
        // Keep track of the load status.
        webview.addEventListener("loadabort", function (e) {
            var tab = findTab(webview.id);
            if (tab) {
                tab.hasLoadError = true;
                tab.status = "Could not load, error (" + e.code + "): " + e.reason;
                
                // If this is the active tab show the status.
                if (activeTab === tab) {
                    status.innerHTML = tab.status;
                }
            }
        });
        // Page loading.
        webview.addEventListener("loadstart", function (e) {
            webviews.style.cursor = "wait";
            var tab = findTab(webview.id);
            if (tab) {
                if (e.isTopLevel) {
                    tab.hasLoadError = false;
                    tab.url = e.url;
                    tab.status = "Loading, please wait...";

                    // If this is the active tab show the status.
                    if (activeTab === tab) {
                        urlInput.value = tab.url;
                        status.innerHTML = tab.status;
                    }
                }
            }
        });
        // Page loaded.
        webview.addEventListener("loadstop", function (e) {
            webviews.style.cursor = "";
            var tab = findTab(webview.id);
            if (tab) {
                if (!tab.hasLoadError) {
                    tab.status = "";

                    // If this is the active tab show the status.
                    if (activeTab === tab) {
                        status.innerHTML = tab.status;
                    }
                }
            }
        });
        // Redirected to a different URL.
        webview.addEventListener("loadredirect", function (e) {
            var tab = findTab(webview.id);
            if (tab) {
                if (e.isTopLevel) {
                    tab.url = e.newUrl;
                    console.info("Redirect tab [" + tab.id + "] to: " + tab.url);

                    // If this is the active tab show the status.
                    if (activeTab === tab) {
                        status.innerHTML = tab.status;
                        urlInput.value = tab.url;
                    }
                }
            }
        });
        // New window - open in a new tab.
        webview.addEventListener("newwindow", function (e) {
            var tab = findTab(webview.id);
            if (tab) {
                newTab(e.targetUrl);
            }
        });
        
        //Close the tab when the guest window tries to close itself
		webview.addEventListener('close', function() {
			// Close this tab.
			var tab = findTab(webview.id);
            closeTab(tab);
		});
        
        webview.setZoomMode("disabled"); // Do not allow zooming.

        tabButton.innerHTML = "" + newTabId;

        // Uniqnue tab id (counter).
        webview.id = "webView_" + newTabId;
        tabButton.id = "tab_" + newTabId;
        ++newTabId;

        // Use one partition to share the logon info session across all open tabs
        webview.setAttribute("partition", "sharedsession");

        webview.className = "webView";
        
        tabCloseButton.className = "closeTabButton";

        tabButton.appendChild(tabCloseButton);
        tabButtons.appendChild(tabButton);
        webviews.appendChild(webview);

        // Switch to the new tab if it is not the SAML SSO pop-up tab.
		// To Do: The condition can be further finetuned.
        if (url.toLowerCase().indexOf('ina') == -1 || url.toLowerCase().indexOf('auth') == -1){
			switchTab(webview.id);
		}
        
        // Give focus to the URL bar so the user could start to type in a URL.
        urlInput.focus();
        
        // Navigate to the URL.
        navigateTo(tab, url);
    }

    // Close a tab.
    var closeTab = function (tab) {
        if (tab) {
            var idx = tabs.indexOf(tab);
            if (idx > -1) {
                tabs.splice(idx, 1);
                tab.button.parentNode.removeChild(tab.button);
                tab.webview.parentNode.removeChild(tab.webview);
                console.log("Closed tab [" + tab.id + "]");

                if (tab === activeTab) {
                    // Closed the active tab.
                    // Select a tab (try the one to the left - if there isn't one go with the tab to the right).
                    if ((idx-1) > -1) {
                        tab = tabs[idx-1];  // The tab to the left.
                        switchTab(tab.webview.id);
                    } else if (idx < tabs.length) {
                        tab = tabs[idx];  // The tab to the right.
                        switchTab(tab.webview.id);
                    }
                }
            }
        }

        // If we deleted the last tab create a new one that goes to the home page.
        if (tabs.length < 1) {
            newTab(options.url);
        }
    };
    
    // Switch to show a specific tab by id.
    var switchTab = function(tabId){
        // Activate the tab.
        var tab = findTab(tabId);
        if (tab) {
            // Hide the tabs.
            for (var i=0; i < tabs.length; i++) {
                var myTab = tabs[i];
                myTab.webview.style.visibility = "hidden";
                myTab.button.className = "tab";
            }

            // Show the active tab.
            activeTab = tab;
            activeTab.webview.style.visibility = "visible";
            activeTab.button.className += " activeTab";
            urlInput.value = tab.url;
            status.innerText = tab.status;
            console.log("Switched to tab [" + activeTab.id + "]");
        }
    };

    // Find a tab by id from the "tabs" array.
    var findTab = function(tabId) {
        // Find the tab by its id.
        for (var i=0; i < tabs.length; i++) {
            var myTab = tabs[i];
            if (myTab && myTab.webview.id === tabId) {
                return myTab;
            }
        }
        return undefined;
    };
    
    // Create a new tab.
    newTabButton.addEventListener("click", function (e) {
        console.info("New tab");
        newTab(options.url);
    });
    
    // Keys.
    var KEY_ENTER = 13;
    var KEY_F1 = 112;
    var KEY_F4 = 115;
    var KEY_F5 = 116;
    var KEY_F10 = 121;
    var KEY_F11 = 122;
    var KEY_ESC = 27;
    var KEY_HOME = 36;
    var KEY_TAB = 9;
    var KEY_N = 78;
    var KEY_T = 84;

    // Navigate in a tab to a URL.
    var navigateTo = function (tab, url) {
        // If we are missing the URL prefix (which webpage.src needs default to "http"
        if (/^(?:file)?\:\/\//.test(url)) {
            // A file URL.
            var msg = "URL cannot refer to a local file";
            console.error("Tab [" + tab.id + "]: " + msg + ": " + url);
            tab.hasLoadError = true;
            tab.status = "Error: " + msg;

            // If this is the active tab show the status error.
            if (activeTab === tab) {
                status.innerHTML = tab.status;
            }
        } else if (!/^(?:http|https)?\:\/\//.test(url)) {
            // Does not start with "http" or "https" so default to "http".
            console.info("Navigate tab [" + tab.id + "] to: [added prefix: http://] " + url);
            tab.webview.src = "http://" + url;
        } else {
            console.info("Navigate tab [" + tab.id + "] to: " + url);
            tab.webview.src = url;
        }
    }
    
    //--------------------
    // Open the home page.
    //--------------------
    var goHome = function () {
        console.info("Go to home page");
        activeTab.webview.src = "";  // Clear the URL.
        activeTab.url = options.url;
        urlInput.value = activeTab.url;
        navigateTo(activeTab, activeTab.url);
    };
    homeButton.addEventListener("click", function (e) {
        // Go to the home page.
        goHome();
    });
    // URL input key down handler to close the options when we press ENTER.
    urlInput.addEventListener("keydown", function (e) {
        if (e.keyCode === KEY_ENTER) { // Enter
            activeTab.url = urlInput.value;
            navigateTo(activeTab, activeTab.url);
        }
    });

    //-----------------------------------------------
    // Toggle full screen (show or hide the toolbar).
    //-----------------------------------------------
    fullscreenButton.addEventListener("click", function (e) {
        toggleFullScreen();
    });    
    var toggleFullScreen = function() {
        var visible = ! isVisible(toolbar);  // Toggle visible flag.
        var isFullScreen = visible == false;

        // Toggle the toolbar.
        allTabButtons.style.visibility = toolbar.style.visibility = (visible ? "visible" : "hidden");

        // Show full screen (if the toolbar is hidden) or not.
        webviews.className = (isFullScreen ? "webViewsFullScreen" : "webViews");

        if (isVisible(toolbar)) {
            console.info("Use full screen mode");
        } else {
            console.info("Stop using full screen mode");
        }
    };

    //-------------
    // Help window.
    //-------------
    // Toggle the help window.
    var toggleHelpWindow = function () {
        if (isVisible(helpWindow)) {
            console.info("Close help window");
            setVisible(helpWindow, false);
        } else {
            console.info("Show help window");
            setVisible(helpWindow, true);
        }
    };
    // Help ok (close) button handler.
    helpOkButton.addEventListener("click", function (e) {
        // Hide the help window.
        console.info("Close help window");
        setVisible(helpWindow, false);
    });

    //----------------
    // Options window.
    //----------------
    // Toggle the options window.
    var toggleOptionsWindow = function () {
        if (isVisible(optionsWindow)) {
            closeOptionsWindow(true); // Close and save the options window.
        } else {
            console.info("Show options window");
            setVisible(optionsWindow, true);
        }
    };
    settingsButton.addEventListener("click", function (e) {
        toggleOptionsWindow();    
    });
    // Close options window and optionally save the settings.
    var closeOptionsWindow = function (save) {
        // Close the options window.
        if (isVisible(optionsWindow)) {
            var urlChanged = false;
            if (save) {
                // Check for changes.
                var optionsChanged = false;
                if (homePageUrlInput.value !== options.url) {
                    urlChanged = true;
                    optionsChanged = true;
                    options.url = homePageUrlInput.value;
                }

                // Save the options.
                if (optionsChanged) {
                    // Ask "main.js" to save the options.
                    chrome.runtime.sendMessage({
                        method: "setOptions",
                        options: options
                    }, function (response) {
                        console.info("Notified set options");
                    });
                }
            }

            // Hide the options window.
            console.info("Close options window");
            setVisible(optionsWindow, false);
        }
    };
    // Options ok (close/save) button handler.
    optionsOkButton.addEventListener("click", function (e) {
        closeOptionsWindow(true);
    });
    // Options reset button handler.
    optionsResetButton.addEventListener("click", function (e) {
        // Ask "main.js" to reset the options.
        chrome.runtime.sendMessage({
            method: "resetOptions",
        }, function (response) {
            console.info("Notified reset options");
        });
    });
    // URL input key down handler to close the options when we press ENTER.
    homePageUrlInput.addEventListener("keydown", function (e) {
        if (e.keyCode === KEY_ENTER) { // Enter
            closeOptionsWindow(true);
        }
    });

    // Show or hide a window.
    var setVisible = function (item, visible) {
        item.style.visibility = (visible ? "visible" : "hidden");

        // Get all our popup windows and find out if any of them are visible.
        var blockContent = false;
        var windows = document.querySelectorAll(".window");
        for (var i = 0; i < windows.length; i++) {
            var win = windows[i];
            if (isVisible(win)) {
                // Showing a window so we want to use the web page content blocker layer.
                blockContent = true;
                break;
            }
        }

        // Show or hide the content blocker depending on whether we have a window shown or not.
        contentBlockerLayer.style.visibility = (blockContent ? "visible" : "hidden");
        toolbar.style.pointerEvents = (blockContent ? "none" : "");
        webviews.style.pointerEvents = (blockContent ? "none" : "");
    };
    // Is something in the DOM visible?
    var isVisible = function (item) {
        return item.style.visibility !== "hidden";
    };

    //---------------
    // Splash screen.
    //---------------
    // Close the splash screen - if we are using the default URL show the Options window.
    var closeSplashScreen = function () {
        // Hide the splash screen.
        console.info("Hiding the splash screen");
        popupWindows.style.pointerEvents = "";  // Allow the mouse again.
        popupWindowBlocker.style.visibility = "hidden";
        setVisible(splashScreenWindow, false);

        // Give focus to the URL input.
        urlInput.focus();
    };

    // Global keyboard handlers.
    document.addEventListener("keydown", function (e) {
        if (e.keyCode === KEY_F1) { // Help (F1)
            console.info("Toggle help window (F1)");
            toggleHelpWindow();
        } else if (e.keyCode === KEY_F5 && e.ctrlKey === false) { // Reload page (F5)
            console.info("Reload page (F5)");
            if (activeTab) {
                if (activeTab.hasLoadError) {
                    // Failed to load the URL before, so try again now.
                    navigateTo(activeTab, options.url);
                } else {
                    // Reload.
                    activeTab.webview.reload();
                }
            }
        } else if (e.altKey && e.keyCode === KEY_HOME) {  // Home page (Alt + Home)
            console.info("Home page (Alt + Home)");
            if (activeTab) {
                goHome();
            }
        } else if (e.altKey && e.keyCode === KEY_F4) { // Exit (Alt + F4)
            console.info("Exit (Alt + F4)");
            // Ask "main.js" to close this window.
            chrome.runtime.sendMessage({
                method: "appExit",
            }, function (response) {
                console.info("Notified app exit");
            });
        } else if (e.ctrlKey && e.keyCode === KEY_F4) { // Close tab (Ctrl + F4)
            console.info("Close active tab (Ctrl + F4)");
            closeTab(activeTab);
        } else if (e.keyCode === KEY_F10) { // Settings (F10)
            console.info("Toggle options window (F10)");
            toggleOptionsWindow();
        } else if (e.keyCode === KEY_F11) {  // Toggle full screen (F11)
            console.info("Toggle full screen (F11)");
            toggleFullScreen();
        } else if (e.keyCode === KEY_ESC) { // Stop loading this page or close Help (Escape)
            console.info("Stop loading page (Esc)");
            if (activeTab) {
                activeTab.webview.stop();
            }
        } else if (e.ctrlKey && e.keyCode === KEY_N)  {  // New tab (Ctrl + N)
            console.info("New tab (Ctrl + N)")
            newTab(options.url);
        } else if (e.ctrlKey && e.keyCode === KEY_T)  {  // New tab (Ctrl + T)
            console.info("New tab (Ctrl + T)")
            newTab(options.url);
        } else if (e.ctrlKey && e.shiftKey && e.keyCode === KEY_TAB)  {  // Previous tab (Ctrl + Shift + Tab)
            console.info("Previous tab (Ctrl + Shift + Tab)")
            var idx = tabs.indexOf(activeTab);
            if (idx > -1) {
                idx--;
                if (idx < 0) {
                    // Loop around to the last tab again.
                    idx = tabs.length - 1;
                }
                var tab = tabs[idx];
                switchTab(tab.webview.id);
            }
        } else if (e.ctrlKey && e.keyCode === KEY_TAB)  {  // Next tab (Ctrl + Tab)
            console.info("Next tab (Ctrl + Tab)")
            var idx = tabs.indexOf(activeTab);
            if (idx > -1) {
                idx++;
                if (idx >= tabs.length) {
                    // Loop around to the first tab again.
                    idx = 0;
                }
                var tab = tabs[idx];
                switchTab(tab.webview.id);
            }
        }
    });

    // Callback handler from "main.js" to notify when the app options have been changed.
    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            console.log("Received message: " + request.method);

            if (request.method === "optionsChanged") {
                // Store the new settings.
                options = request.options;

                console.info("Options changed: " + JSON.stringify(options));

                // Update the options window.
                homePageUrlInput.value = options.url;
                
                // If we have not initialized the app yet do it now.
                if (appInit) {
                    // Create a new tab and navigate to the home page.
                    appInit = false;
                    newTab(options.url);
                }
            } else if (request.method === "appInfoChanged") {
                // Update desktop size info.
                appInfo = request.appInfo;
                helpDesktopInfo.innerHTML = "Number of desktops: " + appInfo.displayCount + ", desktop resolution: " + appInfo.displayWidth + " x " + appInfo.displayHeight + " pixels.";
                // Update app version.
                helpAppVersionInfo.innerHTML = "App version: " + appInfo.appVersion;
            }

            // Respond back to the message.
            sendResponse({});
        });

    // Show the splash screen for 5 seconds.
    setVisible(splashScreenWindow, true);
    popupWindowBlocker.style.visibility = "visible";
    popupWindows.style.pointerEvents = "none";  // Disable the mouse during splash screen.
    setTimeout(closeSplashScreen, 5000);
    console.info("App window ready");

    // Tell "main.js" we are ready to navigate so we can load the app options.
    chrome.runtime.sendMessage({
        method: "appReadyToNavigate",
    }, function (response) {
        console.info("Notified app window ready to navigate");
    });
});
