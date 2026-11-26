import { z } from 'zod';

const email = z
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
const newPassword = password.min(8, 'Use at least 8 characters');
const confirmPassword = z.string().min(1, 'Confirm your password');

const emptyObject = z.strictObject({});

function requestSchema(body) {
  return z.object({ body, params: emptyObject, query: emptyObject });
}

export const registerSchema = requestSchema(
  z
    .strictObject({
      name: z.string().trim().min(1, 'Enter your name').max(100),
      email,
      password: newPassword,
      confirmPassword,
    })
    .refine((body) => body.password === body.confirmPassword, {
      path: ['confirmPassword'],
      message: 'Passwords must match',
    }),
);

export const loginSchema = requestSchema(z.strictObject({ email, password }));
export const meSchema = requestSchema(z.undefined());

export const changePasswordSchema = requestSchema(
  z
    .strictObject({ currentPassword: password, newPassword, confirmPassword })
    .refine((body) => body.newPassword === body.confirmPassword, {
      path: ['confirmPassword'],
      message: 'Passwords must match',
    })
    .refine((body) => body.newPassword !== body.currentPassword, {
      path: ['newPassword'],
      message: 'Choose a password different from your current password',
    }),
);
