import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface CampaignEmailData {
  campaignId: string;
  campaignName: string;
  userEmail: string;
  userName: string;
  messageTemplate: string;
  userCountry: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor() {
    this.createTransporter();
  }

  private createTransporter() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mailhog',
      port: parseInt(process.env.SMTP_PORT || '1025'),
      secure: false,
      auth: undefined,
      tls: {
        rejectUnauthorized: false
      }
    } as any);

    this.logger.log('Email transporter configured for MailHog');
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Campaign Hub <noreply@campaignhub.com>',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      this.logger.log(`Email sent successfully: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send email', error);
      return false;
    }
  }

  async sendCampaignNotification(data: CampaignEmailData): Promise<boolean> {
    const personalizedMessage = this.personalizeMessage(data.messageTemplate, {
      name: data.userName,
      country: data.userCountry,
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Campaign: ${data.campaignName}</h2>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 16px; line-height: 1.6; margin: 0;">
            ${personalizedMessage}
          </p>
        </div>
        <div style="font-size: 12px; color: #6b7280; margin-top: 20px;">
          <p>This is a campaign notification from Campaign Hub.</p>
          <p>Campaign ID: ${data.campaignId}</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: data.userEmail,
      subject: `Campaign Notification: ${data.campaignName}`,
      text: personalizedMessage,
      html: htmlContent,
    });
  }

  async sendCampaignStatusNotification(
    email: string,
    campaignName: string,
    status: 'activated' | 'paused' | 'completed' | 'created' | 'deleted',
    statistics?: {
      totalUsers: number;
      messagesSent: number;
      messagesDelivered: number;
      messagesOpened: number;
    }
  ): Promise<boolean> {
    const statusMessages = {
      activated: 'Your campaign has been activated and is now running.',
      paused: 'Your campaign has been paused.',
      completed: 'Your campaign has completed successfully.',
      created: 'A new campaign has been created.',
      deleted: 'Your campaign has been deleted.',
    };

    let htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Campaign Status Update</h2>
        <p style="font-size: 18px; font-weight: bold;">Campaign: ${campaignName}</p>
        <p style="font-size: 16px; color: #374151;">${statusMessages[status]}</p>
    `;

    if (statistics) {
      htmlContent += `
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Campaign Statistics</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 8px 0;"><strong>Target Users:</strong> ${statistics.totalUsers.toLocaleString()}</li>
            <li style="margin: 8px 0;"><strong>Messages Sent:</strong> ${statistics.messagesSent.toLocaleString()}</li>
            <li style="margin: 8px 0;"><strong>Messages Delivered:</strong> ${statistics.messagesDelivered.toLocaleString()}</li>
            <li style="margin: 8px 0;"><strong>Messages Opened:</strong> ${statistics.messagesOpened.toLocaleString()}</li>
          </ul>
        </div>
      `;
    }

    htmlContent += `
        <div style="font-size: 12px; color: #6b7280; margin-top: 20px;">
          <p>This is an automated notification from Campaign Hub.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Campaign ${status.charAt(0).toUpperCase() + status.slice(1)}: ${campaignName}`,
      text: `Campaign "${campaignName}" ${statusMessages[status]}`,
      html: htmlContent,
    });
  }

  private personalizeMessage(template: string, variables: Record<string, string>): string {
    let personalized = template;
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      personalized = personalized.replace(new RegExp(placeholder, 'g'), value);
    });
    return personalized;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Email service connection verified');
      return true;
    } catch (error) {
      this.logger.error('Email service connection failed', error);
      return false;
    }
  }
} 