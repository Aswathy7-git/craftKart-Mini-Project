const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  const port = Number(process.env.EMAIL_PORT) || 587;
  // Default to SendGrid SMTP if EMAIL_HOST not explicitly provided
  const host = process.env.EMAIL_HOST || 'smtp.sendgrid.net';

  const transportConfig = {
    host,
    port,
    secure: port === 465, // true for 465, false for 587/25
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  };

  return nodemailer.createTransport(transportConfig);
};

// Email templates
const templates = {
  welcome: (data) => ({
    subject: 'Welcome to CraftKart!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B5CF6;">Welcome to CraftKart, ${data.name}!</h2>
        <p>Thank you for joining our community of artisans and craft enthusiasts.</p>
        <p>Your account has been created successfully as a <strong>${data.role}</strong>.</p>
        <p>Start exploring amazing handmade products or showcase your own creations!</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}" 
             style="background-color: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Visit CraftKart
          </a>
        </div>
        <p>Best regards,<br>The CraftKart Team</p>
      </div>
    `
  }),
  
  passwordReset: (data) => ({
    subject: 'Password Reset - CraftKart',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B5CF6;">Password Reset Request</h2>
        <p>Hello ${data.name},</p>
        <p>You requested a password reset for your CraftKart account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/reset-password?token=${data.resetToken}" 
             style="background-color: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Reset Password
          </a>
        </div>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The CraftKart Team</p>
      </div>
    `
  }),
  
  orderConfirmation: (data) => ({
    subject: `Order Confirmation - ${data.orderNumber}`,
    html: `
        <h2 style="color: #8B5CF6;">Order Confirmed!</h2>
        <p>Hello ${data.customerName},</p>
        <p>Thank you for your order! We're excited to prepare your handmade items.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3>Order Details</h3>
          <p><strong>Order Total (buyer):</strong> ₹${data.total}</p>
          <p><strong>Status:</strong> ${data.status}</p>
        </div>
        <p>We'll send you updates as your order progresses.</p>
        <p>Best regards,<br>The CraftKart Team</p>
    `
  }),
  
  orderShipped: (data) => ({
    subject: `Your Order Has Shipped - ${data.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8B5CF6;">Your Order is on the Way!</h2>
        <p>Hello ${data.customerName},</p>
        <p>Great news! Your order has been shipped and is on its way to you.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3>Shipping Details</h3>
          <p><strong>Order Number:</strong> ${data.orderNumber}</p>
          <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
          <p><strong>Carrier:</strong> ${data.carrier}</p>
          <p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>
        </div>
        <p>Track your package: <a href="${data.trackingUrl}">${data.trackingUrl}</a></p>
        <p>Best regards,<br>The CraftKart Team</p>
      </div>
    `
  })
};

// Support kebab-case template key used elsewhere
templates['password-reset'] = templates.passwordReset;

// Send email function
const sendEmail = async ({ to, subject, template, data, html, text }) => {
  try {
    const transporter = createTransporter();
    
    let emailContent;
    if (template && templates[template]) {
      emailContent = templates[template](data);
    } else {
      emailContent = { subject, html, text };
    }

    const fromAddress = process.env.EMAIL_FROM || 'no-reply@craftkart.local';
    const mailOptions = {
      from: `"CraftKart" <${fromAddress}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

module.exports = { sendEmail };
