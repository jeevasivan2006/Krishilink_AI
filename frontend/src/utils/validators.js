import { z } from 'zod';

/* ─────────────────────────────────────────────────────────────────
 *  Reusable primitive schemas
 * ───────────────────────────────────────────────────────────────── */
export const zEmail = z
  .string()
  .min(1, 'Email is required')
  .email('Enter a valid email address');

export const zPassword = z
  .string()
  .min(8,  'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number');

/** Login password — looser than registration (no complexity rules) */
export const zLoginPassword = z
  .string()
  .min(1, 'Password is required')
  .max(128, 'Password too long');

export const zPhone = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');

export const zName = z
  .string()
  .min(2,  'Name must be at least 2 characters')
  .max(60, 'Name must be at most 60 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces');

export const zRequiredString = (field = 'This field') =>
  z.string().min(1, `${field} is required`);

export const zPositiveNumber = (field = 'Value') =>
  z.number({ invalid_type_error: `${field} must be a number` })
   .positive(`${field} must be positive`);

/* ─────────────────────────────────────────────────────────────────
 *  Auth schemas
 * ───────────────────────────────────────────────────────────────── */

/** Generic login schema — used by farmer, driver, and admin login pages */
export const loginSchema = z.object({
  email:    zEmail,
  password: zLoginPassword,
});

/** Farmer-specific login (alias of loginSchema — extensible for future fields) */
export const farmerLoginSchema = loginSchema;

/** Driver-specific login (alias of loginSchema — extensible for future fields) */
export const driverLoginSchema = loginSchema;

/** Admin login schema */
export const adminLoginSchema = z.object({
  email:    zEmail,
  password: zLoginPassword,
});

/** Farmer registration */
export const farmerRegisterSchema = z
  .object({
    name:            zName,
    email:           zEmail,
    phone:           zPhone,
    password:        zPassword,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    // Farmer-specific optional fields
    farmName:        z.string().max(100).optional(),
    farmLocation:    z.string().max(200).optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path:    ['confirmPassword'],
  });

/** Driver (lorry owner) registration */
export const driverRegisterSchema = z
  .object({
    name:             zName,
    email:            zEmail,
    phone:            zPhone,
    password:         zPassword,
    confirmPassword:  z.string().min(1, 'Please confirm your password'),
    // Driver-specific optional fields
    vehicleType:      z.string().min(1, 'Vehicle type is required'),
    vehicleNumber:    z
      .string()
      .min(1, 'Vehicle number is required')
      .max(20, 'Vehicle number too long'),
    licenseNumber:    z
      .string()
      .min(1, 'License number is required')
      .max(50, 'License number too long'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path:    ['confirmPassword'],
  });

/**
 * Combined register schema — used when role is selected on the same form.
 * Validates common fields; role-specific fields validated per-page.
 */
export const registerSchema = z
  .object({
    name:            zName,
    email:           zEmail,
    phone:           zPhone,
    password:        zPassword,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role:            z.enum(['farmer', 'driver'], { required_error: 'Select a role' }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path:    ['confirmPassword'],
  });

/* ─────────────────────────────────────────────────────────────────
 *  Other feature schemas
 * ───────────────────────────────────────────────────────────────── */
export const bookingSchema = z.object({
  pickupLocation:      zRequiredString('Pickup location'),
  dropLocation:        zRequiredString('Drop location'),
  pickupDate:          zRequiredString('Pickup date'),
  vehicleType:         zRequiredString('Vehicle type'),
  produceType:         zRequiredString('Produce type'),
  weightKg:            zPositiveNumber('Weight'),
  specialInstructions: z.string().max(500).optional(),
});
