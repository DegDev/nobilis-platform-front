/**
 * User-visible strings for the admin login screen, isolated in one place. No i18n mechanism is
 * wired yet (milestone 05); centralising the strings here keeps the template free of hardcoded
 * text and gives that later pass a single seam to localise.
 */
export const LOGIN_STRINGS = {
  title: $localize`:@@AdminSignInTitle:Admin sign in`,
  email: $localize`:@@Email:Email`,
  password: $localize`:@@Password:Password`,
  submit: $localize`:@@SignIn:Sign in`,
  emailRequired: $localize`:@@EmailRequired:Email is required`,
  emailInvalid: $localize`:@@EmailInvalid:Enter a valid email address`,
  passwordRequired: $localize`:@@PasswordRequired:Password is required`,
  failed: $localize`:@@LoginFailed:Invalid email or password`,
} as const;
