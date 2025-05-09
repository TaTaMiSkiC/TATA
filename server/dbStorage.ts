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
  type Scent, type InsertScent,
  type Color, type InsertColor,
  type Page, type InsertPage,
  type ProductScent,
  type ProductColor,
  users, products, categories, orders, orderItems, cartItems, reviews, settings,
  scents, colors, pages, productScents, productColors
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc, sql, isNull } from "drizzle-orm";
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
    
    // Provjeri i inicijaliziraj potrebne tablice
    this.initializeRelationTables().catch(err => {
      console.error("Greška pri inicijalizaciji pomoćnih tablica:", err);
    });
  }
  
  private async initializeRelationTables() {
    try {
      // Provjeri postoji li tablica product_scents
      const scentTableExists = await this.tableExists('product_scents');
      if (!scentTableExists) {
        console.log("Kreiranje tablice product_scents jer ne postoji...");
        await pool.query(`
          CREATE TABLE IF NOT EXISTS product_scents (
            id SERIAL PRIMARY KEY,
            product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            scent_id INTEGER NOT NULL REFERENCES scents(id) ON DELETE CASCADE,
            UNIQUE(product_id, scent_id)
          )
        `);
      }
      
      // Provjeri postoji li tablica product_colors
      const colorTableExists = await this.tableExists('product_colors');
      if (!colorTableExists) {
        console.log("Kreiranje tablice product_colors jer ne postoji...");
        await pool.query(`
          CREATE TABLE IF NOT EXISTS product_colors (
            id SERIAL PRIMARY KEY,
            product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            color_id INTEGER NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
            UNIQUE(product_id, color_id)
          )
        `);
      }
      
      // Provjeri postoji li tablica pages
      const pagesTableExists = await this.tableExists('pages');
      if (!pagesTableExists) {
        console.log("Kreiranje tablice pages jer ne postoji...");
        await pool.query(`
          CREATE TABLE IF NOT EXISTS pages (
            id SERIAL PRIMARY KEY,
            type TEXT NOT NULL UNIQUE,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `);
      }
      
      console.log("Inicijalizacija pomoćnih tablica završena.");
    } catch (error) {
      console.error("Greška pri inicijalizaciji pomoćnih tablica:", error);
      throw error;
    }
  }
  
  private async tableExists(tableName: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      [tableName]
    );
    return result.rows[0].exists;
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
    await db.delete(scents).where(eq(scents.id, id));
  }
  
  async getProductScents(productId: number): Promise<Scent[]> {
    // Dohvati sve veze između proizvoda i mirisa
    const scentRelations = await db
      .select()
      .from(productScents)
      .where(eq(productScents.productId, productId));
      
    if (scentRelations.length === 0) {
      return [];
    }
    
    // Izvuci ID-jeve mirisa
    const scentIds = scentRelations.map(rel => rel.scentId);
    
    // Dohvati sve mirise koji su povezani s proizvodom
    return await db
      .select()
      .from(scents)
      .where(sql`${scents.id} IN (${scentIds.join(',')})`);
  }
  
  async addScentToProduct(productId: number, scentId: number): Promise<ProductScent> {
    // Provjeri postoji li već ta veza
    const [existingRelation] = await db
      .select()
      .from(productScents)
      .where(
        and(
          eq(productScents.productId, productId),
          eq(productScents.scentId, scentId)
        )
      );
      
    // Ako veza već postoji, vrati je
    if (existingRelation) {
      return existingRelation;
    }
    
    // Inače dodaj novu vezu
    const [relation] = await db
      .insert(productScents)
      .values({
        productId,
        scentId
      })
      .returning();
      
    return relation;
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
    await db.delete(colors).where(eq(colors.id, id));
  }
  
  async getProductColors(productId: number): Promise<Color[]> {
    // Dohvati sve veze između proizvoda i boja
    const colorRelations = await db
      .select()
      .from(productColors)
      .where(eq(productColors.productId, productId));
      
    if (colorRelations.length === 0) {
      return [];
    }
    
    // Izvuci ID-jeve boja
    const colorIds = colorRelations.map(rel => rel.colorId);
    
    // Dohvati sve boje koje su povezane s proizvodom
    return await db
      .select()
      .from(colors)
      .where(sql`${colors.id} IN (${colorIds.join(',')})`);
  }
  
  async addColorToProduct(productId: number, colorId: number): Promise<ProductColor> {
    // Provjeri postoji li već ta veza
    const [existingRelation] = await db
      .select()
      .from(productColors)
      .where(
        and(
          eq(productColors.productId, productId),
          eq(productColors.colorId, colorId)
        )
      );
      
    // Ako veza već postoji, vrati je
    if (existingRelation) {
      return existingRelation;
    }
    
    // Inače dodaj novu vezu
    const [relation] = await db
      .insert(productColors)
      .values({
        productId,
        colorId
      })
      .returning();
      
    return relation;
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
    console.log(`Pokušaj ažuriranja postavke "${key}" s vrijednosti "${value}"`);
    
    // First check if the setting exists
    const existingSetting = await this.getSetting(key);
    console.log(`Postojeća postavka "${key}":`, existingSetting);
    
    if (existingSetting) {
      // Update the existing setting
      try {
        console.log(`Ažuriranje postojeće postavke "${key}" s novom vrijednosti "${value}"`);
        const [updatedSetting] = await db
          .update(settings)
          .set({ 
            value,
            updatedAt: new Date()
          })
          .where(eq(settings.key, key))
          .returning();
        
        console.log(`Postavka "${key}" uspješno ažurirana:`, updatedSetting);
        return updatedSetting;
      } catch (error) {
        console.error(`Greška pri ažuriranju postavke "${key}":`, error);
        throw error;
      }
    } else {
      // Create a new setting if it doesn't exist
      try {
        console.log(`Stvaranje nove postavke "${key}" s vrijednosti "${value}" jer ne postoji`);
        const newSetting = await this.createSetting({
          key,
          value
        });
        
        console.log(`Nova postavka "${key}" uspješno kreirana:`, newSetting);
        return newSetting;
      } catch (error) {
        console.error(`Greška pri stvaranju nove postavke "${key}":`, error);
        throw error;
      }
    }
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
    try {
      // Provjeri postoji li stranica s istim tipom
      const existingPage = await this.getPageByType(pageData.type);
      
      if (existingPage) {
        // Ako postoji, ažuriraj je
        return await this.updatePage(existingPage.id, pageData) as Page;
      } else {
        // Ako ne postoji, kreiraj novu
        const [page] = await db.insert(pages).values({
          ...pageData,
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();
        return page;
      }
    } catch (error) {
      console.error("Greška pri kreiranju stranice:", error);
      throw new Error("Failed to create page");
    }
  }
  
  async updatePage(id: number, pageData: Partial<InsertPage>): Promise<Page | undefined> {
    try {
      const [updatedPage] = await db
        .update(pages)
        .set({ 
          ...pageData,
          updatedAt: new Date()
        })
        .where(eq(pages.id, id))
        .returning();
      return updatedPage;
    } catch (error) {
      console.error("Greška pri ažuriranju stranice:", error);
      throw new Error("Failed to update page");
    }
  }
  
  async deletePage(id: number): Promise<void> {
    await db.delete(pages).where(eq(pages.id, id));
  }

  // ----- Kolekcije -----
  
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
    return await db.select().from(collections).where(and(
      eq(collections.active, true),
      eq(collections.featuredOnHome, true)
    ));
  }
  
  async createCollection(collectionData: InsertCollection): Promise<Collection> {
    const [collection] = await db
      .insert(collections)
      .values(collectionData)
      .returning();
    return collection;
  }
  
  async updateCollection(id: number, collectionData: Partial<InsertCollection>): Promise<Collection | undefined> {
    try {
      const [updatedCollection] = await db
        .update(collections)
        .set({
          ...collectionData,
          updatedAt: new Date()
        })
        .where(eq(collections.id, id))
        .returning();
      return updatedCollection;
    } catch (error) {
      console.error("Greška pri ažuriranju kolekcije:", error);
      throw new Error("Failed to update collection");
    }
  }
  
  async deleteCollection(id: number): Promise<void> {
    // Prvo obrišimo sve veze između proizvoda i ove kolekcije
    await db.delete(productCollections).where(eq(productCollections.collectionId, id));
    // Zatim obrišemo kolekciju
    await db.delete(collections).where(eq(collections.id, id));
  }
  
  async getCollectionProducts(collectionId: number): Promise<Product[]> {
    const result = await db
      .select({
        product: products
      })
      .from(productCollections)
      .innerJoin(products, eq(productCollections.productId, products.id))
      .where(eq(productCollections.collectionId, collectionId));
    
    return result.map(r => r.product);
  }
  
  async addProductToCollection(productId: number, collectionId: number): Promise<ProductCollection> {
    const [relation] = await db
      .insert(productCollections)
      .values({
        productId,
        collectionId
      })
      .returning();
    
    return relation;
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
}