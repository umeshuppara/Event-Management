const nodemailer = require('nodemailer');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const buildHtmlContent = ({
  userName,
  eventTitle,
  eventDate,
  amount,
  bookingId,
  seats,
  ticketCount,
  transactionId,
}) => {
  const formattedSeats = Array.isArray(seats) && seats.length ? seats.join(', ') : 'N/A';
  const formattedTicketCount = ticketCount ?? (Array.isArray(seats) ? seats.length : 0);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #8B0000; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1>Payment Confirmed</h1>
      </div>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
        <div style="background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #8B0000; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #8B0000;">Booking Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; font-weight: bold;">Event:</td><td style="padding: 8px;">${eventTitle}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Event Date:</td><td style="padding: 8px;">${eventDate}</td></tr>
            <tr style="background-color: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Booking ID:</td><td style="padding: 8px;">${bookingId}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Amount Paid:</td><td style="padding: 8px;">${amount}</td></tr>
            <tr style="background-color: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Number of Tickets:</td><td style="padding: 8px;">${formattedTicketCount}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Seat/s:</td><td style="padding: 8px;">${formattedSeats}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Transaction ID:</td><td style="padding: 8px; word-break: break-all;">${transactionId}</td></tr>
          </table>
        </div>
      </div>
    </div>
  `;
};

const sendViaBrevo = async (options, htmlContent) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: process.env.EMAIL_FROM_NAME || 'EventHub Team',
        email: process.env.EMAIL_USER,
      },
      to: [{ email: options.to, name: options.userName }],
      subject: 'Payment Successful - EventHub',
      htmlContent,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || JSON.stringify(data));
  }

  return { success: true, messageId: data.messageId || null, data };
};

const sendViaSMTP = async (options, htmlContent) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('SMTP email configuration is incomplete. Set EMAIL_USER and EMAIL_PASS.');
  }

  const transportOptions = {
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  };

  if (process.env.EMAIL_HOST) {
    transportOptions.host = process.env.EMAIL_HOST;
    transportOptions.port = Number(process.env.EMAIL_PORT) || 587;
    transportOptions.secure = transportOptions.port === 465;
  } else if (process.env.EMAIL_SERVICE) {
    transportOptions.service = process.env.EMAIL_SERVICE;
  } else {
    throw new Error('SMTP email configuration is incomplete. Set EMAIL_SERVICE or EMAIL_HOST plus EMAIL_PORT.');
  }

  const transporter = nodemailer.createTransport(transportOptions);

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'EventHub Team'}" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: 'Payment Successful - EventHub',
    html: htmlContent,
  };

  const info = await transporter.sendMail(mailOptions);
  return { success: true, messageId: info.messageId, response: info.response };
};

exports.sendPaymentConfirmationEmail = async (options) => {
  try {
    if (!options || !options.to) {
      throw new Error('Missing recipient email address.');
    }

    const htmlContent = buildHtmlContent(options);

    if (process.env.BREVO_API_KEY) {
      return await sendViaBrevo(options, htmlContent);
    }

    return await sendViaSMTP(options, htmlContent);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
};
