import { z } from "zod";

// Zod schema to validate property creation/modification payloads
// Note: Since FormData sends everything as strings, we use z.preprocess or z.coerce 
// to automatically convert incoming strings to numbers, floats, or booleans.
export const propertySchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .trim()
    .min(5, { message: "Title must be at least 5 characters long" })
    .max(100, { message: "Title cannot exceed 100 characters" }),

  description: z
    .string({ required_error: "Description is required" })
    .trim()
    .min(10, { message: "Description must be at least 10 characters long" }),

  rent: z.preprocess(
    (val) => Number(val),
    z.number({ required_error: "Rent is required" }).positive({ message: "Rent must be a positive number" })
  ),

  bedrooms: z.preprocess(
    (val) => parseInt(val, 10),
    z.number().int().min(0, { message: "Bedrooms cannot be negative" })
  ),

  bathrooms: z.preprocess(
    (val) => parseInt(val, 10),
    z.number().int().min(0, { message: "Bathrooms cannot be negative" })
  ),

  isFurnished: z.preprocess(
    (val) => val === "true" || val === true,
    z.boolean().default(false)
  ),

  address: z
    .string({ required_error: "Address is required" })
    .trim()
    .min(5, { message: "Address must be at least 5 characters long" }),

  city: z
    .string({ required_error: "City is required" })
    .trim()
    .min(2, { message: "City must be at least 2 characters long" }),

  state: z
    .string({ required_error: "State is required" })
    .trim()
    .min(2, { message: "State must be at least 2 characters long" }),

  latitude: z.preprocess(
    (val) => parseFloat(val),
    z.number().min(-90).max(90)
  ),

  longitude: z.preprocess(
    (val) => parseFloat(val),
    z.number().min(-180).max(180)
  ),

  // Amenities can be submitted as a JSON string, which we parse and validate as an array of strings
  amenities: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return [val]; // Fallback to single item array
      }
    }
    return val;
  }, z.array(z.string()).min(1, { message: "At least one amenity is required" }))
});
