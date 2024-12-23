import os
from flask import Flask, jsonify, request
from flask_restful import Resource
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class EmailNotificationAPI(Resource):
    def __init__(self):
        super(EmailNotificationAPI, self).__init__()
        self.config = self.load_smtp_config()

    def load_smtp_config(self):
        return {
            'smtp_server': os.getenv('SMTP_SERVER'),
            'smtp_port': os.getenv('SMTP_PORT'),
            'comm_email_id': os.getenv('COMM_EMAIL_ID'),
        }

    def send_email(self, to_email, subject, body):
        """
        Sends an email using the configured SMTP server.
        :param to_email: Recipient email address
        :param subject: Subject of the email
        :param body: Body of the email
        :return: Status message
        """
        try:
            # Config
            smtp_server = self.config.get('smtp_server')
            smtp_port = int(self.config.get('smtp_port'))
            from_email = self.config.get('comm_email_id')

            if not smtp_server or not smtp_port or not from_email:
                return {'status': 'error', 'message': f'Missing SMTP configuration'}

            # Email content
            msg = MIMEMultipart()
            msg['From'] = from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'html'))
            logging.info(f"Email msg: {msg}")

            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.sendmail(from_email, to_email, msg.as_string())
                return {'status': 'success', 'message': 'Email sent successfully!'}
        except Exception as e:
            logging.error(f"Failed to send email: {e}")
            return {'status': 'error', 'message': f'Failed to send email: {str(e)}'}

    def post(self):
        """
        Handles POST requests to send an email notification.

        Expects a JSON request with 'to_email' and 'body' fields. Optionally, a 'subject' 
        field can be provided, otherwise a default subject is used. Validates the presence 
        of required fields and sends an email using the configured SMTP server.

        Returns:
            - 200 OK with a success message if the email is sent successfully.
            - 400 Bad Request if the required fields are missing.
            - 500 Internal Server Error if any other error occurs during processing.
        """
        try:
            data = request.json

            if not data or 'to_email' not in data or 'body' not in data:
                return {"status": "error", "message": "Missing 'to_email' or 'body' in request"}, 400

            to_email = data['to_email']
            body = data['body']
            subject = data.get('subject', "Default Subject")

            result = self.send_email(to_email, subject, body)
            if result['status'] == 'success':
                return {'status': 'success', 'message': result['message']}, 200
            else:
                return {'status': 'error', 'message': result['message']}, 500
        except Exception as e:
            return {'status': 'error', 'message': f'Failed to send email: {str(e)}'}, 500
