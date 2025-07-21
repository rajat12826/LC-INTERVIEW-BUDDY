// test-email.js
const nodemailer = require('nodemailer');

console.log( process.env.SMTP_HOST,
      Number(process.env.SMTP_PORT ),
      process.env.SMTP_SERVICE,
      process.env.SMTP_MAIL,
         process.env.SMTP_PASSWORD,);

const transporter = nodemailer.createTransport({
  host:  process.env.SMTP_HOST,
      port:  Number(process.env.SMTP_PORT ),
      service: process.env.SMTP_SERVICE,
      auth: {
        user:  process.env.SMTP_MAIL,
        pass:  process.env.SMTP_PASSWORD,
      },
});

const mailOptions = {
   from:process.env.SMTP_MAIL,
      to: "pariharrajat078@gmail.com",
     
  subject: "Test Email from Nodemailer",
  html: "<h1>This is a test email!</h1><p>If you see this, Nodemailer is working.</p>"
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.log("Error sending test email:", error);
  }
  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info)); // Only for ethereal.email
});