
require("dotenv").config();

const { transporter, sendEmail } = require("./utils/mailer");

async function main() {
  await transporter.verify();
  console.log("SMTP connection successful!");

  const result = await sendEmail({
    to: process.env.SMTP_USER,
    subject: "FixAround SMTP Test",
    text: "Your FixAround email configuration is working.",
    html: "<h2>FixAround</h2><p>Your email setup is working!</p>",
  });

  console.log("Email accepted:", result.messageId);
}

main().catch((error) => {
  console.error("Email test failed:", error.message);
  process.exitCode = 1;
});
