DAVID'S HOSPITAL — FULL-STACK WEBSITE
=====================================

This version keeps the responsive David's Hospital website and adds a real Node.js backend.

WHAT IS INCLUDED
----------------
- Responsive HTML/CSS/JavaScript frontend
- Node.js + Express backend
- Contact form -> Gmail delivery
- Appointment form -> Gmail delivery
- WhatsApp click-to-chat button for patients
- Optional WhatsApp Cloud API endpoint
- Rate limiting on public form endpoints
- .env configuration so passwords/tokens are not placed in the frontend

FOLDER
------
savealife-hospital/
  index.html
  style.css
  script.js
  server.js
  package.json
  .env.example
  .gitignore
  README.txt
  images/

IMPORTANT SECURITY RULE
-----------------------
Never put a Gmail password, Gmail App Password, WhatsApp access token, or other secret inside index.html or script.js.
Keep secrets inside .env and never upload .env to GitHub.

SET UP THE BACKEND
------------------
1. Install Node.js 18+ (Node 20+ recommended).
2. Open this folder in VS Code.
3. Open the VS Code terminal.
4. Run:

   npm install

5. Copy .env.example and rename the copy to:

   .env

6. Open .env and fill in the Gmail details.

GMAIL SETUP
-----------
For Gmail, use a Google App Password rather than your normal Gmail password.

Typical values:

GMAIL_USER=yourhospital@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
HOSPITAL_EMAIL=yourhospital@gmail.com

The hospital Gmail account should have 2-Step Verification enabled before creating an App Password.

RUN THE WEBSITE
---------------
In the VS Code terminal:

   npm start

Then open:

   http://localhost:3000

TEST THE BACKEND
----------------
Open:

   http://localhost:3000/api/health

You should see a JSON status response.

CONTACT FORM
------------
When a visitor submits the contact form, the backend sends the message to HOSPITAL_EMAIL through Gmail.
The visitor's email is used as the reply-to address.

APPOINTMENT FORM
----------------
When a visitor submits the appointment form, the backend sends the appointment information to HOSPITAL_EMAIL through Gmail.

WHATSAPP
--------
The Talk to a Doctor buttons open a WhatsApp chat with:

   2348136217095

The number is already configured in script.js.

OPTIONAL WHATSAPP CLOUD API
---------------------------
The backend also contains POST /api/whatsapp for Meta WhatsApp Cloud API messages.
To activate that server-side API, add these values to .env:

WHATSAPP_ACCESS_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_meta_phone_number_id
WHATSAPP_API_VERSION=v23.0

The Meta WhatsApp Business setup must be completed first. WhatsApp business-initiated messages can be subject to Meta's conversation/template rules.

DEPLOYMENT
----------
For real public use, deploy the Node.js application to a Node-compatible host such as Render, Railway, Fly.io, or your own VPS.
Do not deploy only the HTML files if you want the Gmail backend to work.

Also set your production environment variables on the hosting provider rather than committing .env to GitHub.

MEDICAL WEBSITE WARNING
-----------------------
This is a website project/demo. Before real hospital use, the hospital should verify all medical information, emergency procedures, contact details, privacy requirements, and patient-data handling.
