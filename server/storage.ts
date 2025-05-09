import { 
  type User, type InsertUser, 
  type Product, type InsertProduct,
  type Category, type InsertCategory,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type CartItem, type InsertCartItem,
  type Review, type InsertReview,
  type CartItemWithProduct 
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
      checkPeriod: 86400000 // Cleanup expired sessions every 24h
    });
    
    // Initialize with default categories
    this.initializeCategories();
    // Initialize with default products
    this.initializeProducts();
    // Create admin user
    this.createDefaultAdmin();
  }

  private async initializeCategories() {
    const categories: InsertCategory[] = [
      {
        name: "Mirisne svijeće",
        description: "Kolekcija svijeća s različitim mirisima za svačiji ukus",
        imageUrl: "https://pixabay.com/get/g587eb3a6035bfd2bc57d4a52a423abc54a3d0ebda48358d07653bede8b3a8933f1df7490914cc424bc0edd46f2d5ac9f5a9c5841cf80538908db50ff2954a366_1280.jpg"
      },
      {
        name: "Dekorativne svijeće",
        description: "Estetski prelijepe svijeće koje će uljepšati svaki prostor",
        imageUrl: "https://pixabay.com/get/g05ba218c081f133c63964685b254dea972729bdc99177550d9452e3799daf72163b7822c85e24c53bcd74df41256262b596e4242b6354330625a4f4f344b3168_1280.jpg"
      },
      {
        name: "Personalizirane svijeće",
        description: "Jedinstvene svijeće izrađene prema vašim željama",
        imageUrl: "https://pixabay.com/get/g6f770fd0f4ff3ac2d6fd1f3320be454b4e8297c06b9886cb33a2fbce7d3c9bbcd77b3d4594a4a13cfb3d966382aaa2a98d2ca4b238ea4587d2ed8c1b5eabe580_1280.jpg"
      }
    ];
    
    for (const category of categories) {
      await this.createCategory(category);
    }
  }

  private async initializeProducts() {
    const products: InsertProduct[] = [
      {
        name: "Vanilla Dreams",
        description: "Bogata i kremasta mirisna svijeća s notama vanilije i kokosa.",
        price: "22.99",
        imageUrl: "https://pixabay.com/get/g9a31246a47512f649568c46250a310a57c672d2689f1318455396a6cea00785f9302c8006d0b85aabd1218542d9770cbde095df56dd04dfeabdb7a5e73472b0d_1280.jpg",
        categoryId: 1,
        stock: 25,
        scent: "Vanilija",
        color: "Krem",
        burnTime: "40-45 sati",
        featured: true
      },
      {
        name: "Eucalyptus & Mint",
        description: "Osvježavajuća kombinacija eukaliptusa i mente za energiju i fokus.",
        price: "24.99",
        imageUrl: "https://pixabay.com/get/g00c3b4940a66462eed4734cf9391b3280a0a386f28584bb64784034edbd806d0fc16e571fbabbd3ac887efabf83d57144e9535f657134869771e1caab28804b3_1280.jpg",
        categoryId: 1,
        stock: 18,
        scent: "Eukaliptus, Menta",
        color: "Zelena",
        burnTime: "35-40 sati",
        featured: true
      },
      {
        name: "Amber Santal",
        description: "Topla i bogata mirisna svijeća s notama jantara i sandalovine.",
        price: "27.99",
        imageUrl: "https://pixabay.com/get/g2d202c4433f87d05be26298af6e3cae5d23f5f28d50ec419c50985f2bb767760da89816897d96d0650ddfdf62fe41cee5072676d99629fb401cc2e0e404b5dd9_1280.jpg",
        categoryId: 1,
        stock: 15,
        scent: "Jantar, Sandalovina",
        color: "Smeđa",
        burnTime: "50-55 sati",
        featured: true
      },
      {
        name: "Lavender Dreams",
        description: "Umirujući miris lavande za opuštanje i bolji san.",
        price: "21.99",
        imageUrl: "https://pixabay.com/get/g10e80bb38f5ba785a3231906c95d8030a0e28336f024e1ee285b620b029398987ea72b9418afd96eea5d66b9b5fb611132a17c1590eca0738aacacbf667de8c1_1280.jpg",
        categoryId: 1,
        stock: 22,
        scent: "Lavanda, Kamilica",
        color: "Ljubičasta",
        burnTime: "30-35 sati",
        featured: true
      },
      {
        name: "Cinnamon Apple",
        description: "Topli jesenski miris cimeta i jabuke za ugodan dom.",
        price: "23.99",
        imageUrl: "https://pixabay.com/get/g2bb5d0912f669cb70bc8c4a17328d91713be87139ca8ad8c17e4e801812960dc0a42f4af9df1642ca6d7c2cead233c9251419ff5a44efcb5abe7c23a910a73f4_1280.jpg",
        categoryId: 1,
        stock: 20,
        scent: "Cimet, Jabuka",
        color: "Crvena",
        burnTime: "40-45 sati",
        featured: false
      },
      {
        name: "Ocean Breeze",
        description: "Osvježavajući miris oceana i morske soli.",
        price: "25.99",
        imageUrl: "https://pixabay.com/get/g9f4d99421f497a9b063647f989ef7776472dda849bc1deac936ac4f570f5c6aa80a21190479f9b724cc7f4ad199737e3143a8bb4b218bda9b15a9d8219cf7f37_1280.jpg",
        categoryId: 1,
        stock: 18,
        scent: "Ocean, Morska sol",
        color: "Plava",
        burnTime: "35-40 sati",
        featured: false
      }
    ];
    
    for (const product of products) {
      await this.createProduct(product);
    }
  }

  private async createDefaultAdmin() {
    try {
      // Importiramo funkciju za hashiranje lozinke
      const { hashPassword } = await import('./auth');
      
      // Hashiramo password direktno s funkcijom
      const hashedPassword = await hashPassword("admin123");
      
      await this.createUser({
        username: "admin",
        password: hashedPassword, 
        email: "admin@kerzenwelt.hr",
        isAdmin: true
      });
      console.log("Admin korisnik uspješno kreiran");
    } catch (error) {
      console.error("Failed to create admin user:", error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    // Ensure all required fields have proper values
    const user: User = { 
      ...userData, 
      id, 
      createdAt,
      address: userData.address || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      city: userData.city || null,
      postalCode: userData.postalCode || null,
      country: userData.country || null,
      phone: userData.phone || null,
      isAdmin: userData.isAdmin ?? false
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      return undefined;
    }
    
    const updatedUser: User = {
      ...existingUser,
      ...userData,
      // Ne dopusti promjenu ovih polja
      id: existingUser.id,
      createdAt: existingUser.createdAt,
      // Zadrži isAdmin status osim ako se eksplicitno mijenja
      isAdmin: userData.isAdmin !== undefined ? userData.isAdmin : existingUser.isAdmin
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.featured
    );
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const createdAt = new Date();
    const product: Product = { 
      ...productData, 
      id, 
      createdAt,
      imageUrl: productData.imageUrl || null,
      categoryId: productData.categoryId || null,
      stock: productData.stock ?? 0,
      scent: productData.scent || null,
      color: productData.color || null,
      burnTime: productData.burnTime || null,
      featured: productData.featured ?? false
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, productData: InsertProduct): Promise<Product | undefined> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) {
      return undefined;
    }
    
    const updatedProduct: Product = {
      ...existingProduct,
      ...productData,
    };
    
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    this.products.delete(id);
  }
  
  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const category: Category = { 
      ...categoryData, 
      id,
      description: categoryData.description || null, 
      imageUrl: categoryData.imageUrl || null
    };
    this.categories.set(id, category);
    return category;
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.categoryId === categoryId
    );
  }
  
  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.userId === userId
    );
  }

  async createOrder(orderData: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const id = this.orderIdCounter++;
    const createdAt = new Date();
    
    // Ensure all required fields have proper values
    const order: Order = { 
      ...orderData, 
      id, 
      createdAt,
      status: orderData.status || "pending",
      paymentStatus: orderData.paymentStatus || "pending",
      shippingAddress: orderData.shippingAddress || null,
      shippingCity: orderData.shippingCity || null,
      shippingPostalCode: orderData.shippingPostalCode || null,
      shippingCountry: orderData.shippingCountry || null
    };
    
    this.orders.set(id, order);
    
    // Create order items
    for (const item of items) {
      const orderItemId = this.orderItemIdCounter++;
      const orderItem: OrderItem = { ...item, id: orderItemId, orderId: id };
      this.orderItems.set(orderItemId, orderItem);
      
      // Update product stock
      const product = this.products.get(item.productId);
      if (product) {
        const updatedProduct = {
          ...product,
          stock: product.stock - item.quantity
        };
        this.products.set(product.id, updatedProduct);
      }
    }
    
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const existingOrder = this.orders.get(id);
    if (!existingOrder) {
      return undefined;
    }
    
    const updatedOrder: Order = {
      ...existingOrder,
      status,
    };
    
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      (item) => item.orderId === orderId
    );
  }
  
  // Cart methods
  async getCartItems(userId: number): Promise<CartItemWithProduct[]> {
    const cartItems = Array.from(this.cartItems.values()).filter(
      (item) => item.userId === userId
    );
    
    return Promise.all(
      cartItems.map(async (item) => {
        const product = await this.getProduct(item.productId);
        return {
          ...item,
          product: product!
        };
      })
    );
  }

  async addToCart(itemData: InsertCartItem): Promise<CartItem> {
    // Check if the product is already in the cart
    const existingItem = Array.from(this.cartItems.values()).find(
      (item) => item.userId === itemData.userId && item.productId === itemData.productId
    );
    
    if (existingItem) {
      // Update quantity instead of adding a new item
      return this.updateCartItem(existingItem.id, existingItem.quantity + itemData.quantity, itemData.userId) as Promise<CartItem>;
    }
    
    const id = this.cartItemIdCounter++;
    const cartItem: CartItem = { ...itemData, id };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }

  async updateCartItem(id: number, quantity: number, userId: number): Promise<CartItem | undefined> {
    const existingItem = this.cartItems.get(id);
    if (!existingItem || existingItem.userId !== userId) {
      return undefined;
    }
    
    const updatedItem: CartItem = {
      ...existingItem,
      quantity,
    };
    
    this.cartItems.set(id, updatedItem);
    return updatedItem;
  }

  async removeFromCart(id: number, userId: number): Promise<void> {
    const item = this.cartItems.get(id);
    if (item && item.userId === userId) {
      this.cartItems.delete(id);
    }
  }

  async clearCart(userId: number): Promise<void> {
    const cartItemIds = Array.from(this.cartItems.entries())
      .filter(([_, item]) => item.userId === userId)
      .map(([id]) => id);
    
    for (const id of cartItemIds) {
      this.cartItems.delete(id);
    }
  }
  
  // Review methods
  async getProductReviews(productId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(
      (review) => review.productId === productId
    );
  }

  async createReview(reviewData: InsertReview): Promise<Review> {
    const id = this.reviewIdCounter++;
    const createdAt = new Date();
    
    // Osiguraj da comment bude string ili null, nikad undefined
    const review: Review = { 
      ...reviewData, 
      id, 
      createdAt,
      comment: reviewData.comment || null
    };
    
    this.reviews.set(id, review);
    return review;
  }
}

import { db, pool } from "./db";
import { eq, and, desc } from "drizzle-orm";
import connectPg from "connect-pg-simple";

const PgSession = connectPg(session);

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
}

// Use database storage instead of memory storage
export const storage = new DatabaseStorage();
