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
  type OrderItemWithProduct,
  users, products, categories, orders, orderItems, cartItems, reviews, settings
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { IStorage } from "./storage";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PgSession = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

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
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Create the order
      const [order] = await tx
        .insert(orders)
        .values(orderData)
        .returning();

      // Dohvati nazive svih proizvoda koje treba dodati u narudžbu
      if (items.length > 0) {
        // Prikupi sve ID-jeve proizvoda za dohvaćanje naziva
        const productIds = items.map(item => item.productId);
        
        // Dohvati sve proizvode u jednom upitu
        const productsList = await tx
          .select({ id: products.id, name: products.name })
          .from(products)
          .where(
            productIds.length > 0 ?
              sql`${products.id} IN (${productIds.join(',')})` :
              sql`FALSE`
          );
        
        // Kreiraj mapu proizvoda po ID-ju za brže pretraživanje
        const productsMap = new Map(productsList.map(product => [product.id, product.name]));
        
        // Dodaj stavke narudžbe s nazivima proizvoda
        await tx
          .insert(orderItems)
          .values(
            items.map((item) => ({
              ...item,
              orderId: order.id,
              productName: productsMap.get(item.productId) || `Proizvod (ID: ${item.productId})`,
            }))
          );
      }

      return order;
    });
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async getOrderItems(orderId: number): Promise<OrderItemWithProduct[]> {
    try {
      console.log(`Dohvaćanje stavki za narudžbu ${orderId}`);
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      console.log(`Pronađeno ${items.length} stavki za narudžbu ${orderId}`);
      
      // Dohvaćanje svih ID-jeva proizvoda
      const productIds = items.map(item => item.productId);
      console.log(`ID-jevi proizvoda za dohvaćanje: ${productIds.join(', ')}`);
      
      // Dohvaćanje svih proizvoda u jednom upitu
      const allProducts = await db.select().from(products).where(
        productIds.length > 0 ? 
          sql`${products.id} IN (${productIds.join(',')})` : 
          sql`FALSE`
      );
      
      console.log(`Pronađeno ${allProducts.length} proizvoda iz baze`);
      
      // Mapiranje proizvoda po ID-ju za brži pristup
      const productsMap = new Map(allProducts.map(product => [product.id, product]));
      
      // Dohvati detalje za svaki proizvod
      const result = items.map((item) => {
        // Pronađi proizvod u mapi
        const product = productsMap.get(item.productId);
        
        console.log(`Stavka ${item.id}, Proizvod ID ${item.productId}, Pronađen: ${!!product}, Naziv iz narudžbe: ${item.productName}`);
        
        // Ako proizvod nije pronađen, stvori zamjenski proizvod s osnovnim informacijama
        // Koristi naziv proizvoda iz narudžbe ako postoji
        const resolvedProduct = product || {
          id: item.productId,
          name: item.productName || `Proizvod (ID: ${item.productId})`,
          createdAt: new Date(),
          description: "Proizvod nije pronađen",
          price: item.price,
          imageUrl: null,
          categoryId: null,
          stock: 0,
          burnTime: null,
          featured: false,
          hasColorOptions: false
        };
        
        return {
          ...item,
          product: resolvedProduct
        };
      });
      
      return result;
    } catch (error) {
      console.error("Greška prilikom dohvaćanja stavki narudžbe:", error);
      throw error;
    }
  }

  // Cart methods
  async getCartItems(userId: number): Promise<CartItemWithProduct[]> {
    const result = await db.query.cartItems.findMany({
      where: eq(cartItems.userId, userId),
      with: {
        product: true,
      },
    });

    // Convert the result to CartItemWithProduct type
    return result.map((item) => ({
      ...item,
      product: item.product,
    }));
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
    // First check if the setting exists
    const existingSetting = await this.getSetting(key);
    
    if (existingSetting) {
      // Update the existing setting
      const [updatedSetting] = await db
        .update(settings)
        .set({ 
          value,
          updatedAt: new Date()
        })
        .where(eq(settings.key, key))
        .returning();
      
      return updatedSetting;
    } else {
      // Create a new setting if it doesn't exist
      const newSetting = await this.createSetting({
        key,
        value
      });
      
      return newSetting;
    }
  }

  async deleteSetting(key: string): Promise<void> {
    await db.delete(settings).where(eq(settings.key, key));
  }
}