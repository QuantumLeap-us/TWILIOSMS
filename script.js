document.addEventListener('DOMContentLoaded', () => {
    const messageForm = document.getElementById('messageForm');
    const logOutput = document.getElementById('logOutput');
    
    if (!messageForm || !logOutput) {
        console.error('Error: Critical elements #messageForm or #logOutput not found.');
        return;
    }

    const log = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        
        let iconHtml = '';
        switch (type) {
            case 'success':
                iconHtml = `<i class="fas fa-check-circle" style="color: #4ade80;"></i>`;
                break;
            case 'error':
                iconHtml = `<i class="fas fa-times-circle" style="color: #f87171;"></i>`;
                break;
            case 'info':
                iconHtml = `<i class="fas fa-info-circle" style="color: #60a5fa;"></i>`;
                break;
            case 'summary':
                iconHtml = `<i class="fas fa-stream" style="color: #9ca3af;"></i>`;
                break;
        }

        entry.innerHTML = `${iconHtml}<span>[${timestamp}] ${message}</span>`;
        logOutput.appendChild(entry);
        logOutput.scrollTop = logOutput.scrollHeight; // Auto-scroll
    };

    messageForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const phoneNumberInput = document.getElementById('phoneNumber');
        const messageInput = document.getElementById('message');
        const submitButton = messageForm.querySelector('button[type="submit"]');

        if (!phoneNumberInput.value.trim() || !messageInput.value.trim()) {
            log('請填寫所有欄位。', 'error');
            return;
        }

        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = '傳送中...';
        logOutput.innerHTML = ''; // Clear previous logs
        log('開始新的傳送任務...', 'info');

        const phoneNumbers = phoneNumberInput.value.trim().split('\n').filter(n => n.trim());
        const message = messageInput.value.trim();

        let successCount = 0;
        let errorCount = 0;

        for (const number of phoneNumbers) {
            const trimmedNumber = number.trim();
            try {
                const response = await fetch('/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phoneNumber: trimmedNumber, message: message }),
                });
                const data = await response.json();
                if (data.success) {
                    successCount++;
                    log(`成功 -> ${trimmedNumber}`, 'success');
                } else {
                    errorCount++;
                    log(`失敗 -> ${trimmedNumber}: ${data.error || '未知錯誤'}`, 'error');
                }
            } catch (error) {
                errorCount++;
                log(`網路錯誤 -> ${trimmedNumber}: ${error.message}`, 'error');
            }
        }

        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;

        log(`任務完成。成功: ${successCount}，失敗: ${errorCount}。`, 'summary');

        if (errorCount === 0 && phoneNumbers.length > 0) {
            phoneNumberInput.value = '';
            messageInput.value = '';
            log('表單已清空。', 'info');
        }
    });
});
