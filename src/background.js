
"use strict";

(function () {
    // Set to true to enable logging output for debugging.
    const debugOutput = false;

    const settings = {
        openInNewTab: true,
        useHttps: true,
        configs: []
    };

    function logger(param) {
        if (debugOutput) { console.log(param); }
    }

    function onError(e) {
        console.error(e);
    }

    function unlinked(element, urlToLookFor) {
        return element && element.innerHTML.indexOf(urlToLookFor) === -1;
    }

    function linkifyPage(extensionSettings) {
        // Pull-Request listing page.
        const pullRequests = document.getElementsByClassName('js-issue-row');
        // Individual PR details page.
        const detailsPageTitle = document.querySelectorAll('span.js-issue-title');
        // Commits
        const commitListing = document.getElementsByClassName('commit-title');

        const protocol = settings.useHttps ? 'https://' : 'http://';

        for (let i = 0; i < extensionSettings.configs.length; i++) {
            const jiraIssueRegex = extensionSettings.configs[i].JiraIssueRegex;
            const jiraUrlToUse = protocol + extensionSettings.configs[i].JiraUrl;

            logger("Jira URL: " + jiraUrlToUse);

            if (pullRequests && pullRequests.length > 0) {
                logger("Found " + pullRequests.length + " pull-request(s).");

                for (let pr of pullRequests) {
                    logger("Looking at PR with id = " + pr.id);

                    if (unlinked(pr, jiraUrlToUse)) {
                        // Find the original PR link.
                        const prLinks = pr.getElementsByClassName('js-navigation-open');

                        if (prLinks && prLinks.length === 1) {
                            const origPrLink = prLinks[0];
                            const jiraNumbers = origPrLink.textContent.match(jiraIssueRegex);

                            if (jiraNumbers) {
                                for (let j = 0; j < jiraNumbers.length; j++) {
                                    const jiraIssue = jiraNumbers[j];

                                    // Remove the matching text (ICU-1243) from the PR link.
                                    origPrLink.text = origPrLink.text.replace(jiraIssue, '');

                                    // Create a new link.
                                    let newEl = document.createElement('a');
                                    newEl.text = jiraIssue + ' ';
                                    newEl.setAttribute('href', jiraUrlToUse + '/browse/' + jiraIssue);
                                    newEl.setAttribute('title', jiraIssue);
                                    // Remove the 'link-gray-dark' class from the JIRA  link, as we want it to stand out.
                                    newEl.setAttribute('class', origPrLink.className.replace('link-gray-dark', ''));
                                    if (extensionSettings.openInNewTab) {
                                        newEl.setAttribute('target', '_blank');
                                    }

                                    origPrLink.parentNode.insertBefore(newEl, origPrLink);
                                }
                            }
                        }
                    }
                }
            }

            if (detailsPageTitle && detailsPageTitle.length > 0) {
                logger("Found " + detailsPageTitle.length + " pr title(s).");

                const detailsTitle = detailsPageTitle[0];

                if (unlinked(detailsTitle, jiraUrlToUse)) {
                    const jiraNumbers = detailsTitle.textContent.match(jiraIssueRegex);

                    if (jiraNumbers) {
                        for (let j = 0; j < jiraNumbers.length; j++) {
                            const jiraIssue = jiraNumbers[j];

                            // Remove the matching text (ICU-1243) from the title.
                            detailsTitle.innerHTML = detailsTitle.innerHTML.replace(jiraIssue, '');

                            // Create a new link.
                            let newEl = document.createElement('a');
                            newEl.text = jiraIssue + ' ';
                            newEl.setAttribute('href', jiraUrlToUse + '/browse/' + jiraIssue);
                            newEl.setAttribute('title', jiraIssue);
                            if (extensionSettings.openInNewTab) {
                                newEl.setAttribute('target', '_blank');
                            }

                            detailsTitle.parentNode.insertBefore(newEl, detailsTitle);
                        }
                    }
                }
            }

            if (commitListing && commitListing.length > 0) {
                logger("Found " + commitListing.length + " commit(s).");
                for (let commitEntry of commitListing) {
                    if (unlinked(commitEntry, jiraUrlToUse)) {
                        // Check the "type" of the commit page that the user is looking at.
                        const commitLinks = commitEntry.getElementsByClassName('message');
                        if (commitLinks && commitLinks.length > 0) {
                            // Commit history page, with multiple commit titles.

                            // Get the original commit link(s).
                            // (There might be more than one, if the PR# was part of the commit title.)
                            const originalCommitLinkObj = commitLinks[0];
                            // Look for any JIRA issues in the commit title.
                            const issuesReferenced = originalCommitLinkObj.textContent.match(jiraIssueRegex);
                            if (issuesReferenced && issuesReferenced.length > 0) {
                                //logger(issuesReferenced);
                                // Create links for each JIRA issue.
                                const issues = new Array();
                                for (let jiraIssue of issuesReferenced) {
                                    const jiraCommitLink = document.createElement('a');
                                    jiraCommitLink.innerText = jiraIssue + ' ';
                                    jiraCommitLink.setAttribute('href', jiraUrlToUse + '/browse/' + jiraIssue);
                                    jiraCommitLink.setAttribute('title', jiraIssue);
                                    if (extensionSettings.openInNewTab) {
                                        jiraCommitLink.setAttribute('target', '_blank');
                                    }
                                    issues.push(jiraCommitLink);
                                }
                                // Remove the JIRA issue text from the original link text and title.
                                originalCommitLinkObj.title = originalCommitLinkObj.title.replace(jiraIssueRegex, '');
                                originalCommitLinkObj.textContent = originalCommitLinkObj.textContent.replace(jiraIssueRegex, '');
                                // Now insert the new JIRA link(s) before the real commit link.
                                const originalCommitLinkObjParent = originalCommitLinkObj.parentElement;
                                for (let i = 0; i < issues.length; i++) {
                                    originalCommitLinkObjParent.insertBefore(issues[i], originalCommitLinkObj);
                                }
                            }
                        } else {
                            // Single commit details page.

                            const jiraNumbers = commitEntry.textContent.match(jiraIssueRegex);

                            if (jiraNumbers) {
                                for (let j = 0; j < jiraNumbers.length; j++) {
                                    const jiraIssue = jiraNumbers[j];

                                    // Remove the matching text (ICU-1243) from the title.
                                    commitEntry.innerHTML = commitEntry.innerHTML.replace(jiraIssue, '');

                                    // Create a new link.
                                    let newEl = document.createElement('a');
                                    newEl.text = jiraIssue + ' ';
                                    newEl.setAttribute('href', jiraUrlToUse + '/browse/' + jiraIssue);
                                    newEl.setAttribute('title', jiraIssue);
                                    if (extensionSettings.openInNewTab) {
                                        newEl.setAttribute('target', '_blank');
                                    }

                                    commitEntry.parentNode.insertBefore(newEl, commitEntry);
                                }
                            }
                        }
                    }
                }
            }

        }
    }

    function modifyPage(storedSettings) {
        if (!storedSettings || !storedSettings.extensionSettings) {
            logger("Extension not configured yet.");
            return;
        }

        settings.openInNewTab = storedSettings.extensionSettings.useNewTab ? true : false;
        settings.useHttps = storedSettings.extensionSettings.useHttps ? true : false;
        settings.configs.push({
            JiraIssueRegex: RegExp('([A-Z]{2,10}\-[0-9]+)+', 'g'),
            JiraUrl: storedSettings.extensionSettings.jiraUrl
        });

        // Note: We run at document_end, so DOMContentLoaded has already happened.
        // Do an initial pass over the page.
        linkifyPage(settings);

        // Scan for changes every 3 seconds.
        setInterval(() => {
           linkifyPage(settings) ;
        }, 3000);

        /*
        Unfortunately, using the MutationObserver doesn't work as well as I hoped.
        GitHub will reload the contents without causing the callback to fire. :(

        // This seems to be the main 'container' that GitHub uses for repository content.
        var repoContent = document.getElementsByClassName('repository-content');
        if (repoContent.length != 1) {
            logger('GitHub changed their page layout!');
            return;
        }
        const targetNode = repoContent[0];
        const config = { attributes: true, characterData: true, childList: true, subtree: true };
        const callback = function (mutationsList, observer) {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    console.log('A child node has been added or removed.');
                }
                else if (mutation.type === 'attributes') {
                    console.log('The ' + mutation.attributeName + ' attribute was modified.');
                }
                else if (mutation.type === 'characterData') {
                    console.log('The characterData was modified.');
                }
                else {
                    console.log('Other mutation occurred: ' + mutation.type);
                }
                //linkifyPage(settings);
            }
        };
        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
        //observer.disconnect();
        */
    }

    function init() {
        logger("GitHub JIRA link helper extension is loaded");
        const gettingStoredSettings = browser.storage.local.get();
        gettingStoredSettings.then(modifyPage, onError);
    }

    init();
})();
