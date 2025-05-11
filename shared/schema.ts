import { pgTable, text, serial, integer, boolean, decimal, timestamp, json, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  country: text("country"),
  phone: text("phone"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  discountMinimumOrder: decimal("discount_minimum_order", { precision: 10, scale: 2 }).default("0"),
  discountExpiryDate: timestamp("discount_expiry_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  categoryId: integer("category_id"),
  stock: integer("stock").default(0).notNull(),
  scent: text("scent"),  // Direktno pohranjen miris za proizvod
  color: text("color"),  // Direktno pohranjena boja za proizvod
  burnTime: text("burn_time"),
  featured: boolean("featured").default(false).notNull(),
  hasColorOptions: boolean("has_color_options").default(true).notNull(),  // Treba li proizvod imati opcije boja
  allowMultipleColors: boolean("allow_multiple_colors").default(false).notNull(), // Omogućuje odabir više boja
  dimensions: text("dimensions"),  // Dimenzije proizvoda
  weight: text("weight"),  // Težina proizvoda
  materials: text("materials"),  // Materijali od kojih je proizvod napravljen
  instructions: text("instructions"),  // Upute za korištenje
  maintenance: text("maintenance"),  // Upute za održavanje
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

// Scents table (mirisi)
export const scents = pgTable("scents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  active: boolean("active").default(true).notNull(),
});

export const insertScentSchema = createInsertSchema(scents).omit({
  id: true,
});

// Colors table (boje)
export const colors = pgTable("colors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hexValue: text("hex_value").notNull(),
  active: boolean("active").default(true).notNull(),
});

export const insertColorSchema = createInsertSchema(colors).omit({
  id: true,
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("pending"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default("0"),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").default("pending").notNull(),
  customerNote: text("customer_note"), // Napomena kupca
  shippingAddress: text("shipping_address"),
  shippingCity: text("shipping_city"),
  shippingPostalCode: text("shipping_postal_code"),
  shippingCountry: text("shipping_country"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  productName: text("product_name"),  // Dodajemo ime proizvoda za prikaz
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  // Dodajemo polja za varijante proizvoda
  scentId: integer("scent_id"),
  scentName: text("scent_name"),
  colorId: integer("color_id"),
  colorName: text("color_name"),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

// Cart items table
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  scentId: integer("scent_id"),
  colorId: integer("color_id"),
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
});

// Product-Scent relations table
export const productScents = pgTable("product_scents", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  scentId: integer("scent_id").notNull(),
});

export const insertProductScentSchema = createInsertSchema(productScents).omit({
  id: true,
});

// Product-Color relations table
export const productColors = pgTable("product_colors", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  colorId: integer("color_id").notNull(),
});

export const insertProductColorSchema = createInsertSchema(productColors).omit({
  id: true,
});

// Relations for product scents and colors
export const productScentsRelations = relations(productScents, ({ one }) => ({
  product: one(products, {
    fields: [productScents.productId],
    references: [products.id],
  }),
  scent: one(scents, {
    fields: [productScents.scentId],
    references: [scents.id],
  }),
}));

export const productColorsRelations = relations(productColors, ({ one }) => ({
  product: one(products, {
    fields: [productColors.productId],
    references: [products.id],
  }),
  color: one(colors, {
    fields: [productColors.colorId],
    references: [colors.id],
  }),
}));

export const scentsRelations = relations(scents, ({ many }) => ({
  productScents: many(productScents),
}));

export const colorsRelations = relations(colors, ({ many }) => ({
  productColors: many(productColors),
}));

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  productId: integer("product_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Scent = typeof scents.$inferSelect;
export type InsertScent = z.infer<typeof insertScentSchema>;

export type Color = typeof colors.$inferSelect;
export type InsertColor = z.infer<typeof insertColorSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

// Definicija OrderItemWithProduct je premještena dolje u kodu

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type ProductScent = typeof productScents.$inferSelect;
export type InsertProductScent = z.infer<typeof insertProductScentSchema>;

export type ProductColor = typeof productColors.$inferSelect;
export type InsertProductColor = z.infer<typeof insertProductColorSchema>;

// Define relationships between tables
export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
  cartItems: many(cartItems),
  reviews: many(reviews),
  productScents: many(productScents),
  productColors: many(productColors),
  productCollections: many(productCollections),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  scent: one(scents, {
    fields: [cartItems.scentId],
    references: [scents.id],
  }),
  color: one(colors, {
    fields: [cartItems.colorId],
    references: [colors.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

// Extended CartItem type that includes product information
// Definiranje tablice za postavke
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export type CartItemWithProduct = CartItem & {
  product: Product;
  scent?: Scent;
  color?: Color;
};

export interface OrderItemWithProduct extends Omit<OrderItem, 'scentId' | 'colorId' | 'scentName' | 'colorName'> {
  product: Product;
  scent?: Scent;
  color?: Color;
  scentId: number | null;
  colorId: number | null;
  scentName: string | null;
  colorName: string | null;
}

// Definiranje tablice za stranice (O nama, Kontakt, Blog)
export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().unique(), // "about", "contact", "blog"
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPageSchema = createInsertSchema(pages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Page = typeof pages.$inferSelect;
export type InsertPage = z.infer<typeof insertPageSchema>;

// Definiranje tablice za kolekcije
export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  featuredOnHome: boolean("featured_on_home").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Collection = typeof collections.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;

// Relacijska tablica između proizvoda i kolekcija
export const productCollections = pgTable("product_collections", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  collectionId: integer("collection_id").notNull(),
});

export const insertProductCollectionSchema = createInsertSchema(productCollections).omit({
  id: true,
});

export type ProductCollection = typeof productCollections.$inferSelect;
export type InsertProductCollection = z.infer<typeof insertProductCollectionSchema>;

// Relacije za kolekcije
export const collectionsRelations = relations(collections, ({ many }) => ({
  productCollections: many(productCollections),
}));

// Dodajemo relacije za proizvode s kolekcijama
export const productCollectionsRelations = relations(productCollections, ({ one }) => ({
  product: one(products, {
    fields: [productCollections.productId],
    references: [products.id],
  }),
  collection: one(collections, {
    fields: [productCollections.collectionId],
    references: [collections.id],
  }),
}));

// Tablica za račune
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull(),
  orderId: integer("order_id"),
  userId: integer("user_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerAddress: text("customer_address"),
  customerCity: text("customer_city"),
  customerPostalCode: text("customer_postal_code"),
  customerCountry: text("customer_country"),
  customerPhone: text("customer_phone"),
  customerNote: text("customer_note"), // Napomena kupca
  paymentMethod: text("payment_method").default("cash").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  language: text("language").default("hr").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

// Tablica za stavke računa
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  selectedScent: text("selected_scent"),
  selectedColor: text("selected_color"),
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
});

// Definiranje tipova za račune
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

// Relacije za račune
export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  order: one(orders, {
    fields: [invoices.orderId],
    references: [orders.id],
  }),
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  product: one(products, {
    fields: [invoiceItems.productId],
    references: [products.id],
  }),
}));
