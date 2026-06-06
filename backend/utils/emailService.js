const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

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
              <tr><td style="padding: 8px; font-weight: bold;">Event:</td><td style="padding: 8px;">${eventTitle}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Event Date:</td><td style="padding: 8px;">${eventDate}</td></tr>
              <tr style="background-color: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Booking ID:</td><td style="padding: 8px;">${bookingId}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Amount Paid:</td><td style="padding: 8px;">₹${amount}</td></tr>
              <tr style="background-color: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Number of Tickets:</td><td style="padding: 8px;">${ticketCount ?? (seats?.length || 0)}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Seat/s:</td><td style="padding: 8px;">${seats.join(', ')}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Transaction ID:</td><td style="padding: 8px; word-break: break-all;">${transactionId}</td></tr>
            </table>
          </div>
        </div>
      </div>
    `;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: process.env.EMAIL_FROM_NAME || 'EventHub Team',
          email: process.env.EMAIL_USER,
        },
        to: [{ email: to, name: userName }],
        subject: 'Payment Successful - EventHub',
        htmlContent,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      console.log('✅ Email sent successfully:', data);
      return { success: true, messageId: data.messageId };
    } else {
      console.error('❌ Email API error:', data);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
};