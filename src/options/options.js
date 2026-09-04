const optionsOverlayNode = document.getElementById('overlay');
const optionsConsoleLoggingNode = document.getElementById('consoleLogging');
const optionsNoBadgeAnimation = document.getElementById('noBadgeAnimation');
const optionsUserTimingNode = document.getElementById('userTiming');
const optionsPreferPhoneFieldNode = document.getElementById('preferPhoneField');
const optionsSaveBtn = document.getElementById('save');
const optionsStatus = document.getElementById('status');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.querySelector('.theme-icon');

/**
 * Apply the same dark/light theme the popup uses, stored in chrome.storage.sync.
 * If no explicit preference is set, prefers-color-scheme takes over via CSS.
 */
function applyTheme() {
  chrome.storage.sync.get({darkMode: null}, ({darkMode}) => {
    if (darkMode === true) {
      document.documentElement.classList.add('dark-mode');
      document.documentElement.classList.remove('light-mode');
      if (themeIcon) themeIcon.textContent = '☀️';
    } else if (darkMode === false) {
      document.documentElement.classList.add('light-mode');
      document.documentElement.classList.remove('dark-mode');
      if (themeIcon) themeIcon.textContent = '🌙';
    } else {
      // System preference
      document.documentElement.classList.remove('light-mode', 'dark-mode');
      if (themeIcon) themeIcon.textContent = window.matchMedia('(prefers-color-scheme: dark)').matches ? '☀️' : '🌙';
    }
  });
}

/**
 * Toggle dark/light theme and save to storage
 */
function toggleTheme() {
  chrome.storage.sync.get({darkMode: null}, ({darkMode}) => {
    const newDarkMode = darkMode === true ? false : true;
    chrome.storage.sync.set({darkMode: newDarkMode}, () => {
      applyTheme();
    });
  });
}

/**
 * Save options to Chrome storage
 */
function saveOptions() {
  chrome.storage.sync.set({
    enableOverlay: optionsOverlayNode.checked,
    debug: optionsConsoleLoggingNode.checked,
    userTiming: optionsUserTimingNode.checked,
    preferPhoneField: optionsPreferPhoneFieldNode.checked,
    noBadgeAnimation: optionsNoBadgeAnimation.checked,
  }, () => {
    // Update status to let user know options were saved.
    optionsStatus.textContent = 'Options saved';
    optionsStatus.classList.add('visible');
    setTimeout(() => {
      optionsStatus.classList.remove('visible');
    }, 1500);
  });
}

/**
 * Restores checkbox state using the preferences stored in chrome.storage
 */
function restoreOptions() {
  chrome.storage.sync.get({
    enableOverlay: false,
    debug: false,
    userTiming: false,
    preferPhoneField: false,
    noBadgeAnimation: false,
  }, ({enableOverlay, debug, userTiming, preferPhoneField, noBadgeAnimation}) => {
    optionsOverlayNode.checked = enableOverlay;
    optionsConsoleLoggingNode.checked = debug;
    optionsUserTimingNode.checked = userTiming;
    optionsPreferPhoneFieldNode.checked = preferPhoneField;
    optionsNoBadgeAnimation.checked = noBadgeAnimation;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  restoreOptions();
  themeToggle.addEventListener('click', toggleTheme);
});
optionsSaveBtn.addEventListener('click', saveOptions);