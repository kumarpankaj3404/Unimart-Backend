import nodemailer from 'nodemailer';

export const sendEmail = async (to, subject, html) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASS
        }
    });

    return transporter.sendMail({
        from: `"UNIMART" <${process.env.SMTP_EMAIL}>`,
        to,
        subject,
        html
    });
};