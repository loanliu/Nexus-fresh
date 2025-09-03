// test-ses-smtp.js
const nodemailer = require('nodemailer');
require('dotenv').config();

(async () => {
  try {
    const port = Number(process.env.SES_PORT || 587);
    const secure = port === 465; // 465 = implicit TLS, 587 = STARTTLS
    console.log('user', process.env.SES_USER);
    console.log('user', process.env.SES_PASS);
    console.log('host', process.env.SES_HOST);
    console.log('port', process.env.SES_PORT);
    console.log('secure', process.env.SES_PORT === '465');
    console.log('requireTLS', !secure);
    const transporter = nodemailer.createTransport({
      host: process.env.SES_HOST,
      port,
      secure,
      auth: { user: process.env.SES_USER, pass: process.env.SES_PASS },
      requireTLS: !secure, // ensure STARTTLS when using 587
    });

    const info = await transporter.sendMail({
      from: process.env.FROM,
      to: process.env.TO,
      subject: 'SES SMTP test ✔',
      text: 'Hello from SES SMTP via Nodemailer.',
      html: '<p>Hello from <b>SES SMTP</b> via Nodemailer.</p>',
    });

    console.log('Message sent:', info.messageId);
    console.log('Accepted:', info.accepted);
    console.log('Response:', info.response);
  } catch (err) {
    console.error('SMTP test failed:', err);
  }
})();
