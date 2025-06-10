
import os
from flask import Flask, request, jsonify, render_template, send_from_directory
from twilio.rest import Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure Flask to find templates and static files in the project root
# Vercel runs the script from the root directory.
app = Flask(__name__, template_folder='..', static_folder='..')

# Twilio configuration
account_sid = os.getenv('TWILIO_ACCOUNT_SID')
auth_token = os.getenv('TWILIO_AUTH_TOKEN')
from_number = os.getenv('TWILIO_PHONE_NUMBER')

client = None
twilio_configured = False

if not all([account_sid, auth_token, from_number]):
    error_message = "CRITICAL ERROR: Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) are not fully set in environment variables. SMS sending will be disabled."
    print(error_message) # Or app.logger.error(error_message) if logger is set up
    # twilio_configured remains False, client remains None
else:
    try:
        client = Client(account_sid, auth_token)
        twilio_configured = True
        print("Twilio client initialized successfully.")
    except Exception as e:
        error_message = f"CRITICAL ERROR: Twilio client initialization failed even with credentials. Error: {e}. SMS sending will be disabled."
        print(error_message) # Or app.logger.error(error_message)
        # twilio_configured remains False, client remains None

def format_phone_number(phone_number_input):
    print(f"Original phone number received for formatting: {phone_number_input}")
    
    # Preserve the original input if it already has a plus, to avoid stripping it too early
    # and then re-adding it.
    if phone_number_input.startswith('+'):
        # If it starts with '+', assume it's E.164 or user intends international.
        # Twilio will do the final validation.
        # We still strip non-digits other than the leading '+'
        digits_part = ''.join(filter(str.isdigit, phone_number_input[1:]))
        formatted_number = f"+{digits_part}"
        print(f"Number started with '+', processed to: {formatted_number}")
        return formatted_number

    # For numbers not starting with '+', strip all non-digits
    digits = ''.join(filter(str.isdigit, phone_number_input))

    if len(digits) == 8 and not digits.startswith('852'): # Common case for HK numbers without prefix
        print(f"Applied 8-digit HK rule for {phone_number_input} (digits: {digits}). Formatting to +852{digits}")
        return f"+852{digits}"

    if digits.startswith('852'): # Handles cases like "85212345678"
        # This ensures that if '852' is present, it gets a '+' prefix if it didn't have one.
        formatted_number = f"+{digits}"
        print(f"Number contained '852' (original: {phone_number_input}, digits: {digits}), formatted to: {formatted_number}")
        return formatted_number

    # For any other case not starting with '+', prefix with '+'
    # e.g., "14155552671" -> "+14155552671"
    # This also covers cases where digits might be less than 8 and not HK, or other country codes without a +
    formatted_number = f"+{digits}"
    print(f"Default prefixing with '+' for {phone_number_input} (digits: {digits}), formatted to: {formatted_number}")
    return formatted_number


@app.route('/')
def index():
    # Serve the main HTML page
    return render_template('index.html')

@app.route('/style.css')
def serve_css():
    return send_from_directory('..', 'style.css', mimetype='text/css')

@app.route('/script.js')
def serve_js():
    return send_from_directory('..', 'script.js', mimetype='application/javascript')

@app.route('/sw.js')
def serve_sw():
    return send_from_directory('..', 'sw.js', mimetype='application/javascript')

@app.route('/send', methods=['POST'])
def send_sms():
    if not twilio_configured or client is None:
        print("Attempted to send SMS, but Twilio is not configured. Aborting.")
        return jsonify({'success': False, 'error': '服务配置不正确，无法发送短信。请联系管理员。', 'type': 'CONFIG_ERROR'}), 503

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

# Note: The if __name__ == '__main__': block is not needed for Vercel
# Vercel handles running the app instance directly.
