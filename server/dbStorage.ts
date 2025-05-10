import { eq, and, desc, isNull, sql } from "drizzle-orm";
import { db } from "./db";
import { 
  users, 
  products, 
  categories, 
  orders, 
  orderItems, 
  cartItems, 
  reviews,
  scents,
  colors,
  productScents,
  productColors,
  collections,
  productCollections,
  pages,
  settings
} from "@shared/schema";

import type { 
  User, 
  InsertUser, 
  Product, 
  InsertProduct, 
  Category, 
  InsertCategory,
  Order,
  InsertOrder,
  OrderItem,
  InsertOrderItem,
  CartItem,
  InsertCartItem,
  Review,
  InsertReview,
  Scent,
  InsertScent,
  Color,
  InsertColor,
  ProductScent,
  InsertProductScent,
  ProductColor,
  InsertProductColor,
  Collection,
  InsertCollection,
  ProductCollection,
  InsertProductCollection,
  Page,
  InsertPage,
  Setting,
  InsertSetting
} from "@shared/schema";

import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";
import { IStorage } from "./storage";

// Prošireni tipovi
interface CartItemWithProduct extends CartItem {
  product: Product;
  scent?: Scent;
  color?: Color;
}

interface OrderItemWithProduct extends OrderItem {
  product: Product;
  selectedScent?: string;
  selectedColor?: string;
}

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true
    });
    this.initializeRelationTables();
  }
  
  private async initializeRelationTables() {
    try {
      console.log("Inicijalizacija pomoćnih tablica za veze između entiteta...");
      
      // Provjeri i kreiraj tablicu product_scents ako ne postoji
      const productScentsExists = await this.tableExists('product_scents');
      if (!productScentsExists) {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS "product_scents" (
            "id" SERIAL PRIMARY KEY,
            "product_id" INTEGER NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
            "scent_id" INTEGER NOT NULL REFERENCES "scents"("id") ON DELETE CASCADE,
            UNIQUE("product_id", "scent_id")
          );
        `);
      }
      
      // Provjeri i kreiraj tablicu product_colors ako ne postoji
      const productColorsExists = await this.tableExists('product_colors');
      if (!productColorsExists) {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS "product_colors" (
            "id" SERIAL PRIMARY KEY,
            "product_id" INTEGER NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
            "color_id" INTEGER NOT NULL REFERENCES "colors"("id") ON DELETE CASCADE,
            UNIQUE("product_id", "color_id")
          );
        `);
      }
      
      // Provjeri i kreiraj tablicu product_collections ako ne postoji
      const productCollectionsExists = await this.tableExists('product_collections');
      if (!productCollectionsExists) {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS "product_collections" (
            "id" SERIAL PRIMARY KEY,
            "product_id" INTEGER NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
            "collection_id" INTEGER NOT NULL REFERENCES "collections"("id") ON DELETE CASCADE,
            UNIQUE("product_id", "collection_id")
          );
        `);
      }
      
      console.log("Inicijalizacija pomoćnih tablica završena.");
    } catch (error) {
      console.error(`Greška prilikom inicijalizacije pomoćnih tablica: ${error}`);
      throw error;
    }
  }
  
  private async tableExists(tableName: string): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename = ${tableName}
        );
      `);
      return result.rows[0].exists;
    } catch (error) {
      console.error(`Greška prilikom provjere postojanja tablice ${tableName}: ${error}`);
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
    await db.delete(categories).where(eq(categories.id, id));
  }
  
  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.categoryId, categoryId));
  }
  
  // Scent (miris) methods
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
    await db.delete(scents).where(eq(scents.id, id));
  }
  
  async getProductScents(productId: number): Promise<Scent[]> {
    // JOIN preko productScents tabele
    const joinedScents = await db.query.productScents.findMany({
      where: eq(productScents.productId, productId),
      with: {
        scent: true
      }
    });
    
    // Izvuci samo scent objekte iz rezultata
    return joinedScents.map(item => item.scent);
  }
  
  async addScentToProduct(productId: number, scentId: number): Promise<ProductScent> {
    const [productScent] = await db
      .insert(productScents)
      .values({ productId, scentId })
      .returning();
    return productScent;
  }
  
  async removeScentFromProduct(productId: number, scentId: number): Promise<void> {
    await db
      .delete(productScents)
      .where(
        and(
          eq(productScents.productId, productId),
          eq(productScents.scentId, scentId)
        )
      );
  }
  
  // Color (boja) methods
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
    await db.delete(colors).where(eq(colors.id, id));
  }
  
  async getProductColors(productId: number): Promise<Color[]> {
    // JOIN preko productColors tabele
    const joinedColors = await db.query.productColors.findMany({
      where: eq(productColors.productId, productId),
      with: {
        color: true
      }
    });
    
    // Izvuci samo color objekte iz rezultata
    return joinedColors.map(item => item.color);
  }
  
  async addColorToProduct(productId: number, colorId: number): Promise<ProductColor> {
    const [productColor] = await db
      .insert(productColors)
      .values({ productId, colorId })
      .returning();
    return productColor;
  }
  
  async removeColorFromProduct(productId: number, colorId: number): Promise<void> {
    await db
      .delete(productColors)
      .where(
        and(
          eq(productColors.productId, productId),
          eq(productColors.colorId, colorId)
        )
      );
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

  async getOrderItems(orderId: number): Promise<OrderItemWithProduct[]> {
    try {
      // Koristi Drizzle's relations API za dohvaćanje stavki s proizvodima
      const items = await db.query.orderItems.findMany({
        where: eq(orderItems.orderId, orderId),
        with: {
          product: true
        }
      });
      
      console.log("Dohvaćene stavke s proizvodima:", JSON.stringify(items));
      
      // Mapiramo rezultate u OrderItemWithProduct format
      const result = items.map(item => {
        return {
          ...item,
          product: item.product || {
            id: item.productId,
            name: item.productName || `Proizvod #${item.productId}`,
            description: "",
            price: "0",
            categoryId: 0,
            imageUrl: null,
            featured: false,
            inventory: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          selectedScent: item.scentName,
          selectedColor: item.colorName
        };
      });
      
      console.log("Konačni rezultat:", JSON.stringify(result[0]));
      
      return result;
    } catch (error) {
      console.error(`Greška prilikom dohvaćanja stavki narudžbe: ${error}`);
      return [];
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

    // Dohvati scent i color informacije za svaki item ako postoje
    const cartItemsWithScentColor = await Promise.all(
      result.map(async (item) => {
        let scent = undefined;
        let color = undefined;
        
        if (item.scentId) {
          const [scentData] = await db
            .select()
            .from(scents)
            .where(eq(scents.id, item.scentId));
          scent = scentData;
        }
        
        if (item.colorId) {
          const [colorData] = await db
            .select()
            .from(colors)
            .where(eq(colors.id, item.colorId));
          color = colorData;
        }
        
        return {
          ...item,
          product: item.product,
          scent,
          color
        };
      })
    );

    return cartItemsWithScentColor;
  }

  async addToCart(itemData: InsertCartItem): Promise<CartItem> {
    // Provjeri postoji li već isti proizvod s istim mirisom i bojom u košarici
    let query = and(
      eq(cartItems.userId, itemData.userId),
      eq(cartItems.productId, itemData.productId)
    );
    
    // Dodaj uvjete za miris i boju ako postoje
    if (itemData.scentId) {
      query = and(query, eq(cartItems.scentId, itemData.scentId));
    } else {
      query = and(query, isNull(cartItems.scentId));
    }
    
    if (itemData.colorId) {
      query = and(query, eq(cartItems.colorId, itemData.colorId));
    } else {
      query = and(query, isNull(cartItems.colorId));
    }
    
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(query);

    if (existingItem) {
      // Ažuriraj količinu ako isti proizvod s istim mirisom i bojom već postoji
      const [updatedItem] = await db
        .update(cartItems)
        .set({
          quantity: existingItem.quantity + itemData.quantity,
        })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Dodaj novi artikl
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
    const [updatedSetting] = await db
      .update(settings)
      .set({ value })
      .where(eq(settings.key, key))
      .returning();
    return updatedSetting;
  }
  
  async deleteSetting(key: string): Promise<void> {
    await db.delete(settings).where(eq(settings.key, key));
  }
  
  // Stranice (Pages) methods
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
      .set(pageData)
      .where(eq(pages.id, id))
      .returning();
    return updatedPage;
  }
  
  async deletePage(id: number): Promise<void> {
    await db.delete(pages).where(eq(pages.id, id));
  }
  
  // Collection methods
  async getCollection(id: number): Promise<Collection | undefined> {
    const [collection] = await db.select().from(collections).where(eq(collections.id, id));
    return collection;
  }
  
  async getAllCollections(): Promise<Collection[]> {
    return await db.select().from(collections);
  }
  
  async getActiveCollections(): Promise<Collection[]> {
    return await db.select().from(collections).where(eq(collections.active, true));
  }
  
  async getFeaturedCollections(): Promise<Collection[]> {
    return await db.select().from(collections).where(eq(collections.featured, true));
  }
  
  async createCollection(collectionData: InsertCollection): Promise<Collection> {
    const [collection] = await db.insert(collections).values(collectionData).returning();
    return collection;
  }
  
  async updateCollection(id: number, collectionData: Partial<InsertCollection>): Promise<Collection | undefined> {
    const [updatedCollection] = await db
      .update(collections)
      .set(collectionData)
      .where(eq(collections.id, id))
      .returning();
    return updatedCollection;
  }
  
  async deleteCollection(id: number): Promise<void> {
    await db.delete(collections).where(eq(collections.id, id));
  }
  
  async getCollectionProducts(collectionId: number): Promise<Product[]> {
    // JOIN preko productCollections tabele
    const joinedProducts = await db.query.productCollections.findMany({
      where: eq(productCollections.collectionId, collectionId),
      with: {
        product: true
      }
    });
    
    // Izvuci samo product objekte iz rezultata
    return joinedProducts.map(item => item.product);
  }
  
  async addProductToCollection(productId: number, collectionId: number): Promise<ProductCollection> {
    const [productCollection] = await db
      .insert(productCollections)
      .values({ productId, collectionId })
      .returning();
    return productCollection;
  }
  
  async removeProductFromCollection(productId: number, collectionId: number): Promise<void> {
    await db
      .delete(productCollections)
      .where(
        and(
          eq(productCollections.productId, productId),
          eq(productCollections.collectionId, collectionId)
        )
      );
  }
  
  // Invoice methods
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber));
    return invoice;
  }

  async getAllInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async getUserInvoices(userId: number): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt));
  }

  async createInvoice(invoiceData: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice> {
    // Create the invoice
    const [invoice] = await db.insert(invoices).values(invoiceData).returning();
    
    // Create the invoice items with the invoice ID
    if (items.length > 0) {
      await db.insert(invoiceItems).values(
        items.map((item) => ({
          ...item,
          invoiceId: invoice.id,
        }))
      );
    }
    
    return invoice;
  }

  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId));
    
    return items;
  }

  async deleteInvoice(id: number): Promise<void> {
    // First delete all invoice items
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    
    // Then delete the invoice
    await db.delete(invoices).where(eq(invoices.id, id));
  }
}