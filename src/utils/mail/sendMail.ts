import nodemailer, { Transporter } from "nodemailer";
import path from "path";
import ejs from "ejs";


interface EmailOptions {
  email: string;
  subject: string;
  templateName: string;
  data: Record<string, any>;
}

export const sendMail = async (options: EmailOptions): Promise<void> => {
  try {
    

   

    const transporter: Transporter = nodemailer.createTransport({
      host:  process.env.SMTP_HOST,
      port:  parseInt(process.env.SMTP_PORT as string),
      service: process.env.SMTP_SERVICE,
      auth: {
        user:  process.env.SMTP_MAIL,
        pass:  process.env.SMTP_PASSWORD,
      },
    });
    const templatePath = path.join(process.cwd(), 'src','utils', 'mail', `${options.templateName}`);
   
    const html = await ejs.renderFile(templatePath, options.data);

    await transporter.sendMail({
      from:process.env.SMTP_MAIL,
      to: options.email,
      subject: options.subject,
      html,
    });
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
