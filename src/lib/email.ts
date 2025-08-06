import nodemailer from 'nodemailer';

// Email transporter configuration
let transporter: nodemailer.Transporter | null = null;

try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail', // You can change this to other services like 'outlook', 'yahoo', etc.
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use app-specific password for Gmail
      },
    });
  } else {
    console.warn('Email configuration not found. Email sending will be disabled.');
  }
} catch (error) {
  console.error('Failed to create email transporter:', error);
}

interface EmailVerificationData {
  email: string;
  name: string;
  verificationToken: string;
}

interface PasswordResetData {
  email: string;
  name: string;
  resetToken: string;
}

export const sendVerificationEmail = async (data: EmailVerificationData): Promise<boolean> => {
  try {
    if (!transporter) {
      console.warn('Email transporter not available. Skipping verification email.');
      return true; // Return true to not block the signup process
    }

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${data.verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: data.email,
      subject: 'Verify your email - CS2 Utility Library',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">CS2 Utility Library</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">Email Verification</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${data.name}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Thank you for signing up for CS2 Utility Library! To complete your registration and start sharing utilities with other players, please verify your email address.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: bold;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              If the button above doesn't work, you can copy and paste this link into your browser:
            </p>
            
            <p style="background: #f8f9fa; padding: 15px; border-radius: 5px; word-break: break-all; color: #667eea; font-family: monospace; font-size: 14px;">
              ${verificationUrl}
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 14px; margin-bottom: 10px;">
              This verification link will expire in 24 hours for security reasons.
            </p>
            
            <p style="color: #999; font-size: 14px; margin-bottom: 10px;">
              If you didn't create an account with CS2 Utility Library, you can safely ignore this email.
            </p>
            
            <p style="color: #999; font-size: 14px;">
              Best regards,<br>
              The CS2 Utility Library Team
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

export const sendPasswordResetEmail = async (data: PasswordResetData): Promise<boolean> => {
  try {
    if (!transporter) {
      console.warn('Email transporter not available. Skipping password reset email.');
      return true; // Return true to not block the process
    }

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${data.resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: data.email,
      subject: 'Reset your password - CS2 Utility Library',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">CS2 Utility Library</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">Password Reset</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${data.name}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              We received a request to reset your password for your CS2 Utility Library account. Click the button below to create a new password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: bold;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              If the button above doesn't work, you can copy and paste this link into your browser:
            </p>
            
            <p style="background: #f8f9fa; padding: 15px; border-radius: 5px; word-break: break-all; color: #667eea; font-family: monospace; font-size: 14px;">
              ${resetUrl}
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 14px; margin-bottom: 10px;">
              This password reset link will expire in 1 hour for security reasons.
            </p>
            
            <p style="color: #999; font-size: 14px; margin-bottom: 10px;">
              If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
            
            <p style="color: #999; font-size: 14px;">
              Best regards,<br>
              The CS2 Utility Library Team
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
  try {
    if (!transporter) {
      console.warn('Email transporter not available. Skipping welcome email.');
      return true; // Return true to not block the process
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to CS2 Utility Library!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">CS2 Utility Library</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">Welcome!</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to CS2 Utility Library, ${name}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Your email has been successfully verified! You now have full access to all features of CS2 Utility Library.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #333; margin-top: 0;">What you can do now:</h3>
              <ul style="color: #666; line-height: 1.8;">
                <li>Create and manage utility setups for all CS2 maps</li>
                <li>Share your utilities with teammates and friends</li>
                <li>Import utilities from other players</li>
                <li>Upload screenshots and videos for your utilities</li>
                <li>Organize utilities by map, team, and utility type</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: bold;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                Start Creating Utilities
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 14px;">
              If you have any questions or need help getting started, feel free to reach out to our support team.
            </p>
            
            <p style="color: #999; font-size: 14px;">
              Best regards,<br>
              The CS2 Utility Library Team
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}; 