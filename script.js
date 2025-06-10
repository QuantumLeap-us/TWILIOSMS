document.addEventListener('DOMContentLoaded', () => {
    const messageForm = document.getElementById('messageForm');
    const logOutput = document.getElementById('logOutput');
    
    if (!messageForm || !logOutput) {
        console.error('Error: Critical elements #messageForm or #logOutput not found. The application cannot start.');
        return;
    }

    const log = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.textContent = `[${timestamp}] ${message}`;
        
        if (type === 'success') {
            entry.style.color = '#4ade80'; // green-400
        } else if (type === 'error') {
            entry.style.color = '#f87171'; // red-400
        }

        logOutput.appendChild(entry);
        logOutput.scrollTop = logOutput.scrollHeight; // Auto-scroll to bottom
    };

    messageForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const phoneNumberInput = document.getElementById('phoneNumber');
        const messageInput = document.getElementById('message');
        const submitButton = messageForm.querySelector('button[type="submit"]');

        if (!phoneNumberInput.value.trim() || !messageInput.value.trim()) {
            log('錯誤: 請填寫電話號碼和簡訊內容。', 'error');
            return;
        }

        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = '傳送中...';
        logOutput.innerHTML = ''; // Clear previous logs
        log('開始傳送任務...');

        const phoneNumbers = phoneNumberInput.value.trim().split('\n').filter(n => n.trim());
        const message = messageInput.value.trim();

        let successCount = 0;
        let errorCount = 0;

        for (const number of phoneNumbers) {
            const trimmedNumber = number.trim();
            try {
                const response = await fetch('/api/send', { // Adjusted endpoint to /api/send
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phoneNumber: trimmedNumber, message: message }),
                });
                const data = await response.json();
                if (data.success) {
                    successCount++;
                    log(`成功發送至 ${trimmedNumber}`, 'success');
                } else {
                    errorCount++;
                    log(`發送失敗至 ${trimmedNumber}: ${data.error || '未知錯誤'}`, 'error');
                }
            } catch (error) {
                errorCount++;
                log(`網路或伺服器錯誤，無法發送至 ${trimmedNumber}: ${error.message}`, 'error');
            }
        }

        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;

        log('--------------------');
        log(`任務完成！成功: ${successCount}，失敗: ${errorCount}。`, 'summary');

        if (errorCount === 0) {
            phoneNumberInput.value = '';
            messageInput.value = '';
        }
    });
});
