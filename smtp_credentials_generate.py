import hmac
import hashlib
import base64

def generate_smtp_password(secret_key, region):
    """
    Generate AWS SMTP password for Amazon SES
    """
    # These values should always stay the same
    date = "11111111"
    service = "ses"
    terminal = "aws4_request"
    message = "SendRawEmail"
    version = 0x04
    
    # Step 1: kDate = HMAC-SHA256("AWS4" + secret_key, date)
    k_date = hmac.new(
        ("AWS4" + secret_key).encode('utf-8'), 
        date.encode('utf-8'), 
        hashlib.sha256
    ).digest()
    
    # Step 2: kRegion = HMAC-SHA256(region, kDate)
    k_region = hmac.new(
        region.encode('utf-8'), 
        k_date, 
        hashlib.sha256
    ).digest()
    
    # Step 3: kService = HMAC-SHA256(service, kRegion)
    k_service = hmac.new(
        service.encode('utf-8'), 
        k_region, 
        hashlib.sha256
    ).digest()
    
    # Step 4: kTerminal = HMAC-SHA256(terminal, kService)
    k_terminal = hmac.new(
        terminal.encode('utf-8'), 
        k_service, 
        hashlib.sha256
    ).digest()
    
    # Step 5: kMessage = HMAC-SHA256(message, kTerminal)
    k_message = hmac.new(
        message.encode('utf-8'), 
        k_terminal, 
        hashlib.sha256
    ).digest()
    
    # Step 6: signatureAndVersion = version + kMessage
    signature_and_version = bytes([version]) + k_message
    
    # Step 7: smtpPassword = Base64(signatureAndVersion)
    smtp_password = base64.b64encode(signature_and_version).decode('utf-8')
    
    return smtp_password

if __name__ == "__main__":
    # Your AWS credentials
    aws_secret_key = "XbXPCMYxbgdNFPk5/Lxr4DRqDs7se3mMuWWJR3Ot"
    aws_region = "us-east-2"
    
    print("🔑 AWS SMTP Password Generator")
    print("=" * 40)
    
    try:
        smtp_password = generate_smtp_password(aws_secret_key, aws_region)
        print(f"✅ Generated SMTP Password for region: {aws_region}")
        print(f"🔐 SMTP Password: {smtp_password}")
        print("\n📧 Use this password in your email client:")
        print(f"   - Username: Your AWS Access Key ID")
        print(f"   - Password: {smtp_password}")
        print(f"   - Server: email-smtp.{aws_region}.amazonaws.com")
        print(f"   - Port: 587 (TLS) or 465 (SSL)")
    except Exception as e:
        print(f"❌ Error generating password: {e}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()