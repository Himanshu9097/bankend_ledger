require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});


// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend Ledger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function sendRegistrationEmail(userEmail, name) {
    const subject = "Welcome to Backend Ledger!";
    
    const text = `Hi ${name}, welcome to Backend Ledger! We are glad to have you on board.`;
    
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #4A90E2;">Welcome to Backend Ledger, ${name}!</h2>
            <p>Thank you for registering. Your account has been successfully created.</p>
            <p>You can now start tracking your transactions and managing your ledger with ease.</p>
            <hr style="border: none; border-top: 1px solid #eee;" />
            <p style="font-size: 0.8em; color: #777;">If you did not create this account, please ignore this email.</p>
        </div>
    `;

    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, fromAccount, toAccount) {
    const subject = "Transaction Alert from Backend Ledger!";
    
    const text = `Hi ${name}, a transaction of $${amount} has been made from account ${fromAccount} to account ${toAccount}.`;
    
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #4A90E2;">Transaction Alert, ${name}!</h2>
            <p>A transaction of <strong>$${amount}</strong> has been made from account <strong>${fromAccount}</strong> to account <strong>${toAccount}</strong>.</p>
            <p>Please review your transactions in your Backend Ledger account.</p>
            <hr style="border: none; border-top: 1px solid #eee;" />
            <p style="font-size: 0.8em; color: #777;">If you did not authorize this transaction, please contact our support team immediately.</p>
        </div>
    `;

    await sendEmail(userEmail, subject, text, html);
}

async function sendtransactionFailureEmail(userEmail, name, amount, fromAccount, toAccount) {
    const subject = "Transaction Failure Alert from Backend Ledger!";
    
    const text = `Hi ${name}, a transaction of $${amount} from account ${fromAccount} to account ${toAccount} has failed.`;
    
    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #E94E77;">Transaction Failure Alert, ${name}!</h2>
            <p>A transaction of <strong>$${amount}</strong> from account <strong>${fromAccount}</strong> to account <strong>${toAccount}</strong> has failed.</p>
            <p>Please review your transactions in your Backend Ledger account and try again.</p>
            <hr style="border: none; border-top: 1px solid #eee;" />
            <p style="font-size: 0.8em; color: #777;">If you did not attempt this transaction, please contact our support team immediately.</p>
        </div>
    `;

    await sendEmail(userEmail, subject, text, html);
}

module.exports = {
    sendRegistrationEmail,
    sendTransactionEmail,
    sendtransactionFailureEmail
}