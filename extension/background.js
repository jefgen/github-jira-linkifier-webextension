
"use strict";

(function () {

    const debugOutput = false;

    function logger(param) {
        if (debugOutput) { console.log(param); }
    }

    function onError(e) {
        console.error(e);
    }

    function unlinked(element, urlToLookFor) {
        return element && element.innerHTML.indexOf(urlToLookFor) == -1;
    }

    function modifyPage(storedSettings) {
        if (!storedSettings.extensionSettings) {
            logger("Extension not configured yet.");
            return;
        }
        
        const jiraIssueRegex = /([A-Z]{2,10}\-[0-9]+)+/g;
        var openInNewTab = storedSettings.extensionSettings.useNewTab ? "target=\"_blank\"" : "";
        var protocol = storedSettings.extensionSettings.useHttps ? "https://" : "http://";
        var jiraUrlToUse = protocol + storedSettings.extensionSettings.jiraUrl + ".atlassian.net";
        logger("Jira URL: " + jiraUrlToUse);

        // GitHub can change the contents of the page without reloading, so
        // we need to periodically run this...
        setInterval(function () { 
            // Pull-Request listing page.
            var pullRequests = document.getElementsByClassName('js-issue-row');
            logger("Found " + pullRequests.length + " pull-request(s).");
            for (let pr of pullRequests) {
                if (unlinked(pr, jiraUrlToUse)) {
                    // Find the original PR link.
                    var prLinks = pr.getElementsByClassName('js-navigation-open');
                    if (prLinks.length == 1) {
                        var originalPrLinkObj = prLinks[0];
                        // We want the JIRA links to stand out visually from the PR link.
                        var jiraLinkClass = originalPrLinkObj.className.replace('js-navigation-open', '');
                        jiraLinkClass = jiraLinkClass.replace('link-gray-dark', '');

                        pr.innerHTML = pr.innerHTML.replace(jiraIssueRegex,
                            "<a class=\""+ jiraLinkClass + "\" " + openInNewTab + " href=\"" + jiraUrlToUse + "/browse/$&\">$&</a>\
                            <a href=\"" + originalPrLinkObj.getAttribute('href') + "\" class=\"" + originalPrLinkObj.className +"\">");
                        
                        // Fix up the nested link elements caused by the above replace.
                        var newPrLinks = pr.getElementsByClassName('js-navigation-open');
                        if (newPrLinks == 2) {
                            newPrlinks[0].remove(); // remove the now empty first one.
                        }
                    }
                }
            }

            // Individual PR details page.
            var detailsPageTitle = document.getElementsByClassName('js-issue-title');
            logger("Found " + detailsPageTitle.length + " pr title(s).");
            if (detailsPageTitle.length == 1) {
                var detailsPageTitleObj = detailsPageTitle[0];
                if (unlinked(detailsPageTitleObj, jiraUrlToUse)) {
                    detailsPageTitleObj.innerHTML = detailsPageTitleObj.innerHTML.replace(jiraIssueRegex,
                        "<a " + openInNewTab + " href=\"" + jiraUrlToUse + "/browse/$&\">$&</a>");
                }
            }
            
            // Commits
            var commitListing = document.getElementsByClassName('commit-title');
            logger("Found " + commitListing.length + " commit(s).");
            for (let commitEntry of commitListing) {
                if (unlinked(commitEntry, jiraUrlToUse)) {
                    // Check the type of commit page.
                    var commitLinks = commitEntry.getElementsByClassName('message');
                    if (commitLinks.length > 0) {
                        // Commit history page, with multiple commit titles.

                        // Get the original commit link(s).
                        // (There might be more than one, if the PR# was part of the commit title.)
                        var originalCommitLinkObj = commitLinks[0];
                        // Look for any JIRA issues in the commit title.
                        var issuesReferenced = originalCommitLinkObj.textContent.match(jiraIssueRegex);
                        if (issuesReferenced.length > 0) {
                            logger(issuesReferenced);
                            // Create links for each JIRA issue.
                            var issues = new Array();
                            for (let jiraIssue of issuesReferenced) {
                                var jiraCommitLink = document.createElement('a');
                                jiraCommitLink.innerHTML = jiraIssue + ' ';
                                jiraCommitLink.setAttribute('href', jiraUrlToUse + "/browse/" + jiraIssue);
                                jiraCommitLink.setAttribute('title', jiraIssue);
                                if (openInNewTab) {
                                    jiraCommitLink.setAttribute('target', '_blank');
                                }
                                issues.push(jiraCommitLink);
                            }
                            // Remove the JIRA issue text from the original link text and title.
                            originalCommitLinkObj.title = originalCommitLinkObj.title.replace(jiraIssueRegex, '');
                            originalCommitLinkObj.textContent = originalCommitLinkObj.textContent.replace(jiraIssueRegex, '');
                            // Now insert the new JIRA link(s) before the real commit link.
                            var originalCommitLinkObjParent = originalCommitLinkObj.parentElement;
                            for (var i=0; i<issues.length; i++) {
                                originalCommitLinkObjParent.insertBefore(issues[i], originalCommitLinkObj);
                            }
                        }
                    } else {
                        // Single commit details page.
                        commitEntry.innerHTML = commitEntry.innerHTML.replace(jiraIssueRegex,
                            "<a " + openInNewTab + " href=\"" + jiraUrlToUse + "/browse/$&\">$&</a>");
                    }
                }
            }
        }, 2000);
    }

    function init() {
        logger("GitHub JIRA link helper extension is loaded");
        const gettingStoredSettings = browser.storage.local.get();
        gettingStoredSettings.then(modifyPage, onError);
    }

    init();
})();