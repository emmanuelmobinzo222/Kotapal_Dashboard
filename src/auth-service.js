// Authentication Service for Google OAuth and Email
const axios = require('axios');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Email Configuration (using Gmail SMTP or other service)
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = process.env.EMAIL_PORT || 587;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@kotapal.com';

// Check if email is configured
function isEmailConfigured() {
  return !!(EMAIL_USER && EMAIL_PASSWORD);
}

// Check if Google OAuth is configured
function isGoogleConfigured() {
  return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
}

// Create email transporter
function createTransporter() {
  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD
    }
  });
}

// Generate password reset token
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Verify Google OAuth token
async function verifyGoogleToken(token) {
  try {
    const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    
    if (response.data.aud !== GOOGLE_CLIENT_ID) {
      throw new Error('Invalid token audience');
    }
    
    return {
      googleId: response.data.sub,
      email: response.data.email,
      name: response.data.name,
      picture: response.data.picture
    };
  } catch (error) {
    console.error('Google token verification error:', error.message);
    throw new Error('Invalid Google token');
  }
}

// Send password reset email
async function sendPasswordResetEmail(email, resetToken, userId) {
  if (!isEmailConfigured()) {
    console.error('Email not configured. Password reset email cannot be sent.');
    throw new Error('Email service not configured');
  }

  // Use the correct frontend URL (production or development)
  const frontendUrl = process.env.FRONTEND_URL || process.env.BASE_URL || 'http://localhost:3001';
  const resetUrl = `${frontendUrl}?token=${resetToken}&userId=${userId}`;
  
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"Kota Team" <${EMAIL_FROM}>`,
    to: email,
    subject: 'Reset Your Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; }
          .content { padding: 30px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>Hi there,</p>
            <p>We received a request to reset the password for your account. Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Kota. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}

// Send welcome email
async function sendWelcomeEmail(email, name) {
  if (!isEmailConfigured()) {
    console.log('Email not configured. Welcome email skipped.');
    return;
  }

  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"Kota Team" <${EMAIL_FROM}>`,
    to: email,
    subject: 'Welcome to Kota!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; }
          .content { padding: 30px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Kota!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for joining Kota! We're excited to have you on board.</p>
            <p>Get started by creating your first SmartBlock and tracking your affiliate performance.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard" class="button">Go to Dashboard</a>
            <p>If you have any questions, feel free to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 Kota. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', email);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw, just log
  }
}

module.exports = {
  isEmailConfigured,
  isGoogleConfigured,
  verifyGoogleToken,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  generateResetToken
};

