import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  phone: text("phone"),
  lastActive: text("last_active"),
  status: text("status").default("disconnected"),
  userId: integer("user_id").notNull(),
  sessionData: text("session_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  port: integer("port").default(85),
  username: text("username"),
  password: text("password"),
  browserPath: text("browser_path"),
  userId: integer("user_id").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProfileSchema = createInsertSchema(profiles).pick({
  label: true,
  phone: true,
  userId: true,
});

export const updateProfileSchema = createInsertSchema(profiles).pick({
  label: true,
  phone: true,
  status: true,
  lastActive: true,
  sessionData: true,
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  port: true,
  username: true,
  password: true,
  browserPath: true,
  userId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type Profile = typeof profiles.$inferSelect;

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

export type MessageData = {
  to: string;
  message: string;
};

export type WhatsAppSession = {
  profileId: number;
  qrCode?: string;
  status: string;
};
