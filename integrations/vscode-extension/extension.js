const vscode = require('vscode');
const http = require('http');

let statusBarItem;
let pollTimer;

function activate(context) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'focusguard.openDashboard';
    statusBarItem.text = '$(eye) FocusGuard: Offline';
    statusBarItem.tooltip = 'FocusGuard AI Study Assistant';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Register Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('focusguard.startSession', async () => {
            const title = await vscode.window.showInputBox({ prompt: 'Enter study topic title' });
            if (!title) return;
            postJson('/api/sessions', {
                title,
                subject: 'Coding',
                mode: 'coding',
                planned_duration_sec: 1500
            }, () => {
                vscode.window.showInformationMessage(`FocusGuard: Started session "${title}"`);
            });
        }),
        vscode.commands.registerCommand('focusguard.pauseSession', () => {
            postJson('/api/control/pause', {}, () => {
                vscode.window.showInformationMessage('FocusGuard: Session paused');
            });
        }),
        vscode.commands.registerCommand('focusguard.resumeSession', () => {
            postJson('/api/control/resume', {}, () => {
                vscode.window.showInformationMessage('FocusGuard: Session resumed');
            });
        }),
        vscode.commands.registerCommand('focusguard.openDashboard', () => {
            vscode.env.openExternal(vscode.Uri.parse('http://127.0.0.1:5173'));
        })
    );

    // Poll status periodically (every 3 seconds)
    pollTimer = setInterval(pollStatus, 3000);
    pollStatus();
}

function pollStatus() {
    http.get('http://127.0.0.1:8765/api/status', (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
            try {
                const data = JSON.parse(raw);
                if (data.active_session) {
                    const sess = data.active_session;
                    const stateIcon = data.is_paused ? '$(debug-pause)' : '$(eye)';
                    statusBarItem.text = `${stateIcon} FocusGuard: ${sess.title} (${Math.round((sess.planned_duration_sec - (sess.active_duration_sec || 0)) / 60)}m left)`;
                    statusBarItem.color = data.is_paused ? '#F59E0B' : '#10B981';
                } else {
                    statusBarItem.text = '$(eye) FocusGuard: Ready';
                    statusBarItem.color = '#94A3B8';
                }
            } catch (_) {}
        });
    }).on('error', () => {
        statusBarItem.text = '$(eye-closed) FocusGuard: Offline';
        statusBarItem.color = '#64748B';
    });
}

function postJson(path, payload, callback) {
    const data = JSON.stringify(payload);
    const req = http.request({
        hostname: '127.0.0.1',
        port: 8765,
        path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    }, () => {
        if (callback) callback();
    });
    req.on('error', (e) => vscode.window.showErrorMessage(`FocusGuard connection error: ${e.message}`));
    req.write(data);
    req.end();
}

function deactivate() {
    if (pollTimer) clearInterval(pollTimer);
    if (statusBarItem) statusBarItem.dispose();
}

module.exports = { activate, deactivate };
