# Login verification — Accept or Reject

Use this to verify real login and then accept or reject the implementation.

---

## Verification steps

1. **Open the app over HTTP** (e.g. serve the folder and open the URL in the browser).
2. **Firebase**: In Firebase Console → your project → **Authentication** → **Sign-in method** → **Email/Password** is **enabled**.
3. **Click "Login"** in the nav → the auth modal opens.
4. **Enter** a valid email and password (from an account created via Sign up, or one you added in Firebase).
5. **Click "Login"** in the form → you are signed in and the **dashboard** is shown (landing/nav/footer hidden, dashboard visible).
6. **Sign up**: Switch to "Sign Up" tab, fill name/email/password, choose plan, click "Sign Up" → account is created and dashboard is shown.

---

## Accept or Reject

**Accept** if:
- Clicking "Login" in the nav opens the auth modal.
- Submitting the login form with valid credentials signs you in and shows the dashboard.
- Submitting the signup form creates an account and shows the dashboard.
- Errors (wrong password, email not found, etc.) show a clear message in the modal.

**Reject** if:
- "Login" in the nav does not open the modal.
- Submitting the form does nothing or the page reloads without signing in.
- Valid login does not show the dashboard.
- You see a blank screen, console errors, or behavior that blocks real login/signup.

---

Reply with **Accept** or **Reject** and, if Reject, what you saw (e.g. "modal doesn't open", "form submits but no dashboard", "error: …").
