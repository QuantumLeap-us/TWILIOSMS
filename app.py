import os
from flask import Flask, request, jsonify, render_template
from twilio.rest import Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure Flask to find templates and static files in the current directory
app = Flask(__name__, template_folder='.', static_folder='.')

# Twilio configuration
account_sid = os.getenv('TWILIO_ACCOUNT_SID')
auth_token = os.getenv('TWILIO_AUTH_TOKEN')
from_number = os.getenv('TWILIO_PHONE_NUMBER')

# Check if Twilio credentials are set
if not all([account_sid, auth_token, from_number]):
    print("错误：请确保在 .env 文件中设置了 TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, 和 TWILIO_PHONE_NUMBER")

client = Client(account_sid, auth_token)

def format_phone_number(phone_number):
    """Formats a phone number to E.164, assuming +852 if no country code."""
    # Remove all non-digit characters
    phone_number = ''.join(filter(str.isdigit, phone_number))
    
    # If it doesn't start with a country code, assume it's a local HK number
    if not phone_number.startswith('852') and len(phone_number) == 8:
         return f"+852{phone_number}"
    # If it already has the country code but no '+', add it
    if phone_number.startswith('852'):
        return f"+{phone_number}"

    if not phone_number.startswith('+'):
        return f"+{phone_number}"
    return phone_number


@app.route('/')
def index():
    # Serve the main HTML page
    return render_template('index.html')

@app.route('/send', methods=['POST'])
def send_sms():
    data = request.get_json()
    to_number = data.get('phoneNumber')
    message_body = data.get('message')

    if not to_number or not message_body:
        return jsonify({'success': False, 'error': '号码和信息不能为空'}), 400

    try:
        # Format the phone number before sending
        formatted_to_number = format_phone_number(to_number)
        
        message = client.messages.create(
            body=message_body,
            from_=from_number,
            to=formatted_to_number
        )
        print(f"Message sent with SID: {message.sid}")
        return jsonify({'success': True, 'message': '信息发送成功！'})
    except Exception as e:
        print(f"Error sending message: {e}")
        # Return a more generic error to the user for security
        return jsonify({'success': False, 'error': '发送信息时发生内部错误。'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
