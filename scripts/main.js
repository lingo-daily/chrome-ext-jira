console.log('KJU Chrome Extension running on', window.document.title);

const FADE_IN_OUT_TIMEOUT = 222;
const STATUS_MESSAGE_CLASS_NAME = 'kju-status-message';

const styleElement = document.createElement('style');
styleElement.textContent = `
    .rich-link-button { 
      background-color: transparent;
      border-radius: 50%;
      border-color: navy;
      margin: 0 0.3rem;
      display: inline-block;
      width: 2rem;
      height: 2rem;
      transition: background-color ${FADE_IN_OUT_TIMEOUT}ms ease-in-out;
    }
  
    .rich-link-button:hover { 
      background-color: #eee; 
    }
    
    .${STATUS_MESSAGE_CLASS_NAME} {  
      position: fixed;
      top: 2rem;
      left: 50%;
      transform: translateX(-50%);
      transition: opacity ${FADE_IN_OUT_TIMEOUT}ms ease-in-out;
      background-color: #000E;
      z-index: 999999;
      color: gold;
      border: 1px solid silver;
      box-shadow: 0px 0px 4px 2px #6666;
      padding: 1rem;
      border-radius: 0.5rem; 
    }
`;
document.head.appendChild(styleElement);

function getIssueLink() {
    return document.querySelector(
        '[data-testid="issue.views.issue-base.foundation.breadcrumbs.current-issue.item"]',
    );
}

function getIssueSummary() {
    return document.querySelector(
        '[data-testid="issue.views.issue-base.foundation.summary.heading"]',
    )?.innerText;
}

function getActionsBar() {
    return document.querySelector('div[aria-label="Action items"] > div') ??
        // legacy
        document.querySelector('button[aria-label="Actions"]')?.parentNode
            .parentNode.parentNode.parentNode.parentNode;
}

function styleButton(button) {
    button.classList.add('rich-link-button');
}

function findIssueWriteLink() {
    const issueLink = getIssueLink();
    if (!issueLink) {
        console.log('Jira issue link not found');
        return;
    }

    const issueKey = issueLink.textContent;

    const issueSummary = getIssueSummary();

    if (!issueSummary) {
        console.log('Issue summary not found');
        return;
    }

    writeLinkToClipboard(issueKey, issueSummary, issueLink.href);
}

function setUpCopyIssueLinkButton() {
    if (document.getElementById('kju-copy-link')) {
        return;
    }
    try {
        const copyLinkButton = document.createElement('button');
        copyLinkButton.id = 'kju-copy-link';
        copyLinkButton.innerText = '🔗';
        copyLinkButton.title = 'Copy formatted link';
        styleButton(copyLinkButton);

        copyLinkButton.addEventListener('click', findIssueWriteLink);

        const actionsBar = getActionsBar();

        if (actionsBar) {
            actionsBar.prepend(copyLinkButton);
        } else {
            console.log('KJU: action bar not found!');
        }
    } catch (e) {
        console.error(e);
    }
}

function showStatusMessage(message, duration = 2000) {
    const statusMessages = document.getElementsByClassName(
        STATUS_MESSAGE_CLASS_NAME,
    );
    if (statusMessages) {
        [...statusMessages].forEach((statusMessage) => statusMessage.remove());
    }

    const messageBar = document.createElement('div');
    messageBar.innerText = message;
    messageBar.classList.add(STATUS_MESSAGE_CLASS_NAME);
    messageBar.style.opacity = '0';

    document.body.append(messageBar);
    // give DOM time to mount the element and apply styles to it
    setTimeout(() => {
        messageBar.style.opacity = '1';
    }, 10); // 1 was not enough

    setTimeout(() => {
        messageBar.style.opacity = '0';
        setTimeout(() => {
            messageBar.remove();
        }, FADE_IN_OUT_TIMEOUT);
    }, duration);
}

function writeLinkToClipboard(prefix, name, href) {
    try {
        const plainText = `${prefix} ${name} ${href}`;
        const formattedLink = `<a href="${href}">${prefix} ${name}</a>`;

        const plainTextBlob = new Blob([plainText], {type: 'text/plain'});
        const htmlBlob = new Blob([formattedLink], {type: 'text/html'});

        const clipboardItem = new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': plainTextBlob,
        });
        navigator.clipboard
            .write([clipboardItem])
            .then(() => {
                showStatusMessage('Jira link copied!');
            })
            .catch((err) => {
                console.error('Failed to copy Jira link: ', err);
            });
    } catch (error) {
        window.alert(error);
    }
}

function writeGitCommandToClipboard(gitCommandText) {
    const plainTextBlob = new Blob([gitCommandText], {type: 'text/plain'});

    const clipboardItem = new ClipboardItem({
        'text/plain': plainTextBlob,
    });

    navigator.clipboard
        .write([clipboardItem])
        .then(() => {
            showStatusMessage('Git command copied!');
        })
        .catch((error) =>
            console.error('Failed to put git command onto the clipboard', error),
        );
}

function findIssueWriteGitCommand() {
    const issueLink = getIssueLink();
    if (!issueLink) {
        console.log('Jira issue link not found');
        return;
    }

    const issueKey = issueLink.textContent;

    const issueSummary = getIssueSummary();
    if (!issueSummary) {
        console.log('Issue summary not found');
        return;
    }

    const typeImage = document.querySelector(
        '[data-testid="issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue-container"] img',
    );
    if (!typeImage) {
        console.log('KJU: issue type image is not found');
        return;
    }

    const isBug = /\bbug\b/i.test(typeImage.alt);

    const sanitizedSummary = issueSummary
        .replace(/\W+/g, '-')
        .replace(/(^-|-$)/g, '')
        .replace(/^UI-/, '')
        .replace(/^BE-/, '')
        .replace(/^QA-/, '');

    const gitCommand = `git checkout -b ${isBug ? 'bugfix' : 'feature'}/${issueKey}-${sanitizedSummary}`;

    writeGitCommandToClipboard(gitCommand);
}

function setupCopyBranchCommandButton() {
    if (document.getElementById('kju-copy-git')) {
        return;
    }
    const copyGitCommandButton = document.createElement('button');
    copyGitCommandButton.id = 'kju-copy-git';
    copyGitCommandButton.innerText = 'ᛘ';
    copyGitCommandButton.title = 'Copy Git command to create a prefixed branch';
    styleButton(copyGitCommandButton);
    copyGitCommandButton.addEventListener('click', findIssueWriteGitCommand);

    const actionsBar = getActionsBar();
    if (actionsBar) {
        actionsBar.prepend(copyGitCommandButton);
    } else {
        console.log('KJU: Jira actions bar not found!');
    }
}

setInterval(() => {
    setupCopyBranchCommandButton();
    setUpCopyIssueLinkButton();
}, 2000);

setupCopyBranchCommandButton();
setUpCopyIssueLinkButton();
