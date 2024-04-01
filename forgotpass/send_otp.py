# import random
# import smtplib

# # Establish a connection with the SMTP server
# server = smtplib.SMTP('smtp.gmail.com', 587)
# server.starttls()

# # Login to your Gmail account
# email_address = 'ayushr21db009@gmail.com'
# password = 'jdpu erga kpfk xrgn'  
# server.login(email_address, password)

# # Generate OTP
# otp = ''.join([str(random.randint(0, 9)) for i in range(4)])


# subject = 'Your One Time Password (OTP)'
# body = f'Hello, your OTP is: {otp}'
# message = f'Subject: {subject}\n\n{body}'

# # Send the email
# recipient_email = 'ayushpareek2017@gmail.com'  
# server.sendmail(email_address, recipient_email, message)

# # Close the connection
# server.quit()

# import smtplib
# import random

# try:
#     server = smtplib.SMTP('smtp.gmail.com', 587)
#     server.starttls()
#     server.login('ayushr21db009@gmail.com', 'ixnp jklu mkvr mkal')  # Replace with your app password
#     otp = ''.join([str(random.randint(0, 9)) for i in range(6)])
#     msg = f'Hello, your OTP is: {otp}'
#     server.sendmail('ayushr21db009@gmail.com', 'ayushpareek2017@gmail.com', msg)
#     server.quit()
#     print("Email sent successfully!")
# except Exception as e:
#     print("An error occurred:", e)

from flask import Flask, request, jsonify
import smtplib
import random

app = Flask(__name__)

@app.route('/send_otp', methods=['POST'])
def send_otp():
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login('ayushr21db009@gmail.com', 'ixnp jklu mkvr mkal')  # Replace with your app password
        otp = ''.join([str(random.randint(0, 9)) for i in range(6)])
        msg = f'Hello, your OTP is: {otp}'
        server.sendmail('ayushr21db009@gmail.com', 'ayushpareek2017@gmail.com', msg)
        server.quit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)

