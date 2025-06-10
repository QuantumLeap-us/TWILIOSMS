document.getElementById('messageForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the form from submitting the traditional way

    const phoneNumber = document.getElementById('phoneNumber').value;
    const message = document.getElementById('message').value;
    const button = document.querySelector('button[type="submit"]');
    const originalButtonText = button.textContent;

    // Disable button and show sending status
    button.disabled = true;
    button.textContent = '发送中...';

    fetch('/send', { // Send request to our Flask backend
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: phoneNumber, message: message }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('信息发送成功！');
            // Optionally clear the form
            document.getElementById('phoneNumber').value = '';
            document.getElementById('message').value = '';
        } else {
            alert(`发送失败: ${data.error}`);
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('发送时发生错误，请检查后端服务是否正在运行。');
    })
    .finally(() => {
        // Re-enable button and restore text
        button.disabled = false;
        button.textContent = originalButtonText;
    });
});
