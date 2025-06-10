// Enhanced SMS Sender Application
class SMSApp {
    constructor() {
        this.totalSent = 0;
        this.totalSuccess = 0;
        this.history = this.loadHistory();
        this.templates = [
            { id: 'meeting', text: '會議提醒：明天下午2點會議室A開會，請準時參加。' },
            { id: 'event', text: '活動通知：本週六上午10點舉辦團隊活動，歡迎參加！' },
            { id: 'maintenance', text: '系統維護：系統將於今晚12點進行維護，預計2小時完成。' }
        ];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTheme();
        this.updateStats();
        this.renderHistory();
        this.setupFormValidation();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('messageForm').addEventListener('submit', (e) => this.handleSubmit(e));

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Form controls
        document.getElementById('clearForm').addEventListener('click', () => this.clearForm());
        document.getElementById('loadTemplate').addEventListener('click', () => this.showTemplateModal());
        document.getElementById('validateNumbers').addEventListener('click', () => this.validatePhoneNumbers());

        // Template selection
        document.querySelectorAll('.template-item').forEach(item => {
            item.addEventListener('click', () => this.selectTemplate(item.dataset.template));
        });

        // Real-time validation and counters
        document.getElementById('phoneNumber').addEventListener('input', () => this.updatePhoneCount());
        document.getElementById('message').addEventListener('input', () => this.updateCharCount());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('sms-app-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('sms-app-theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('#themeToggle i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    setupFormValidation() {
        const phoneInput = document.getElementById('phoneNumber');
        const messageInput = document.getElementById('message');

        phoneInput.addEventListener('blur', () => this.validatePhoneNumbers(false));
        messageInput.addEventListener('blur', () => this.validateMessage());
    }

    updatePhoneCount() {
        const phoneInput = document.getElementById('phoneNumber');
        const phoneCount = document.querySelector('.phone-count');

        const numbers = this.parsePhoneNumbers(phoneInput.value);
        phoneCount.textContent = `${numbers.length} 個號碼`;

        // Update validation state
        if (numbers.length > 0) {
            phoneInput.classList.remove('error');
            phoneInput.classList.add('success');
        } else {
            phoneInput.classList.remove('success', 'error');
        }
    }

    updateCharCount() {
        const messageInput = document.getElementById('message');
        const charCount = document.querySelector('.char-count');
        const smsCount = document.querySelector('.sms-count');

        const length = messageInput.value.length;
        const smsLength = Math.ceil(length / 160) || 1;

        charCount.textContent = `${length} / 1600 字元`;
        smsCount.textContent = `${smsLength} 則簡訊`;

        // Update color based on length
        if (length > 1600) {
            charCount.style.color = 'var(--error-500)';
            messageInput.classList.add('error');
        } else if (length > 1400) {
            charCount.style.color = 'var(--warning-500)';
            messageInput.classList.remove('error');
        } else {
            charCount.style.color = 'var(--text-tertiary)';
            messageInput.classList.remove('error');
        }
    }

    parsePhoneNumbers(input) {
        return input.split('\n')
                   .map(num => num.trim())
                   .filter(num => num.length > 0)
                   .map(num => this.formatPhoneNumber(num));
    }

    formatPhoneNumber(phone) {
        // Remove all non-digit characters
        const digits = phone.replace(/\D/g, '');

        // If it's 8 digits, assume it's a local HK number
        if (digits.length === 8) {
            return `+852${digits}`;
        }

        // If it starts with 852, add + if missing
        if (digits.startsWith('852') && digits.length === 11) {
            return `+${digits}`;
        }

        // If it already has +, return as is
        if (phone.startsWith('+')) {
            return phone;
        }

        // Otherwise, add + to the beginning
        return `+${digits}`;
    }

    validatePhoneNumbers(showToast = true) {
        const phoneInput = document.getElementById('phoneNumber');
        const numbers = this.parsePhoneNumbers(phoneInput.value);

        if (numbers.length === 0) {
            if (showToast) {
                this.showToast('請輸入至少一個電話號碼', 'error');
            }
            return false;
        }

        const invalidNumbers = numbers.filter(num => !this.isValidPhoneNumber(num));

        if (invalidNumbers.length > 0) {
            if (showToast) {
                this.showToast(`發現 ${invalidNumbers.length} 個無效號碼`, 'warning');
            }
            phoneInput.classList.add('error');
            return false;
        }

        if (showToast) {
            this.showToast(`所有 ${numbers.length} 個號碼格式正確`, 'success');
        }
        phoneInput.classList.remove('error');
        phoneInput.classList.add('success');
        return true;
    }

    isValidPhoneNumber(phone) {
        // Basic validation for international phone numbers
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        return phoneRegex.test(phone);
    }

    validateMessage() {
        const messageInput = document.getElementById('message');
        const message = messageInput.value.trim();

        if (message.length === 0) {
            messageInput.classList.add('error');
            return false;
        }

        if (message.length > 1600) {
            messageInput.classList.add('error');
            return false;
        }

        messageInput.classList.remove('error');
        return true;
    }
    async handleSubmit(event) {
        event.preventDefault();

        // Validate form
        if (!this.validatePhoneNumbers(false) || !this.validateMessage()) {
            this.showToast('請檢查輸入內容', 'error');
            return;
        }

        const phoneInput = document.getElementById('phoneNumber');
        const messageInput = document.getElementById('message');
        const phoneNumbers = this.parsePhoneNumbers(phoneInput.value);
        const message = messageInput.value.trim();

        // Show loading overlay
        this.showLoadingOverlay(true);
        this.updateProgress(0, phoneNumbers.length);

        // Disable form
        this.setFormDisabled(true);

        let successes = [];
        let failures = [];

        // Send messages
        for (let i = 0; i < phoneNumbers.length; i++) {
            const phoneNumber = phoneNumbers[i];
            this.updateProgress(i, phoneNumbers.length);

            try {
                const response = await fetch('/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        phoneNumber: phoneNumber,
                        message: message
                    }),
                });

                const data = await response.json();

                if (data.success) {
                    successes.push(phoneNumber);
                } else {
                    failures.push({
                        phoneNumber: phoneNumber,
                        error: data.error || '未知錯誤'
                    });
                }
            } catch (error) {
                console.error('Error sending to ' + phoneNumber + ':', error);
                failures.push({
                    phoneNumber: phoneNumber,
                    error: '網路連接錯誤'
                });
            }

            // Small delay to prevent overwhelming the server
            if (i < phoneNumbers.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // Complete progress
        this.updateProgress(phoneNumbers.length, phoneNumbers.length);

        // Hide loading overlay
        setTimeout(() => {
            this.showLoadingOverlay(false);
            this.setFormDisabled(false);

            // Show results
            this.showResults(successes, failures, message);

            // Update stats and history
            this.updateStatsAfterSend(successes.length, failures.length);
            this.addToHistory(message, successes, failures);

            // Clear form if all successful
            if (failures.length === 0 && successes.length > 0) {
                this.clearForm();
            }
        }, 1000);
    }

    showResults(successes, failures, message) {
        if (successes.length > 0 && failures.length === 0) {
            this.showToast(
                `成功發送到 ${successes.length} 個號碼`,
                'success',
                `訊息已成功發送到所有收件人`
            );
        } else if (successes.length > 0 && failures.length > 0) {
            this.showToast(
                `部分發送成功`,
                'warning',
                `成功: ${successes.length}, 失敗: ${failures.length}`
            );
        } else {
            this.showToast(
                `發送失敗`,
                'error',
                `所有 ${failures.length} 個號碼發送失敗`
            );
        }

        // Show detailed results if there are failures
        if (failures.length > 0) {
            setTimeout(() => {
                const failureDetails = failures.map(f => `${f.phoneNumber}: ${f.error}`).join('\n');
                this.showToast(
                    '發送失敗詳情',
                    'error',
                    failureDetails,
                    10000
                );
            }, 2000);
        }
    }

    showLoadingOverlay(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }

    updateProgress(current, total) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        const percentage = total > 0 ? (current / total) * 100 : 0;
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${current} / ${total}`;
    }

    setFormDisabled(disabled) {
        const form = document.getElementById('messageForm');
        const inputs = form.querySelectorAll('input, textarea, button');

        inputs.forEach(input => {
            input.disabled = disabled;
        });

        const sendButton = document.getElementById('sendButton');
        if (disabled) {
            sendButton.classList.add('loading');
        } else {
            sendButton.classList.remove('loading');
        }
    }

    clearForm() {
        document.getElementById('phoneNumber').value = '';
        document.getElementById('message').value = '';

        // Reset validation states
        document.querySelectorAll('.form-input').forEach(input => {
            input.classList.remove('error', 'success');
        });

        // Update counters
        this.updatePhoneCount();
        this.updateCharCount();

        this.showToast('表單已清空', 'success');
    }

    selectTemplate(templateText) {
        document.getElementById('message').value = templateText;
        this.updateCharCount();
        this.showToast('範本已載入', 'success');
    }

    showToast(title, type = 'info', message = '', duration = 5000) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${iconMap[type]}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                ${message ? `<div class="toast-message">${message}</div>` : ''}
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    // History Management
    loadHistory() {
        try {
            const saved = localStorage.getItem('sms-app-history');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading history:', error);
            return [];
        }
    }

    saveHistory() {
        try {
            localStorage.setItem('sms-app-history', JSON.stringify(this.history));
        } catch (error) {
            console.error('Error saving history:', error);
        }
    }

    addToHistory(message, successes, failures) {
        const historyItem = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            message: message,
            recipients: [...successes, ...failures.map(f => f.phoneNumber)],
            successes: successes,
            failures: failures,
            totalSent: successes.length,
            totalFailed: failures.length
        };

        this.history.unshift(historyItem);

        // Keep only last 50 items
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }

        this.saveHistory();
        this.renderHistory();
    }

    renderHistory() {
        const historyList = document.getElementById('historyList');

        if (this.history.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>尚無發送記錄</p>
                </div>
            `;
            return;
        }

