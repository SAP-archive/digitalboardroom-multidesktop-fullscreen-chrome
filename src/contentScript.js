'use strict';

document.addEventListener("keydown", function(e) {
    console.log(e);
    chrome.runtime.sendMessage({method: 'keydown', keyInfo: {altKey: e.altKey, ctrlKey: e.ctrlKey, keyCode: e.keyCode } }, function(r) {
        console.log(r);
    });
});

