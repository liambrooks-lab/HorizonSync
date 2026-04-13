import nodemailer from "nodemailer";

let cachedTransporter: nodemailer.Transporter | null | undefined;

export function getEmailTransporter() {
  if (cachedTransporter !== undefined) {
    return cachedTransporter;
  }

  const host = process.env.EMAIL_SERVER_HOST;
  const port = process.env.EMAIL_SERVER_PORT;
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD;

  if (!host || !port || !user || !pass) {
    cachedTransporter = null;
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    auth: {
      pass,
      user,
    },
    host,
    port: Number(port),
    secure: Number(port) === 465,
  });

  return cachedTransporter;
}

export function getEmailFromAddress() {
  return process.env.EMAIL_FROM ?? "HorizonSync <no-reply@horizonsync.app>";
}
