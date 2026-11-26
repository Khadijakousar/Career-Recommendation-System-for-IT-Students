import { z } from 'zod';

export const accountEmail = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email({ error: 'Enter a valid email address' }));

const password = z
  .string()
  .min(1, 'Enter your password')
  .refine(
    (value) => Buffer.byteLength(value, 'utf8') <= 72,
    'Password must be 72 bytes or fewer',
  );
export const accountPassword = password.min(8, 'Use at least 8 characters');
export const accountName = z.string().trim().min(1, 'Enter your name').max(100);
const confirmPassword = z.string().min(1, 'Confirm your password');

const emptyObject = z.strictObject({});

function requestSchema(body) {
  return z.object({ body, params: emptyObject, query: emptyObject });
}

export const registerSchema = requestSchema(
  z
    .strictObject({
      name: accountName,
      email: accountEmail,
      password: accountPassword,
      confirmPassword,
    })
    .refine((body) => body.password === body.confirmPassword, {
      path: ['confirmPassword'],
      message: 'Passwords must match',
    }),
);

export const loginSchema = requestSchema(
  z.strictObject({ email: accountEmail, password }),
);
export const meSchema = requestSchema(z.undefined());

export const changePasswordSchema = requestSchema(
  z
    .strictObject({
      currentPassword: password,
      newPassword: accountPassword,
      confirmPassword,
    })
    .refine((body) => body.newPassword === body.confirmPassword, {
      path: ['confirmPassword'],
      message: 'Passwords must match',
    })
    .refine((body) => body.newPassword !== body.currentPassword, {
      path: ['newPassword'],
      message: 'Choose a password different from your current password',
    }),
);
