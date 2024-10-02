const API_URL = "https://api.erwin.lol";
let API_KEY = "";
let isRunning = false;
let stopRequested = false;
let wordlist = [];
let autoDownloadLogs = false;
let logCounter = 0;
let isLogsVisible = true;

// Theme management
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', toggleTheme);
    loadSavedTheme();
}

function toggleTheme() {
    const htmlElement = document.documentElement;
    const isDark = htmlElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    htmlElement.setAttribute('data-theme', newTheme);
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem('theme', newTheme);
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    }
}

// Logging functions
function toggleLogs() {
    const logsDiv = document.getElementById('logs');
    const toggleButton = document.getElementById('toggle-logs');
    isLogsVisible = !isLogsVisible;
    
    if (isLogsVisible) {
        logsDiv.classList.remove('hidden');
        toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i> Hide Logs';
    } else {
        logsDiv.classList.add('hidden');
        toggleButton.innerHTML = '<i class="fas fa-eye"></i> Show Logs';
    }
}

function logMessage(message) {
    const logDiv = document.getElementById('logs');
    const logEntry = document.createElement('p');
    logEntry.textContent = `${new Date().toISOString()} - ${message}`;
    logDiv.appendChild(logEntry);
    
    if (isLogsVisible) {
        logDiv.scrollTop = logDiv.scrollHeight;
    }
    
    console.log(message);
    logCounter++;
    autoDownloadAndClearLogs();
}

function autoDownloadAndClearLogs() {
    if (logCounter >= 1000) {
        if (autoDownloadLogs) {
            downloadLogs();
        }
        document.getElementById('logs').innerHTML = '';
        logCounter = 0;
    }
}

function downloadLogs() {
    const logs = document.getElementById('logs').innerText;
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'erwin_logs.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// API Key management
function addApiKey() {
    const apiKeyInput = document.getElementById('api-key');
    const newApiKey = apiKeyInput.value.trim();
    if (newApiKey) {
        API_KEY = newApiKey;
        apiKeyInput.value = '';
        saveApiKey();
        logMessage(`New API Key set: ${API_KEY.slice(0, 10)}...`);
        if (isRunning) {
            restartSubmission();
        }
    }
}

function saveApiKey() {
    localStorage.setItem('apiKey', API_KEY);
}

function loadApiKey() {
    const savedKey = localStorage.getItem('apiKey');
    if (savedKey) {
        API_KEY = savedKey;
        logMessage(`Loaded API key from storage: ${API_KEY.slice(0, 10)}...`);
    }
}

// Submission process
async function startSubmission() {
    if (!API_KEY) {
        alert('Please add an API key before starting.');
        return;
    }
    isRunning = true;
    stopRequested = false;
    document.getElementById('start-stop').innerHTML = '<i class="fas fa-stop"></i> Stop Submission';
    logMessage('Starting submission process...');
    submitGuesses(API_KEY);
}

function stopSubmission() {
    stopRequested = true;
    isRunning = false;
    document.getElementById('start-stop').innerHTML = '<i class="fas fa-play"></i> Start Submission';
    logMessage('Stopping submission. Please wait for the current cycle to complete.');
}

function toggleSubmission() {
    if (!isRunning) {
        startSubmission();
    } else {
        stopSubmission();
    }
}

function restartSubmission() {
    logMessage('Restarting submission process...');
    stopSubmission();
    setTimeout(startSubmission, 1000);
}

async function submitGuesses(apiKey) {
    let attemptCount = 0;
    while (!stopRequested) {
      attemptCount++;
      const passwords = await Promise.all(Array(50).fill().map(() => generateMnemonicPhrase()));
      logMessage(`🔑️ API Key: ${apiKey.slice(0, 10)}... | Submission: ${attemptCount}`);
      logMessage(`➡️ Submitting ${passwords.length} guesses to oracle`);
      try {
        const response = await sendRequest(apiKey, passwords);
        await handleResponse(response, apiKey);
      } catch (error) {
        logMessage(`⚠️ Request error | API Key: ${apiKey.slice(0, 10)}... | Error: ${error}`);
      }
  
      if (stopRequested) break;
  
      logMessage(`Sleeping for 4 seconds before next submission...`);
      await new Promise(resolve => setTimeout(resolve, 4000));
    }
  }

async function sendRequest(apiKey, passwords) {
    const startTime = Date.now();
    const headers = {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    };

    const response = await fetch(`${API_URL}/submit_guesses`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(passwords),
    });

    const requestTime = (Date.now() - startTime) / 1000;
    return { response, requestTime };
}

async function handleResponse(responseData, apiKey) {
    const { response, requestTime } = responseData;
    if (response.status === 202) {
        logMessage(`✅ Guesses accepted | API Key: ${apiKey.slice(0, 10)}... | Time: ${requestTime.toFixed(2)}s`);
    } else {
        const responseText = await response.text();
        logMessage(`❌ Guesses rejected | API Key: ${apiKey.slice(0, 10)}... | Status: ${response.status} | Response: ${responseText} | Time: ${requestTime.toFixed(2)}s`);
    }
}

// Mnemonic generation
async function fetchWordlist() {
    const url = 'https://raw.githubusercontent.com/bitcoin/bips/master/bip-0039/english.txt';
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        wordlist = text.split('\n').filter(word => word.trim() !== '');
    } catch (error) {
        console.error('Error fetching wordlist:', error);
    }
}

function generateEntropy(bits = 128) {
    return crypto.getRandomValues(new Uint8Array(bits / 8));
}

async function calculateChecksum(entropy) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', entropy);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksumLength = entropy.length * 8 / 32;
    const checksumBits = hashArray[0] >> (8 - checksumLength);
    return checksumBits.toString(2).padStart(checksumLength, '0');
}

function entropyToBits(entropy) {
    return Array.from(entropy).map(byte => byte.toString(2).padStart(8, '0')).join('');
}

function bitsToIndices(entropyBits, checksumBits) {
    const fullBits = entropyBits + checksumBits;
    const indices = [];
    for (let i = 0; i < fullBits.length; i += 11) {
        indices.push(parseInt(fullBits.slice(i, i + 11), 2));
    }
    return indices;
}

async function generateMnemonic(entropy) {
    const checksum = await calculateChecksum(entropy);
    const entropyBits = entropyToBits(entropy);
    const indices = bitsToIndices(entropyBits, checksum);
    return indices.map(index => wordlist[index]);
}

async function generateMnemonicPhrase() {
    const entropy = generateEntropy(128);
    const mnemonic = await generateMnemonic(entropy);
    return mnemonic.join(' ');
}

function toggleAutoDownload() {
    autoDownloadLogs = !autoDownloadLogs;
    const toggleButton = document.getElementById('toggle-auto-download');
    toggleButton.innerHTML = autoDownloadLogs 
        ? '<i class="fas fa-download"></i> Disable Auto-Download' 
        : '<i class="fas fa-download"></i> Enable Auto-Download';
    logMessage(`Auto-download logs ${autoDownloadLogs ? 'enabled' : 'disabled'}.`);
}

// Initialization
window.onload = function() {
    fetchWordlist();
    loadApiKey();
    initThemeToggle();
    
    document.getElementById('toggle-auto-download').addEventListener('click', toggleAutoDownload);
    document.getElementById('set-key').addEventListener('click', addApiKey);
    document.getElementById('start-stop').addEventListener('click', toggleSubmission);
    document.getElementById('download-logs').addEventListener('click', downloadLogs);
    document.getElementById('toggle-logs').addEventListener('click', toggleLogs);
};