        historyList.innerHTML = this.history.map(item => {
            const date = new Date(item.timestamp);
            const timeStr = date.toLocaleString('zh-TW', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const status = item.totalFailed === 0 ? 'success' :
                          item.totalSent > 0 ? 'warning' : 'error';
            const statusText = item.totalFailed === 0 ? '全部成功' :
                              item.totalSent > 0 ? '部分成功' : '全部失敗';

            return `
                <div class="history-item">
                    <div class="history-header">
                        <span class="history-time">${timeStr}</span>
                        <span class="history-status ${status}">${statusText}</span>
                    </div>
                    <div class="history-message">${item.message}</div>
                    <div class="history-recipients">
                        發送至 ${item.recipients.length} 個號碼
                        (成功: ${item.totalSent}, 失敗: ${item.totalFailed})
                    </div>
                </div>
            `;
        }).join('');
    }

    // Stats Management
    updateStats() {
        document.getElementById('totalSent').textContent = this.totalSent;
        document.getElementById('successRate').textContent =
            this.totalSent > 0 ? `${Math.round((this.totalSuccess / this.totalSent) * 100)}%` : '100%';
    }

    updateStatsAfterSend(successes, failures) {
        this.totalSent += successes + failures;
        this.totalSuccess += successes;
        this.updateStats();

        // Save stats to localStorage
        localStorage.setItem('sms-app-stats', JSON.stringify({
            totalSent: this.totalSent,
            totalSuccess: this.totalSuccess
        }));
    }

