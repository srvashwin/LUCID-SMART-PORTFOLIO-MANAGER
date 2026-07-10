import smtplib
from email.mime.text import MIMEText
from app.config import settings


def send_email(to: str, subject: str, body: str) -> bool:
    """Send email via SMTP. Falls back to printing to console."""
    if settings.SMTP_HOST:
        try:
            msg = MIMEText(body, "plain")
            msg["Subject"] = subject
            msg["From"] = settings.SMTP_FROM_EMAIL or "noreply@lucid.app"
            msg["To"] = to

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            return True
        except Exception as e:
            print(f"[email] SMTP failed: {e}. Falling back to console.")

    print(f"[email] To: {to}")
    print(f"[email] Subject: {subject}")
    print(f"[email] Body:\n{body}\n")
    return False


def send_password_reset(email: str, name: str, reset_url: str) -> None:
    body = f"""Hi {name},

We received a request to reset your Lucid password.

Click the link below to reset it:
{reset_url}

This link expires in 1 hour.

If you didn't request this, you can safely ignore this email.

- Lucid Team
"""
    send_email(
        to=email,
        subject="Reset your Lucid password",
        body=body,
    )


def send_verification_email(email: str, name: str, verification_url: str) -> None:
    body = f"""Hi {name},

Welcome to Lucid! Please verify your email address by clicking the link below:

{verification_url}

This link expires in 1 hour.

If you didn't create a Lucid account, you can safely ignore this email.

- Lucid Team
"""
    send_email(
        to=email,
        subject="Verify your Lucid email",
        body=body,
    )
