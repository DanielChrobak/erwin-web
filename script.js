const API_URL = "https://api.erwin.lol";
let API_KEYS = [];
let isRunning = false;
let stopRequested = false;
let useProxies = false;
let wordlist = [];

function logMessage(message) {
    const logDiv = document.getElementById('logs');
    logDiv.innerHTML += `<p>${new Date().toISOString()} - ${message}</p>`;
    logDiv.scrollTop = logDiv.scrollHeight;
    console.log(message);
}

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

function getRandomProxy() {
    return PROXIES[Math.floor(Math.random() * PROXIES.length)];
}

async function submitGuesses(apiKey, sleepTime) {
    let attemptCount = 0;
    while (!stopRequested) {
        attemptCount++;
        const passwords = await Promise.all(Array(50).fill().map(() => generateMnemonicPhrase()));
        console.log(passwords);
        const proxy = useProxies ? getRandomProxy() : null;
        
        logMessage(`🔑️ API Key: ${apiKey.slice(0, 10)}... | Submission: ${attemptCount} | Sleep: ${sleepTime}s${proxy ? ` | Proxy: ${proxy}` : ''}`);
        logMessage(`➡️ Submitting ${passwords.length} guesses to oracle`);

        const startTime = Date.now();
        try {
            const headers = {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            };
            if (useProxies && proxy) {
                headers['X-Forwarded-For'] = proxy;
            }

            const response = await fetch(`${API_URL}/submit_guesses`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(passwords),
            });
            const requestTime = (Date.now() - startTime) / 1000;

            if (response.status === 202) {
                logMessage(`✅ Guesses accepted | API Key: ${apiKey.slice(0, 10)}... | Time: ${requestTime.toFixed(2)}s`);
                sleepTime = Math.max(1, sleepTime - 1);
            } else {
                const responseText = await response.text();
                logMessage(`❌ Guesses rejected | API Key: ${apiKey.slice(0, 10)}... | Status: ${response.status} | Response: ${responseText} | Time: ${requestTime.toFixed(2)}s`);
                sleepTime += 10;
            }
        } catch (error) {
            logMessage(`⚠️ Request error | API Key: ${apiKey.slice(0, 10)}... | Error: ${error}`);
            sleepTime += 10;
        }

        if (stopRequested) break;

        logMessage(`💤 Sleeping for ${sleepTime}s | API Key: ${apiKey.slice(0, 10)}...`);
        await new Promise(resolve => setTimeout(resolve, sleepTime * 1000));
    }
}

function addApiKey() {
    const apiKeyInput = document.getElementById('api-key');
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
        if (API_KEYS.includes(apiKey)) {
            alert('This API key has already been added.');
        } else {
            API_KEYS.push(apiKey);
            apiKeyInput.value = '';
            updateApiKeysList();
            saveApiKeys();
            logMessage(`New API Key added: ${apiKey.slice(0, 10)}...`);

            if (isRunning) {
                logMessage('Restarting submission process to include new API key...');
                stopSubmission();
                setTimeout(() => {
                    startSubmission();
                }, 1000);
            }
        }
    }
}

function updateApiKeysList() {
    const apiKeysList = document.getElementById('api-keys-list');
    apiKeysList.innerHTML = API_KEYS.map((key, index) => 
        `<p>API Key ${index + 1}: ${key.slice(0, 10)}... 
         <button class="remove-key" data-index="${index}" style="color: red; margin-left: 10px;">X</button></p>`
    ).join('');

    document.querySelectorAll('.remove-key').forEach(button => {
        button.addEventListener('click', removeApiKey);
    });
}

function removeApiKey(event) {
    const index = event.target.getAttribute('data-index');
    const removedKey = API_KEYS[index];
    API_KEYS.splice(index, 1);
    updateApiKeysList();
    saveApiKeys();
    logMessage(`Removed API Key: ${removedKey.slice(0, 10)}...`);

    if (isRunning) {
        stopSubmission();
        setTimeout(() => {
            if (API_KEYS.length > 0) {
                startSubmission();
            } else {
                logMessage('No API keys left. Submission stopped.');
            }
        }, 1000);
    }
}

function startSubmission() {
    if (API_KEYS.length === 0) {
        alert('Please add at least one API key before starting.');
        return;
    }
    isRunning = true;
    stopRequested = false;
    document.getElementById('start-stop').textContent = 'Stop Submission';
    logMessage('Starting submission process...');
    API_KEYS.forEach((apiKey, index) => {
        submitGuesses(apiKey, 60);
    });
}

function stopSubmission() {
    stopRequested = true;
    isRunning = false;
    document.getElementById('start-stop').textContent = 'Start Submission';
    logMessage('Stopping submission. Please wait for the current cycle to complete.');
}

function toggleSubmission() {
    if (!isRunning) {
        startSubmission();
    } else {
        stopSubmission();
    }
}

function saveApiKeys() {
    localStorage.setItem('apiKeys', JSON.stringify(API_KEYS));
}

function loadApiKeys() {
    const savedKeys = localStorage.getItem('apiKeys');
    if (savedKeys) {
        API_KEYS = JSON.parse(savedKeys);
        updateApiKeysList();
        logMessage(`Loaded ${API_KEYS.length} API key(s) from storage.`);
    }
}

function uploadProxies() {
    const fileInput = document.getElementById('proxy-file');
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            PROXIES = content.split('\n').filter(line => line.trim() !== '');
            saveProxies();
            logMessage(`Uploaded ${PROXIES.length} proxies.`);
        };
        reader.readAsText(file);
    }
}

function toggleProxies() {
    if (!useProxies && (!PROXIES || PROXIES.length === 0)) {
        alert('No proxies available. Please upload proxies before enabling.');
        return;
    }

    useProxies = !useProxies;
    const toggleButton = document.getElementById('toggle-proxies');
    const proxyStatus = document.getElementById('proxy-status');
    if (useProxies) {
        toggleButton.textContent = 'Disable Proxies';
        proxyStatus.textContent = 'Proxies: Enabled';
    } else {
        toggleButton.textContent = 'Enable Proxies';
        proxyStatus.textContent = 'Proxies: Disabled';
    }
    logMessage(`Proxy usage ${useProxies ? 'enabled' : 'disabled'}.`);

    if (isRunning) {
        logMessage('Restarting submission process to update proxy settings...');
        stopSubmission();
        setTimeout(() => {
            startSubmission();
        }, 1000);
    }
}


function saveProxies() {
    localStorage.setItem('proxies', JSON.stringify(PROXIES));
}

function loadProxies() {
    const savedProxies = localStorage.getItem('proxies');
    if (savedProxies) {
        PROXIES = JSON.parse(savedProxies);
        logMessage(`Loaded ${PROXIES.length} proxy(ies) from storage.`);
    }
}

window.onload = function() {
    fetchWordlist();
    loadApiKeys();
    loadProxies();
    document.getElementById('add-key').addEventListener('click', addApiKey);
    document.getElementById('start-stop').addEventListener('click', toggleSubmission);
    document.getElementById('upload-proxies').addEventListener('click', uploadProxies);
    document.getElementById('toggle-proxies').addEventListener('click', toggleProxies);

    const toggleButton = document.getElementById('toggle-proxies');
    const proxyStatus = document.getElementById('proxy-status');
    if (PROXIES && PROXIES.length > 0) {
        toggleButton.disabled = false;
        toggleButton.textContent = 'Enable Proxies';
        proxyStatus.textContent = 'Proxies: Disabled';
    } else {
        toggleButton.disabled = true;
        toggleButton.textContent = 'No Proxies Available';
        proxyStatus.textContent = 'Proxies: Not Available';
    }
};