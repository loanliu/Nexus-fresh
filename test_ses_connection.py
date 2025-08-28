import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def test_ses_connection():
    # Your AWS credentials
    aws_access_key_id = "AKIA2AMJBBT6OFKURA7L"  # Replace this!
    aws_secret_key = "BNK5o8jy/EkFoOACS8HBY0WhMdYiPfxEBLLSXsMJsxED"
    region = "us-east-2"
    
    # Generate SMTP password
    import hmac
    import hashlib
    import base64
    
    date = "11111111"
    service = "ses"
    terminal = "aws4_request"
    message = "SendRawEmail"
    version = 0x04
    
    k_date = hmac.new(
        ("AWS4" + aws_secret_key).encode('utf-8'), 
        date.encode('utf-8'), 
        hashlib.sha256
    ).digest()
    
    k_region = hmac.new(
        region.encode('utf-8'), 
        k_date, 
        hashlib.sha256
    ).digest()
    
    k_service = hmac.new(
        service.encode('utf-8'), 
        k_region, 
        hashlib.sha256
    ).digest()
    
    k_terminal = hmac.new(
        terminal.encode('utf-8'), 
        k_service, 
        hashlib.sha256
    ).digest()
    
    k_message = hmac.new(
        message.encode('utf-8'), 
        k_terminal, 
        hashlib.sha256
    ).digest()
    
    signature_and_version = bytes([version]) + k_message
    smtp_password = base64.b64encode(signature_and_version).decode('utf-8')
    
    print(f"🔐 Generated SMTP Password: {smtp_password}")
    
    # Test connection
    try:
        server = smtplib.SMTP(f"email-smtp.{region}.amazonaws.com", 587)
        server.starttls()
        server.login(aws_access_key_id, smtp_password)
        print("✅ SMTP connection successful!")
        
        # Try to send a test email
        msg = MIMEMultipart()
        msg['From'] = "your-verified-email@domain.com"  # Replace with verified email
        msg['To'] = "test@example.com"  # Replace with test email
        msg['Subject'] = "SES Test Email"
        
        body = "This is a test email from AWS SES"
        msg.attach(MIMEText(body, 'plain'))
        
        text = msg.as_string()
        server.sendmail(msg['From'], msg['To'], text)
        print("✅ Test email sent successfully!")
        
        server.quit()
        
    except Exception as e:
        print(f"❌ SMTP connection failed: {e}")
        print(f"Error type: {type(e)}")

if __name__ == "__main__":
    test_ses_connection()