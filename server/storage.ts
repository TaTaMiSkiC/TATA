import { 
  type User, type InsertUser, 
  type Product, type InsertProduct,
  type Category, type InsertCategory,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type CartItem, type InsertCartItem,
  type Review, type InsertReview,
  type Setting, type InsertSetting,
  type Page, type InsertPage,
  type CartItemWithProduct,
  type OrderItemWithProduct,
  type Scent, type InsertScent,
  type Color, type InsertColor,
  type ProductScent, type InsertProductScent,
  type ProductColor, type InsertProductColor,
  type Collection, type InsertCollection,
  type ProductCollection,
  users, products, categories, orders, orderItems, cartItems, reviews, settings, pages,
  scents, colors, productScents, productColors, collections, productCollections
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db, pool } from "./db";
import { eq, and, desc, count, sql } from "drizzle-orm";
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
  updateCategory(id: number, category: InsertCategory): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<void>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  
  // Scent methods
  getScent(id: number): Promise<Scent | undefined>;
  getAllScents(): Promise<Scent[]>;
  getActiveScents(): Promise<Scent[]>;
  createScent(scent: InsertScent): Promise<Scent>;
  updateScent(id: number, scent: InsertScent): Promise<Scent | undefined>;
  deleteScent(id: number): Promise<void>;
  getProductScents(productId: number): Promise<Scent[]>;
  addScentToProduct(productId: number, scentId: number): Promise<ProductScent>;
  removeScentFromProduct(productId: number, scentId: number): Promise<void>;
  
  // Color methods
  getColor(id: number): Promise<Color | undefined>;
  getAllColors(): Promise<Color[]>;
  getActiveColors(): Promise<Color[]>;
  createColor(color: InsertColor): Promise<Color>;
  updateColor(id: number, color: InsertColor): Promise<Color | undefined>;
  deleteColor(id: number): Promise<void>;
  getProductColors(productId: number): Promise<Color[]>;
  addColorToProduct(productId: number, colorId: number): Promise<ProductColor>;
  removeColorFromProduct(productId: number, colorId: number): Promise<void>;
  
  // Order methods
  getOrder(id: number): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  getUserOrders(userId: number): Promise<Order[]>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  getOrderItems(orderId: number): Promise<OrderItemWithProduct[]>;
  
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
  
  // Page methods
  getPage(id: number): Promise<Page | undefined>;
  getPageByType(type: string): Promise<Page | undefined>;
  getAllPages(): Promise<Page[]>;
  createPage(page: InsertPage): Promise<Page>;
  updatePage(id: number, page: Partial<InsertPage>): Promise<Page | undefined>;
  deletePage(id: number): Promise<void>;
  
  // Collection methods
  getCollection(id: number): Promise<Collection | undefined>;
  getAllCollections(): Promise<Collection[]>;
  getActiveCollections(): Promise<Collection[]>;
  getFeaturedCollections(): Promise<Collection[]>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: number, collection: Partial<InsertCollection>): Promise<Collection | undefined>;
  deleteCollection(id: number): Promise<void>;
  getCollectionProducts(collectionId: number): Promise<Product[]>;
  addProductToCollection(productId: number, collectionId: number): Promise<ProductCollection>;
  removeProductFromCollection(productId: number, collectionId: number): Promise<void>;
  
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
    
    // Inicijaliziraj pomoćne tablice pri pokretanju
    this.initializeRelationTables();
  }
  
  private async initializeRelationTables() {
    try {
      console.log("Inicijalizacija pomoćnih tablica za veze između entiteta...");
      
      // Kreiraj tablicu product_scents ako ne postoji
      await pool.query(`
        CREATE TABLE IF NOT EXISTS product_scents (
          id SERIAL PRIMARY KEY,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          scent_id INTEGER NOT NULL REFERENCES scents(id) ON DELETE CASCADE,
          UNIQUE(product_id, scent_id)
        )
      `);
      
      // Kreiraj tablicu product_colors ako ne postoji
      await pool.query(`
        CREATE TABLE IF NOT EXISTS product_colors (
          id SERIAL PRIMARY KEY,
          product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          color_id INTEGER NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
          UNIQUE(product_id, color_id)
        )
      `);
      
      console.log("Inicijalizacija pomoćnih tablica završena.");
    } catch (error) {
      console.error("Greška pri inicijalizaciji pomoćnih tablica:", error);
    }
  }
  
  // Funkcija koja provjerava postojanje tablice u bazi podataka
  private async tableExists(tableName: string): Promise<boolean> {
    try {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [tableName]);
      
      return result.rows[0].exists;
    } catch (error) {
      console.error(`Greška pri provjeri postojanja tablice ${tableName}:`, error);
      return false;
    }
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
  
  async updateCategory(id: number, categoryData: InsertCategory): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(categoryData)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }
  
  async deleteCategory(id: number): Promise<void> {
    // Prvo provjerimo ima li proizvoda povezanih s ovom kategorijom
    const relatedProducts = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.categoryId, id));
    
    // Ako ima proizvoda, prvo ih premjestimo u "Razno" ili kreirajmo tu kategoriju ako ne postoji
    if (relatedProducts[0].count > 0) {
      let miscCategoryId: number;
      
      // Pronađi ili kreiraj "Razno" kategoriju
      const [miscCategory] = await db
        .select()
        .from(categories)
        .where(eq(categories.name, "Razno"));
      
      if (miscCategory) {
        miscCategoryId = miscCategory.id;
      } else {
        const [newMiscCategory] = await db
          .insert(categories)
          .values({
            name: "Razno",
            description: "Razni proizvodi koji nisu kategorizirani"
          })
          .returning();
        miscCategoryId = newMiscCategory.id;
      }
      
      // Prebaci sve proizvode iz kategorije koja se briše u "Razno"
      await db
        .update(products)
        .set({ categoryId: miscCategoryId })
        .where(eq(products.categoryId, id));
    }
    
    // Sada možemo sigurno obrisati kategoriju
    await db.delete(categories).where(eq(categories.id, id));
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.categoryId, categoryId));
  }

  // Scent methods
  async getScent(id: number): Promise<Scent | undefined> {
    const [scent] = await db.select().from(scents).where(eq(scents.id, id));
    return scent;
  }

  async getAllScents(): Promise<Scent[]> {
    return await db.select().from(scents);
  }

  async getActiveScents(): Promise<Scent[]> {
    return await db.select().from(scents).where(eq(scents.active, true));
  }

  async createScent(scentData: InsertScent): Promise<Scent> {
    const [scent] = await db.insert(scents).values(scentData).returning();
    return scent;
  }

  async updateScent(id: number, scentData: InsertScent): Promise<Scent | undefined> {
    const [updatedScent] = await db
      .update(scents)
      .set(scentData)
      .where(eq(scents.id, id))
      .returning();
    return updatedScent;
  }

  async deleteScent(id: number): Promise<void> {
    // Prvo ukloni sve poveznice proizvoda s ovim mirisom
    await db.delete(productScents).where(eq(productScents.scentId, id));
    
    // Zatim izbriši miris
    await db.delete(scents).where(eq(scents.id, id));
  }

  async getProductScents(productId: number): Promise<Scent[]> {
    try {
      // Provjeri postoji li tablica product_scents
      const tableExists = await this.tableExists('product_scents');
      if (!tableExists) {
        console.log("Kreiranje tablice product_scents jer ne postoji...");
        await this.initializeRelationTables();
        return []; // Vrati prazno polje jer tablica upravo kreirana i nema podataka
      }
    
      // Direktno povezani upit koji dohvaća mirise povezane s proizvodom
      try {
        const result = await pool.query(
          `SELECT s.id, s.name, s.description, s.active 
           FROM product_scents ps 
           JOIN scents s ON ps.scent_id = s.id 
           WHERE ps.product_id = $1`,
          [productId]
        );
        
        return result.rows as Scent[];
      } catch (sqlError) {
        console.error("SQL Error:", sqlError);
        // Još jednom inicijaliziraj tablice u slučaju da je došlo do problema s parametrima
        await this.initializeRelationTables();
        return [];
      }
    } catch (error) {
      console.error("Error in getProductScents:", error);
      return [];
    }
  }

  async addScentToProduct(productId: number, scentId: number): Promise<ProductScent> {
    console.log(`Attempting to add scent ${scentId} to product ${productId}`);
    try {
      // Prvo provjeri postojanje tablice
      const tableExists = await this.tableExists('product_scents');
      if (!tableExists) {
        console.log("Kreiranje tablice product_scents jer ne postoji...");
        await this.initializeRelationTables();
      }
    
      // Provjeri postojeću vezu direktnim SQL upitom
      console.log("Checking for existing product-scent link...");
      const checkResult = await pool.query(
        `SELECT product_id, scent_id FROM product_scents 
         WHERE product_id = $1 AND scent_id = $2`,
        [productId, scentId]
      );
      
      if (checkResult.rows.length > 0) {
        console.log("Found existing link, returning it:", checkResult.rows[0]);
        return checkResult.rows[0] as ProductScent;
      }
      
      // Dodaj novu vezu
      console.log("Creating new product-scent link...");
      console.log("Values:", { productId, scentId });
      
      const insertResult = await pool.query(
        `INSERT INTO product_scents (product_id, scent_id) 
         VALUES ($1, $2) 
         RETURNING product_id, scent_id`,
        [productId, scentId]
      );
      
      console.log("Insert result:", insertResult);
      
      if (!insertResult.rows || insertResult.rows.length === 0) {
        throw new Error("Insert returned empty result");
      }
      
      const link = insertResult.rows[0];
      console.log("Successfully added scent to product:", link);
      
      return link as ProductScent;
    } catch (error) {
      console.error("Error in addScentToProduct:", error);
      console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
      throw new Error(`Failed to add scent to product: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async removeScentFromProduct(productId: number, scentId: number): Promise<void> {
    try {
      // Provjeri postojanje tablice
      const tableExists = await this.tableExists('product_scents');
      if (!tableExists) {
        console.log("Tablica product_scents ne postoji, ništa za ukloniti");
        return;
      }
      
      await pool.query(
        `DELETE FROM product_scents 
         WHERE product_id = $1 AND scent_id = $2`,
        [productId, scentId]
      );
    } catch (error) {
      console.error("Error in removeScentFromProduct:", error);
      throw new Error(`Failed to remove scent from product: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async removeAllScentsFromProduct(productId: number): Promise<void> {
    try {
      // Provjeri postojanje tablice
      const tableExists = await this.tableExists('product_scents');
      if (!tableExists) {
        console.log("Tablica product_scents ne postoji, ništa za ukloniti");
        return;
      }
      
      await pool.query(
        `DELETE FROM product_scents WHERE product_id = $1`,
        [productId]
      );
    } catch (error) {
      console.error("Error in removeAllScentsFromProduct:", error);
      throw new Error(`Failed to remove all scents from product: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Color methods
  async getColor(id: number): Promise<Color | undefined> {
    const [color] = await db.select().from(colors).where(eq(colors.id, id));
    return color;
  }

  async getAllColors(): Promise<Color[]> {
    return await db.select().from(colors);
  }

  async getActiveColors(): Promise<Color[]> {
    return await db.select().from(colors).where(eq(colors.active, true));
  }

  async createColor(colorData: InsertColor): Promise<Color> {
    const [color] = await db.insert(colors).values(colorData).returning();
    return color;
  }

  async updateColor(id: number, colorData: InsertColor): Promise<Color | undefined> {
    const [updatedColor] = await db
      .update(colors)
      .set(colorData)
      .where(eq(colors.id, id))
      .returning();
    return updatedColor;
  }

  async deleteColor(id: number): Promise<void> {
    // Prvo ukloni sve poveznice proizvoda s ovom bojom
    await db.delete(productColors).where(eq(productColors.colorId, id));
    
    // Zatim izbriši boju
    await db.delete(colors).where(eq(colors.id, id));
  }

  async getProductColors(productId: number): Promise<Color[]> {
    try {
      // Provjeri postoji li tablica product_colors
      const tableExists = await this.tableExists('product_colors');
      if (!tableExists) {
        console.log("Kreiranje tablice product_colors jer ne postoji...");
        await this.initializeRelationTables();
        return []; // Vrati prazno polje jer tablica upravo kreirana i nema podataka
      }
    
      // Direktno povezani upit koji dohvaća boje povezane s proizvodom
      try {
        const result = await pool.query(
          `SELECT c.id, c.name, c.hex_value as "hexValue", c.active 
           FROM product_colors pc 
           JOIN colors c ON pc.color_id = c.id 
           WHERE pc.product_id = $1`,
          [productId]
        );
        
        return result.rows as Color[];
      } catch (sqlError) {
        console.error("SQL Error:", sqlError);
        // Još jednom inicijaliziraj tablice u slučaju da je došlo do problema s parametrima
        await this.initializeRelationTables();
        return [];
      }
    } catch (error) {
      console.error("Error in getProductColors:", error);
      return [];
    }
  }

  async addColorToProduct(productId: number, colorId: number): Promise<ProductColor> {
    console.log(`Attempting to add color ${colorId} to product ${productId}`);
    try {
      // Prvo provjeri postojanje tablice
      const tableExists = await this.tableExists('product_colors');
      if (!tableExists) {
        console.log("Kreiranje tablice product_colors jer ne postoji...");
        await this.initializeRelationTables();
      }
    
      // Provjeri postojeću vezu direktnim SQL upitom
      console.log("Checking for existing product-color link...");
      const checkResult = await pool.query(
        `SELECT product_id, color_id FROM product_colors 
         WHERE product_id = $1 AND color_id = $2`,
        [productId, colorId]
      );
      
      if (checkResult.rows.length > 0) {
        console.log("Found existing link, returning it:", checkResult.rows[0]);
        return checkResult.rows[0] as ProductColor;
      }
      
      // Dodaj novu vezu
      console.log("Creating new product-color link...");
      console.log("Values:", { productId, colorId });
      
      const insertResult = await pool.query(
        `INSERT INTO product_colors (product_id, color_id) 
         VALUES ($1, $2) 
         RETURNING product_id, color_id`,
        [productId, colorId]
      );
      
      console.log("Insert result:", insertResult);
      
      if (!insertResult.rows || insertResult.rows.length === 0) {
        throw new Error("Insert returned empty result");
      }
      
      const link = insertResult.rows[0];
      console.log("Successfully added color to product:", link);
      
      return link as ProductColor;
    } catch (error) {
      console.error("Error in addColorToProduct:", error);
      console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
      throw new Error(`Failed to add color to product: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async removeColorFromProduct(productId: number, colorId: number): Promise<void> {
    try {
      // Provjeri postojanje tablice
      const tableExists = await this.tableExists('product_colors');
      if (!tableExists) {
        console.log("Tablica product_colors ne postoji, ništa za ukloniti");
        return;
      }
      
      await pool.query(
        `DELETE FROM product_colors 
         WHERE product_id = $1 AND color_id = $2`,
        [productId, colorId]
      );
    } catch (error) {
      console.error("Error in removeColorFromProduct:", error);
      throw new Error(`Failed to remove color from product: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async removeAllColorsFromProduct(productId: number): Promise<void> {
    try {
      // Provjeri postojanje tablice
      const tableExists = await this.tableExists('product_colors');
      if (!tableExists) {
        console.log("Tablica product_colors ne postoji, ništa za ukloniti");
        return;
      }
      
      await pool.query(
        `DELETE FROM product_colors WHERE product_id = $1`,
        [productId]
      );
    } catch (error) {
      console.error("Error in removeAllColorsFromProduct:", error);
      throw new Error(`Failed to remove all colors from product: ${error instanceof Error ? error.message : String(error)}`);
    }
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
    
    // Za svaku stavku košarice, dohvati pripadajući proizvod, miris i boju
    const itemsWithProducts: CartItemWithProduct[] = [];
    
    for (const item of items) {
      const [product] = await db.select().from(products).where(eq(products.id, item.productId));
      
      if (product) {
        const cartItemWithProduct: CartItemWithProduct = {
          ...item,
          product,
        };
        
        // Ako postoji ID mirisa, dohvati miris
        if (item.scentId) {
          const [scent] = await db.select().from(scents).where(eq(scents.id, item.scentId));
          if (scent) {
            cartItemWithProduct.scent = scent;
          }
        }
        
        // Ako postoji ID boje, dohvati boju
        if (item.colorId) {
          const [color] = await db.select().from(colors).where(eq(colors.id, item.colorId));
          if (color) {
            cartItemWithProduct.color = color;
          }
        }
        
        itemsWithProducts.push(cartItemWithProduct);
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
  
  // Page methods
  async getPage(id: number): Promise<Page | undefined> {
    const [page] = await db.select().from(pages).where(eq(pages.id, id));
    return page;
  }
  
  async getPageByType(type: string): Promise<Page | undefined> {
    const [page] = await db.select().from(pages).where(eq(pages.type, type));
    return page;
  }
  
  async getAllPages(): Promise<Page[]> {
    return await db.select().from(pages);
  }
  
  async createPage(pageData: InsertPage): Promise<Page> {
    const [page] = await db.insert(pages).values(pageData).returning();
    return page;
  }
  
  async updatePage(id: number, pageData: Partial<InsertPage>): Promise<Page | undefined> {
    const [updatedPage] = await db
      .update(pages)
      .set({ 
        ...pageData,
        updatedAt: new Date()
      })
      .where(eq(pages.id, id))
      .returning();
    return updatedPage;
  }
  
  async deletePage(id: number): Promise<void> {
    await db.delete(pages).where(eq(pages.id, id));
  }
}

// Use database storage instead of memory storage
export const storage = new DatabaseStorage();