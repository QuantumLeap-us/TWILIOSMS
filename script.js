document.getElementById('messageForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent the form from submitting the traditional way

    const phoneNumbersString = document.getElementById('phoneNumber').value;
    const message = document.getElementById('message').value;
    const button = document.querySelector('button[type="submit"]');
    const originalButtonText = button.textContent;

    const phoneNumbers = phoneNumbersString.split('\n')
                                          .map(num => num.trim())
                                          .filter(num => num.length > 0);

    if (phoneNumbers.length === 0) {
        alert('请输入至少一个有效的电话号码。');
        return;
    }

    button.disabled = true;
    button.textContent = `发送中 (0/${phoneNumbers.length})...`;

    let successes = [];
    let failures = [];

    for (let i = 0; i < phoneNumbers.length; i++) {
        const phoneNumber = phoneNumbers[i];
        button.textContent = `发送中 (${i + 1}/${phoneNumbers.length})...`;

        try {
            const response = await fetch('/send', { // Send request to our Flask backend
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phoneNumber: phoneNumber, message: message }),
            });
            const data = await response.json();
            if (data.success) {
                successes.push(phoneNumber);
            } else {
                failures.push({ phoneNumber: phoneNumber, error: data.error || '未知错误' });
            }
        } catch (error) {
            console.error('Error sending to ' + phoneNumber + ':', error);
            failures.push({ phoneNumber: phoneNumber, error: '客户端发送错误' });
        }
    }

    // Re-enable button and restore text
    button.disabled = false;
    button.textContent = originalButtonText;

    // Display results
    let alertMessage = "";
    if (successes.length > 0) {
        alertMessage += `成功发送到: ${successes.join(', ')}\n`;
    }
    if (failures.length > 0) {
        alertMessage += `发送失败: \n${failures.map(f => `  - ${f.phoneNumber}: ${f.error}`).join('\n')}\n`;
    }

    if (alertMessage === "") {
        alertMessage = "没有处理任何号码。"; // Should not happen if validation works
    }

    alert(alertMessage.trim());

    // Optionally clear the form if all were successful
    if (failures.length === 0 && successes.length > 0) {
        document.getElementById('phoneNumber').value = ''; // Clear only if all succeeded
        // Keeping message content might be useful for resending to failed numbers
        // document.getElementById('message').value = '';
    }
});