    loadStats() {
        try {
            const saved = localStorage.getItem('sms-app-stats');
            if (saved) {
                const stats = JSON.parse(saved);
                this.totalSent = stats.totalSent || 0;
                this.totalSuccess = stats.totalSuccess || 0;
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    // Keyboard Shortcuts
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + Enter to send
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            document.getElementById('messageForm').dispatchEvent(new Event('submit'));
        }

        // Ctrl/Cmd + K to clear form
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            this.clearForm();
        }

        // Ctrl/Cmd + D to toggle theme
        if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
            event.preventDefault();
            this.toggleTheme();
        }
    }

    // Utility Functions
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('zh-TW');
    }

    truncateText(text, maxLength = 50) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // Error Handling
    handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        this.showToast(
            '發生錯誤',
            'error',
            context ? `${context}: ${error.message}` : error.message
        );
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.smsApp = new SMSApp();

    // Load stats on initialization
    window.smsApp.loadStats();
    window.smsApp.updateStats();

    // Show welcome message
    setTimeout(() => {
        window.smsApp.showToast(
            '歡迎使用簡訊發送平台',
            'info',
            '使用 Ctrl+Enter 快速發送，Ctrl+K 清空表單',
            3000
        );
    }, 1000);
});

// Service Worker Registration (for future PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
