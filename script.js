:root {
    --primary-color: #4a90e2;
    --secondary-color: #1e1e1e;
    --text-color: #f5f5f5;
    --border-color: #444;
}

body {
    font-family: 'Roboto', sans-serif;
    margin: 0;
    padding: 0;
    background-color: var(--secondary-color);
    color: var(--text-color);
    line-height: 1.6;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

header {
    text-align: center;
    margin-bottom: 30px;
}

h1 {
    color: var(--primary-color);
}

h2 {
    color: var(--primary-color);
    border-bottom: 2px solid var(--primary-color);
    padding-bottom: 10px;
    margin-top: 30px;
}

.input-group {
    display: flex;
    margin-bottom: 15px;
}

input[type="text"], input[type="file"] {
    flex-grow: 1;
    padding: 10px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 16px;
    background-color: #3a3a3a;
    color: var(--text-color);
}

.btn {
    padding: 10px 20px;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s ease;
}

.btn:hover {
    background-color: #3a78c1;
}

.btn-primary {
    background-color: #4CAF50;
}

.btn-primary:hover {
    background-color: #45a049;
}

#api-keys-list p {
    background-color: #2c2c2c;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.remove-key {
    background: none;
    border: none;
    color: #e74c3c;
    cursor: pointer;
    font-weight: bold;
}

#logs {
    background-color: #2c2c2c;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 15px;
    max-height: 300px;
    overflow-y: auto;
    margin-bottom: 15px;
}

#logs p {
    margin: 5px 0;
    padding: 5px 0;
    border-bottom: 1px solid var(--border-color);
    color: var(--text-color);
}

#logs p:last-child {
    border-bottom: none;
}

#download-logs {
    display: block;
    margin: 20px auto;
    background-color: #4CAF50;
    color: white;
}

.control-group {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.left-controls {
    display: flex;
    align-items: center;
}

.right-controls {
    margin-left: auto;
}

#toggle-proxies {
    margin-right: 10px;
}

#proxy-status {
    margin-left: 10px;
    font-weight: bold;
    color: #e0e0e0;
}

#start-stop {
    padding: 10px 20px;
}

.btn-secondary {
    background-color: #f39c12;
    color: white;
}

.btn-secondary:hover {
    background-color: #e67e22;
}

#toggle-auto-download {
    margin-left: 10px;
}
