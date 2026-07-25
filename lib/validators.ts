import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const inventorySchema = z.object({
  name: z.string().min(2, "Item name is required."),
  sku: z.string().min(2, "SKU is required."),
  categoryId: z.string().min(1, "Select a category."),
  supplierName: z.string().min(1, "Supplier is required."),
  unit: z.string().min(1, "Unit is required."),
  currentStock: z.coerce.number().min(0, "Stock cannot be negative."),
  minStockLevel: z.coerce.number().min(0, "Minimum stock cannot be negative."),
  maxStockLevel: z.coerce.number().min(0, "Maximum stock cannot be negative."),
  costPrice: z.coerce.number().min(0, "Cost price cannot be negative."),
  sellingPrice: z.coerce.number().min(0, "Selling price cannot be negative."),
  location: z.string().min(1, "Location is required."),
  imageUrl: z.string().default(""),
});

export const stockAdjustmentSchema = z.object({
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  quantity: z.coerce.number().positive("Quantity must be greater than zero."),
  reason: z.string().min(3, "Reason is required."),
});

export const categorySchema = z.object({
  name: z.string().min(2, "Category name is required."),
  description: z.string().min(2, "Description is required."),
});

export const supplierSchema = z.object({
  name: z.string().min(2, "Supplier name is required."),
  contactEmail: z.string().email("Enter a valid email address."),
  phone: z.string().min(6, "Phone is required."),
  address: z.string().min(5, "Address is required."),
});

export const userInviteSchema = z.object({
  name: z.string().min(2, "Name is required."),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(["ADMIN", "MANAGER", "VIEWER"]),
});

export const profileSchema = z.object({
  name: z.string().min(2, "Name is required."),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters.")
    .or(z.literal("")),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type InventoryValues = z.infer<typeof inventorySchema>;
export type StockAdjustmentValues = z.infer<typeof stockAdjustmentSchema>;
export type CategoryValues = z.infer<typeof categorySchema>;
export type SupplierValues = z.infer<typeof supplierSchema>;
export type UserInviteValues = z.infer<typeof userInviteSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
