var nodemailer = require("nodemailer");

interface MailArg {
  smtpHost: string;
  smtpPort: number;
  smtpAuthUser: string;
  smtpAuthPass: string;
  emailTo: string;
  emailFrom: string;
  emailSubject: string;
  emailText?: string;
  emailHtml?: string;
}

export function sendResetPasswordEmail(
  email: string,
  username: string,
  newPassword: string,
): Promise<boolean> {
  return sendMail(
    email,
    "Password Reset",
    `Hi ${username},\n your new password is ${newPassword}`,
  );
}

export function sendMail(
  toEmail: string,
  subject: string,
  txtBody: string,
): Promise<boolean> {
  const arg = {
    smtpHost: process.env.SMTP_HOST || "smtpdm.aliyun.com",
    smtpPort: 25,
    smtpAuthUser: process.env.SMTP_AUTH_USER || "",
    smtpAuthPass: process.env.SMTP_AUTH_PASS || "",
    emailTo: toEmail,
    emailFrom: process.env.SMTP_AUTH_USER || "",
    emailSubject: subject,
    emailText: txtBody,
  } as MailArg;

  //https://help.aliyun.com/document_detail/29456.html?spm=a2c4g.29458.0.0.46ce5807sgk7Kw
  const transporter = nodemailer.createTransport({
    host: arg.smtpHost,
    port: arg.smtpPort,
    //"secureConnection": true, // use SSL, the port is 465
    auth: {
      user: arg.smtpAuthUser, // user name
      pass: arg.smtpAuthPass, // password
    },
  });
  const mailOptions = {
    from: arg.emailFrom, // sender address mail from must be same with the user
    to: arg.emailTo, // list of receivers
    subject: arg.emailSubject, // Subject line
    text: arg.emailText, // plaintext body
    html: arg.emailHtml, // html body
  };

  return new Promise((resolve, reject) => {
    // @ts-ignore
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error(error);
        reject(error);
      } else {
        resolve(true);
      }
      if (info) {
        console.info("Message sent: " + info.response);
      }
    });
  });
}
