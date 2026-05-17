import { Resend } from "resend";
import { env } from "../config/env";
import { logger } from "../utils/logger";

let resend: Resend | null = null;
if (env.RESEND_API_KEY) {
  resend = new Resend(env.RESEND_API_KEY);
}

export const emailService = {
  async sendEmail({
    to,
    subject,
    html,
  }: {
    to: string | string[];
    subject: string;
    html: string;
  }): Promise<boolean> {
    if (!resend) {
      logger.warn(`Email not sent (Resend API key missing): To=${to} Subject="${subject}"`);
      return false;
    }

    try {
      await resend.emails.send({
        from: "AI SEO Tracker <noreply@seo-rank-tracker.com>", // Replace with verified domain
        to,
        subject,
        html,
      });
      logger.info(`Email sent to ${to}: "${subject}"`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email to ${to}`, error);
      return false;
    }
  },

  async sendReport(to: string, reportUrl: string) {
    return this.sendEmail({
      to,
      subject: "Your SEO Report is Ready",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your SEO Report</h2>
          <p>The SEO audit and ranking report you requested is now available.</p>
          <a href="${reportUrl}" style="display: inline-block; padding: 10px 20px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px;">View Report</a>
        </div>
      `,
    });
  }
};
