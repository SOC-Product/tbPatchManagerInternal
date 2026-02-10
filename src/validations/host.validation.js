import { z } from "zod";

export const validateCreateHost = z.object({
  computer_name: z
    .string({ required_error: "Host name is required" })
    .trim()
    .min(1, "Host name is required")
    .max(255, "Host name must be 255 characters or less"),

  criticality: z
    .string({ required_error: "Criticality is required" })
    .trim()
    .min(1, "Criticality is required"),


  operating_system: z
    .string({ required_error: "Operating system is required" })
    .trim()
    .min(1, "Operating system is required"),


  os_version: z
    .string({ required_error: "OS version is required" })
    .trim()
    .min(1, "OS version is required"),

  ip: z
    .string()
    .max(255, "IP must be 255 characters or less")
    .optional(),

  username: z.string().optional(),
  password: z.string().optional(),
  ssh_key_file: z.string().optional()
});
