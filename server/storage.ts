import { 
  type User, type InsertUser, 
  type Product, type InsertProduct,
  type Category, type InsertCategory,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type CartItem, type InsertCartItem,
  type Review, type InsertReview,
  type Setting, type InsertSetting,
  type CartItemWithProduct,
  users, products, categories, orders, orderItems, cartItems, reviews, settings
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db, pool } from "./db";
import { eq, and, desc } from "drizzle-orm";
import connectPg from "connect-pg-simple";

const MemoryStore = createMemoryStore(session);
const PgSession = connectPg(session);

// Define SessionStore type
type SessionStore = session.Store;

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Product methods
  getProduct(id: number): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: InsertProduct): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<void>;
  
  // Category methods
  getCategory(id: number): Promise<Category | undefined>;
  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  
  // Order methods
  getOrder(id: number): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  getUserOrders(userId: number): Promise<Order[]>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  
  // Cart methods
  getCartItems(userId: number): Promise<CartItemWithProduct[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number, userId: number): Promise<CartItem | undefined>;
  removeFromCart(id: number, userId: number): Promise<void>;
  clearCart(userId: number): Promise<void>;
  
  // Review methods
  getProductReviews(productId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Settings methods
  getSetting(key: string): Promise<Setting | undefined>;
  getAllSettings(): Promise<Setting[]>;
  createSetting(setting: InsertSetting): Promise<Setting>;
  updateSetting(key: string, value: string): Promise<Setting | undefined>;
  deleteSetting(key: string): Promise<void>;
  
  // Session store
  sessionStore: SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private categories: Map<number, Category>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private cartItems: Map<number, CartItem>;
  private reviews: Map<number, Review>;
  
  private userIdCounter: number;
  private productIdCounter: number;
  private categoryIdCounter: number;
  private orderIdCounter: number;
  private orderItemIdCounter: number;
  private cartItemIdCounter: number;
  private reviewIdCounter: number;
  
  sessionStore: SessionStore;
  
  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.categories = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.cartItems = new Map();
    this.reviews = new Map();
    
    this.userIdCounter = 1;
    this.productIdCounter = 1;
    this.categoryIdCounter = 1;
    this.orderIdCounter = 1;
    this.orderItemIdCounter = 1;
    this.cartItemIdCounter = 1;
    this.reviewIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    this.initializeCategories();
    this.initializeProducts();
    this.createDefaultAdmin();
  }
  
  // ... rest of MemStorage implementation
  
  private async initializeCategories() {
    // Your existing code
  }
  
  private async initializeProducts() {
    // Your existing code
  }
  
  private async createDefaultAdmin() {
    // Your existing code
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;

  constructor() {
    // Initialize PostgreSQL session store
    this.sessionStore = new PgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.featured, true));
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(productData).returning();
    return product;
  }

  async updateProduct(id: number, productData: InsertProduct): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(categoryData).returning();
    return category;
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.categoryId, categoryId));
  }

  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async createOrder(orderData: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    // Create the order
    const [order] = await db.insert(orders).values(orderData).returning();
    
    // Create the order items with the order ID
    if (items.length > 0) {
      await db.insert(orderItems).values(
        items.map((item) => ({
          ...item,
          orderId: order.id,
        }))
      );
    }
    
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  // Cart methods
  async getCartItems(userId: number): Promise<CartItemWithProduct[]> {
    // Dohvati stavke košarice
    const items = await db.select().from(cartItems).where(eq(cartItems.userId, userId));
    
    // Za svaku stavku košarice, dohvati pripadajući proizvod
    const itemsWithProducts: CartItemWithProduct[] = [];
    
    for (const item of items) {
      const [product] = await db.select().from(products).where(eq(products.id, item.productId));
      
      if (product) {
        itemsWithProducts.push({
          ...item,
          product,
        });
      }
    }
    
    return itemsWithProducts;
  }

  async addToCart(itemData: InsertCartItem): Promise<CartItem> {
    // Check if the product is already in the cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, itemData.userId),
          eq(cartItems.productId, itemData.productId)
        )
      );

    if (existingItem) {
      // Update quantity if item exists
      const [updatedItem] = await db
        .update(cartItems)
        .set({
          quantity: existingItem.quantity + itemData.quantity,
        })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Insert new item
      const [cartItem] = await db.insert(cartItems).values(itemData).returning();
      return cartItem;
    }
  }

  async updateCartItem(
    id: number,
    quantity: number,
    userId: number
  ): Promise<CartItem | undefined> {
    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))
      .returning();
    return updatedItem;
  }

  async removeFromCart(id: number, userId: number): Promise<void> {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
  }

  async clearCart(userId: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  // Review methods
  async getProductReviews(productId: number): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(reviewData: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(reviewData).returning();
    return review;
  }

  // Settings methods
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }

  async getAllSettings(): Promise<Setting[]> {
    return await db.select().from(settings);
  }

  async createSetting(settingData: InsertSetting): Promise<Setting> {
    const [setting] = await db.insert(settings).values(settingData).returning();
    return setting;
  }

  async updateSetting(key: string, value: string): Promise<Setting | undefined> {
    const [setting] = await db
      .update(settings)
      .set({ 
        value,
        updatedAt: new Date()
      })
      .where(eq(settings.key, key))
      .returning();
    return setting;
  }

  async deleteSetting(key: string): Promise<void> {
    await db.delete(settings).where(eq(settings.key, key));
  }
}

// Use database storage instead of memory storage
export const storage = new DatabaseStorage();