
const jiraUrlInput = document.getElementById('jiraUrlTextBox');
const useHttpsInput = document.getElementById('useHttpsCheckbox');
const openInNewTabInput = document.getElementById('openLinksInNewTab');
const statusMessage = document.getElementById('status');

function onError(e) {
    console.error(e);
}

function saveOptions() {
    browser.storage.local.set({
        extensionSettings: {
            jiraUrl: jiraUrlInput.value,
            useHttps: useHttpsInput.checked,
            useNewTab: openInNewTabInput.checked
        }
    }).then(function () {
        // update the status message for the user.
        statusMessage.textContent = "Saved!";
        setTimeout(function () {
            statusMessage.textContent = '';
        }, 1000);
    }, onError);
}

function populateOptions(settings) {
    jiraUrlInput.value = settings.extensionSettings.jiraUrl || '';
    useHttpsInput.checked = settings.extensionSettings.useHttps || false;
    openInNewTabInput.checked = settings.extensionSettings.useNewTab || false;
}

function restoreOptions() {
    const gettingStoredSettings = browser.storage.local.get();
    gettingStoredSettings.then(populateOptions, onError);
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
