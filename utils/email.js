const nodemailer = require('nodemailer');
const sendEmail = async (options) => {
    // 1) create a transporter
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    // 2) define the email options
    const mailOptions = {
        from: 'invisible <hello@invisible.io>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html:
    };
    // 3) actually send the email 
    await transporter.sendMail(mailOptions);
};
module.exports = sendEmail;
