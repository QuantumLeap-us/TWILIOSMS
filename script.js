document.addEventListener('DOMContentLoaded', () => {
    const messageForm = document.getElementById('messageForm');
    if (!messageForm) {
        console.error('Error: #messageForm not found. The application cannot start.');
        return;
    }

    messageForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const phoneNumberInput = document.getElementById('phoneNumber');
        const messageInput = document.getElementById('message');
        const submitButton = messageForm.querySelector('button[type="submit"]');

        // Basic validation
        if (!phoneNumberInput.value.trim() || !messageInput.value.trim()) {
            alert('請填寫電話號碼和簡訊內容。');
            return;
        }

        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = '傳送中...';

        // Process phone numbers (split by newline)
        const phoneNumbers = phoneNumberInput.value.trim().split('\n').filter(n => n.trim());
        const message = messageInput.value.trim();

        let successCount = 0;
        let errorCount = 0;

        for (const number of phoneNumbers) {
            try {
                const response = await fetch('/api/send', { // Adjusted endpoint to /api/send
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        phoneNumber: number.trim(),
                        message: message
                    }),
                });

                const data = await response.json();

                if (data.success) {
                    successCount++;
                } else {
                    errorCount++;
                    console.error(`Failed to send to ${number}:`, data.error || 'Unknown error');
                }
            } catch (error) {
                errorCount++;
                console.error(`Network or fetch error for ${number}:`, error);
            }
        }

        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;

        let alertMessage = `傳送完成！\n成功: ${successCount} 則`;
        if (errorCount > 0) {
            alertMessage += `\n失敗: ${errorCount} 則 (詳情請查看控制台)`;
        }
        alert(alertMessage);

        // Clear form if all were successful
        if (errorCount === 0) {
            phoneNumberInput.value = '';
            messageInput.value = '';
        }
    });
});
