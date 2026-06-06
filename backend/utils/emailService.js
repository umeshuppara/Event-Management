const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
// Verify transporter connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Error:', error);
    console.log('Please check your EMAIL_USER and EMAIL_PASS (App Password) in .env');
  } else {
    console.log('✅ Email Server is ready to take our messages');
  }
});

/**
 * Send payment confirmation email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.userName - User name
 * @param {string} options.eventTitle - Event title
 * @param {string} options.eventDate - Event date
 * @param {number} options.amount - Payment amount
 * @param {string} options.bookingId - Booking ID
 * @param {Array<string>} options.seats - Seat numbers
 * @param {number} options.ticketCount - Number of tickets
 * @param {string} options.transactionId - Transaction ID
 */
exports.sendPaymentConfirmationEmail = async (options) => {
  try {
    const {
      to,
      userName,
      eventTitle,
      eventDate,
      amount,
      bookingId,
      seats,
      ticketCount,
      transactionId,
    } = options;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #8B0000; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1>Payment Confirmed</h1>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
          <div style="background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #8B0000; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #8B0000;">Booking Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; font-weight: bold;">Event:</td>
                <td style="padding: 8px;">${eventTitle}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Event Date:</td>
                <td style="padding: 8px;">${eventDate}</td>
              </tr>
              <tr style="background-color: #f9f9f9;">
                <td style="padding: 8px; font-weight: bold;">Booking ID:</td>
                <td style="padding: 8px;">${bookingId}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Amount Paid:</td>
                <td style="padding: 8px;">₹${amount}</td>
              </tr>
              <tr style="background-color: #f9f9f9;">
                <td style="padding: 8px; font-weight: bold;">Number of Tickets:</td>
                <td style="padding: 8px;">${ticketCount ?? (seats?.length || 0)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Seat/s:</td>
                <td style="padding: 8px;">${seats.join(', ')}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Transaction ID:</td>
                <td style="padding: 8px; word-break: break-all;">${transactionId}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    `;

    const fromName = process.env.EMAIL_FROM_NAME || 'EventHub';
    const mailOptions = {
      from: `"${fromName}" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Payment Successful - EventHub",
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    return { success: false, error: error.message };
  }
};
