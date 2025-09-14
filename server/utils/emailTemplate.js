const LOGO_URL =
  "https://res.cloudinary.com/djni7gwm4/image/upload/v1756023613/EWarrants_white_jntxui.png";

exports.generateEmailHTML = ({ title, name, introText, code, outroText }) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
            .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .content { padding: 20px 30px; }
            .header { background-color: #1120a8; padding: 20px; text-align: center; }
            .footer { background-color: #f4f4f4; padding: 20px 30px; text-align: center; color: #888888; font-size: 12px; }
            .code-box { background-color: #f4f4f4; border: 1px solid #dddddd; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1120a8; margin: 20px 0; }
            .button { display: inline-block; background-color: #b140ff; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; }
            p { color: #555555; line-height: 1.6; }
        </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
            ${introText}
        </div>

        <table class="container" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <tr>
                <td class="header" style="background-color: #1120a8; padding: 20px; text-align: center;">
                    <img src="${LOGO_URL}" alt="eWarrants Logo" width="150" style="max-width: 150px;">
                </td>
            </tr>
            <tr>
                <td class="content" style="padding: 20px 30px;">
                    <h1 style="color: #1120a8;">${title}</h1>
                    <p style="color: #555555; line-height: 1.6;">Hi ${name},</p>
                    <p style="color: #555555; line-height: 1.6;">${introText}</p>
                    <div class="code-box" style="background-color: #f4f4f4; border: 1px solid #dddddd; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1120a8; margin: 20px 0;">
                        ${code}
                    </div>
                    <p style="color: #555555; line-height: 1.6;">${outroText}</p>
                </td>
            </tr>
            <tr>
                <td class="footer" style="background-color: #f4f4f4; padding: 20px 30px; text-align: center; color: #888888; font-size: 12px;">
                    <p>You received this email because a request was made on the eWarrants app. If you did not make this request, you can safely ignore this email.</p>
                    <p>&copy; ${new Date().getFullYear()} eWarrants. All rights reserved.</p>
                </td>
            </tr>
        </table>
    </body>
    </html>
  `;
};
