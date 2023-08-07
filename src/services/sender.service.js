const twilio = require('twilio');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const Setup = () => {
  oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return oAuth2Client;
};

const SendMail = async (dest, subject, text) => {
  try {
    let oAuth2Client = Setup();
    const accessToken = await oAuth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: accessToken.token
      }
    });

    const mailOptions = {
      from: {
        name: 'OrganicShop',
        address: process.env.EMAIL
      },
      to: dest,
      subject: subject,
      text: text
    };
    return !!(await transport.sendMail(mailOptions));
  } catch (err) {
    console.log(err);
    return false;
  }
};

const SendSMS = async (body, to) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = twilio(accountSid, authToken);
    const item = await client.messages.create({
      body: body,
      messagingServiceSid: process.env.TWILIO_MESS_SERVICESID,
      to: to
    });
    return !!item;
  } catch (err) {
    console.log(err);
    return false;
  }
};

module.exports = {
  SendSMS,
  SendMail
};
