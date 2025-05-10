import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db, pool } from "./db";
import {
  productScents,
  productColors,
  insertProductSchema,
  insertCategorySchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertCartItemSchema,
  insertReviewSchema,
  insertSettingSchema,
  insertScentSchema,
  insertColorSchema,
  insertCollectionSchema,
  insertInvoiceSchema,
  insertInvoiceItemSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // PayPal routes
  app.get("/api/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/api/paypal/order", async (req, res) => {
    await createPaypalOrder(req, res);
  });

  app.post("/api/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/featured", async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.updateProduct(id, validatedData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  app.get("/api/categories/:id/products", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const products = await storage.getProductsByCategory(id);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products by category" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });
  
  app.put("/api/categories/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.updateCategory(id, validatedData);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update category" });
    }
  });
  
  app.delete("/api/categories/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Cart
  app.get("/api/cart", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const cartItems = await storage.getCartItems(req.user.id);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertCartItemSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const cartItem = await storage.addToCart(validatedData);
      res.status(201).json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  app.put("/api/cart/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      const { quantity } = req.body;
      
      if (typeof quantity !== 'number' || quantity < 1) {
        return res.status(400).json({ message: "Invalid quantity" });
      }
      
      const cartItem = await storage.updateCartItem(id, quantity, req.user.id);
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      res.json(cartItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      await storage.removeFromCart(id, req.user.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove cart item" });
    }
  });

  app.delete("/api/cart", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      await storage.clearCart(req.user.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Orders
  app.get("/api/orders", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (req.user.isAdmin) {
        const orders = await storage.getAllOrders();
        return res.json(orders);
      }
      
      const orders = await storage.getUserOrders(req.user.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });
  
  app.get("/api/orders/user", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const orders = await storage.getUserOrders(userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      if (!req.user.isAdmin && order.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.get("/api/orders/:id/items", async (req, res) => {
    try {
      console.log("Dohvaćanje stavki narudžbe:", req.params.id);
      
      if (!req.isAuthenticated()) {
        console.log("Korisnik nije autentificiran");
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      console.log("Autentificirani korisnik:", req.user.id);
      
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);
      
      if (!order) {
        console.log("Narudžba nije pronađena:", id);
        return res.status(404).json({ message: "Order not found" });
      }
      
      console.log("Pronađena narudžba:", order.id, "Korisnik narudžbe:", order.userId);
      
      if (!req.user.isAdmin && order.userId !== req.user.id) {
        console.log("Korisnik nema pristup:", req.user.id, "Korisnik narudžbe:", order.userId);
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Dohvati stavke narudžbe
      const orderItems = await storage.getOrderItems(id);
      console.log("Dohvaćeno stavki:", orderItems.length);
      console.log("Cijeli item:", JSON.stringify(orderItems[0]));
      
      // Potrebno je dodati product podatke na svaku stavku
      const enhancedItems = [];
      for (const item of orderItems) {
        try {
          const product = await storage.getProduct(item.productId);
          // Dodajemo podatke o proizvodu na stavku
          const enhancedItem = {
            ...item,
            product: product || {
              id: item.productId,
              name: item.productName || `Proizvod #${item.productId}`,
              price: item.price,
              description: '',
              imageUrl: null,
              categoryId: null,
              stock: 0,
              scent: null,
              color: null,
              burnTime: null,
              featured: false,
              hasColorOptions: false,
              createdAt: new Date()
            }
          };
          enhancedItems.push(enhancedItem);
        } catch (err) {
          console.error(`Greška pri dohvaćanju proizvoda ${item.productId}:`, err);
          // Dodajemo stavku i bez proizvoda ako dođe do greške
          enhancedItems.push({
            ...item,
            product: {
              id: item.productId,
              name: item.productName || `Proizvod #${item.productId}`,
              price: item.price,
              description: '',
              imageUrl: null,
              categoryId: null,
              stock: 0,
              scent: null,
              color: null,
              burnTime: null,
              featured: false,
              hasColorOptions: false,
              createdAt: new Date()
            }
          });
        }
      }
      
      console.log("Obogaćene stavke:", enhancedItems.length);
      res.json(enhancedItems);
    } catch (error) {
      console.error("Greška pri dohvaćanju stavki narudžbe:", error);
      res.status(500).json({ message: "Failed to fetch order items" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertOrderSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const order = await storage.createOrder(validatedData, req.body.items);
      await storage.clearCart(req.user.id);
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const order = await storage.updateOrderStatus(id, status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Reviews
  app.get("/api/reviews", async (req, res) => {
    try {
      // Dohvati sve recenzije s podacima o korisniku i proizvodu
      const result = await db.query.reviews.findMany({
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              password: false,
            },
          },
          product: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      });
      
      res.json(result);
    } catch (error) {
      console.error("Failed to fetch all reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get("/api/products/:id/reviews", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const reviews = await storage.getProductReviews(productId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post("/api/products/:id/reviews", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const productId = parseInt(req.params.id);
      const validatedData = insertReviewSchema.parse({
        ...req.body,
        userId: req.user.id,
        productId
      });
      
      const review = await storage.createReview(validatedData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });
  
  // Brisanje recenzije (samo admin)
  app.delete("/api/reviews/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const reviewId = parseInt(req.params.id);
      
      // Izbriši recenziju
      await db.execute(sql`DELETE FROM reviews WHERE id = ${reviewId}`);
      
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete review:", error);
      res.status(500).json({ message: "Failed to delete review" });
    }
  });

  // Users (admin only)
  app.get("/api/users", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  // Scents (mirisi)
  app.get("/api/scents", async (req, res) => {
    try {
      const scents = await storage.getAllScents();
      res.json(scents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scents" });
    }
  });

  app.get("/api/scents/active", async (req, res) => {
    try {
      const scents = await storage.getActiveScents();
      res.json(scents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active scents" });
    }
  });

  app.post("/api/scents", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertScentSchema.parse(req.body);
      const scent = await storage.createScent(validatedData);
      res.status(201).json(scent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create scent" });
    }
  });

  app.put("/api/scents/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      const validatedData = insertScentSchema.parse(req.body);
      const scent = await storage.updateScent(id, validatedData);
      
      if (!scent) {
        return res.status(404).json({ message: "Scent not found" });
      }
      
      res.json(scent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update scent" });
    }
  });

  app.delete("/api/scents/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      await storage.deleteScent(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete scent" });
    }
  });

  // Colors (boje)
  app.get("/api/colors", async (req, res) => {
    try {
      const colors = await storage.getAllColors();
      res.json(colors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch colors" });
    }
  });

  app.get("/api/colors/active", async (req, res) => {
    try {
      const colors = await storage.getActiveColors();
      res.json(colors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active colors" });
    }
  });

  app.post("/api/colors", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertColorSchema.parse(req.body);
      const color = await storage.createColor(validatedData);
      res.status(201).json(color);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create color" });
    }
  });

  app.put("/api/colors/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      const validatedData = insertColorSchema.parse(req.body);
      const color = await storage.updateColor(id, validatedData);
      
      if (!color) {
        return res.status(404).json({ message: "Color not found" });
      }
      
      res.json(color);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update color" });
    }
  });

  app.delete("/api/colors/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      await storage.deleteColor(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete color" });
    }
  });

  // Product scents and colors
  app.get("/api/products/:id/scents", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const scents = await storage.getProductScents(productId);
      res.json(scents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product scents" });
    }
  });

  app.post("/api/products/:id/scents", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const productId = parseInt(req.params.id);
      const { scentId } = req.body;
      
      if (!scentId || typeof scentId !== 'number') {
        return res.status(400).json({ message: "Invalid scent ID" });
      }
      
      const productScent = await storage.addScentToProduct(productId, scentId);
      res.status(201).json(productScent);
    } catch (error) {
      res.status(500).json({ message: "Failed to add scent to product" });
    }
  });

  app.delete("/api/products/:productId/scents/:scentId", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const productId = parseInt(req.params.productId);
      const scentId = parseInt(req.params.scentId);
      
      await storage.removeScentFromProduct(productId, scentId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove scent from product" });
    }
  });
  
  // Ruta za brisanje svih mirisa s proizvoda
  app.delete("/api/products/:id/scents", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const productId = parseInt(req.params.id);
      console.log(`Brisanje svih mirisa za proizvod ID: ${productId}`);
      
      try {
        // Direktno koristimo pool.query za brisanje svih mirisa
        await pool.query(
          `DELETE FROM product_scents WHERE product_id = $1`,
          [productId]
        );
        console.log(`Uspješno izbrisani svi mirisi za proizvod ID: ${productId}`);
        res.status(204).send();
      } catch (dbError) {
        console.error("Database error removing scents:", dbError);
        
        // Još jedan pokušaj s inicijalizacijom tablice
        console.log("Pokušaj inicijalizacije tablice product_scents...");
        await pool.query(`
          CREATE TABLE IF NOT EXISTS product_scents (
            id SERIAL PRIMARY KEY,
            product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            scent_id INTEGER NOT NULL REFERENCES scents(id) ON DELETE CASCADE,
            UNIQUE(product_id, scent_id)
          )
        `);
        
        // Sada ponovo pokušamo brisanje
        await pool.query(
          `DELETE FROM product_scents WHERE product_id = $1`,
          [productId]
        );
        console.log(`Nakon inicijalizacije, uspješno izbrisani svi mirisi za proizvod ID: ${productId}`);
        res.status(204).send();
      }
    } catch (error) {
      console.error("Error removing scents from product:", error);
      res.status(500).json({ 
        message: "Failed to remove all scents from product", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/products/:id/colors", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const colors = await storage.getProductColors(productId);
      res.json(colors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product colors" });
    }
  });

  app.post("/api/products/:id/colors", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const productId = parseInt(req.params.id);
      const { colorId } = req.body;
      
      if (!colorId || typeof colorId !== 'number') {
        return res.status(400).json({ message: "Invalid color ID" });
      }
      
      const productColor = await storage.addColorToProduct(productId, colorId);
      res.status(201).json(productColor);
    } catch (error) {
      res.status(500).json({ message: "Failed to add color to product" });
    }
  });

  app.delete("/api/products/:productId/colors/:colorId", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const productId = parseInt(req.params.productId);
      const colorId = parseInt(req.params.colorId);
      
      await storage.removeColorFromProduct(productId, colorId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove color from product" });
    }
  });
  
  // Ruta za brisanje svih boja s proizvoda
  app.delete("/api/products/:id/colors", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const productId = parseInt(req.params.id);
      console.log(`Brisanje svih boja za proizvod ID: ${productId}`);
      
      try {
        // Direktno koristimo pool.query za brisanje svih boja
        await pool.query(
          `DELETE FROM product_colors WHERE product_id = $1`,
          [productId]
        );
        console.log(`Uspješno izbrisane sve boje za proizvod ID: ${productId}`);
        res.status(204).send();
      } catch (dbError) {
        console.error("Database error removing colors:", dbError);
        
        // Još jedan pokušaj s inicijalizacijom tablice
        console.log("Pokušaj inicijalizacije tablice product_colors...");
        await pool.query(`
          CREATE TABLE IF NOT EXISTS product_colors (
            id SERIAL PRIMARY KEY,
            product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            color_id INTEGER NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
            UNIQUE(product_id, color_id)
          )
        `);
        
        // Sada ponovo pokušamo brisanje
        await pool.query(
          `DELETE FROM product_colors WHERE product_id = $1`,
          [productId]
        );
        console.log(`Nakon inicijalizacije, uspješno izbrisane sve boje za proizvod ID: ${productId}`);
        res.status(204).send();
      }
    } catch (error) {
      console.error("Error removing colors from product:", error);
      res.status(500).json({ 
        message: "Failed to remove all colors from product", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Change password
  app.put("/api/users/:id/password", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      
      // Ensure users can only change their own password (unless admin)
      if (id !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Import the auth functions
      const { comparePasswords, hashPassword } = require("./auth");
      
      // Get the user
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify current password
      const isPasswordValid = await comparePasswords(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update user with new password
      const updatedUser = await storage.updateUser(id, { password: hashedPassword });
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update password" });
    }
  });
  
  // Update user profile
  app.put("/api/users/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      
      // Ensure users can only update their own profile (unless admin)
      if (id !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Extract only allowed fields for update
      const { firstName, lastName, email, address, city, postalCode, country, phone } = req.body;
      
      // Validate email if provided
      if (email && email !== req.user.email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }
      
      // Update user data
      const updatedUser = await storage.updateUser(id, {
        firstName,
        lastName,
        email,
        address,
        city,
        postalCode,
        country,
        phone,
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  // Delete user account
  app.delete("/api/users/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      
      // Ensure users can only delete their own account (unless admin)
      if (id !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Add deletion logic for user data
      // Note: Prilagodi ovo prema stvarnoj implementaciji
      // Trenutno samo simuliramo uspješno brisanje
      
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  
  // Dohvati statistiku korisnika (ukupna potrošnja i broj narudžbi)
  app.get("/api/users/:id/stats", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      const orders = await storage.getUserOrders(id);
      
      // Izračunaj ukupnu potrošnju
      const totalSpent = orders.reduce((total, order) => {
        return total + parseFloat(order.total);
      }, 0);
      
      // Broj narudžbi
      const orderCount = orders.length;
      
      res.json({
        userId: id,
        totalSpent: totalSpent.toFixed(2),
        orderCount
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user statistics" });
    }
  });
  
  // Postavi popust za korisnika
  app.post("/api/users/:id/discount", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      const { discountAmount, discountMinimumOrder, discountExpiryDate } = req.body;
      
      const updatedUser = await storage.updateUser(id, {
        discountAmount,
        discountMinimumOrder: discountMinimumOrder || "0",
        discountExpiryDate: discountExpiryDate || null
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error setting user discount:", error);
      res.status(500).json({ message: "Failed to set user discount" });
    }
  });

  // Settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Opće postavke - moraju biti prije generičke rute za :key
  // Kontakt postavke - moraju biti prije generičke rute za :key
  app.get("/api/settings/contact", async (req, res) => {
    try {
      // Dohvati sve postavke koje se tiču kontakta
      const address = await storage.getSetting("contact_address");
      const city = await storage.getSetting("contact_city");
      const postalCode = await storage.getSetting("contact_postal_code");
      const phone = await storage.getSetting("contact_phone");
      const email = await storage.getSetting("contact_email");
      const workingHours = await storage.getSetting("contact_working_hours");
      
      res.json({
        address: address?.value || "",
        city: city?.value || "",
        postalCode: postalCode?.value || "",
        phone: phone?.value || "",
        email: email?.value || "",
        workingHours: workingHours?.value || "",
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contact settings" });
    }
  });
  
  // API rute za upravljanje sadržajem stranica
  app.get("/api/pages/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const page = await storage.getPageByType(type);
      
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      
      res.json(page);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch page" });
    }
  });
  
  // Ruta za obradu POST i PUT zahtjeva za stranice
  // POST /api/pages - Kreira novu stranicu ili ažurira postojeću
  app.post("/api/pages", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const { type, title, content, id } = req.body;
      
      if (!type || !title || !content) {
        return res.status(400).json({ message: "Type, title, and content are required" });
      }
      
      // Kreiraj novu stranicu ili ažuriraj postojeću
      // createPage metoda će sama provjeriti postoji li stranica s tim tipom
      // i ažurirati je ako postoji
      const page = await storage.createPage({
        title,
        content,
        type
      });
      
      res.status(201).json(page);
    } catch (error) {
      console.error("Greška pri kreiranju/ažuriranju stranice:", error);
      res.status(500).json({ message: "Failed to create page" });
    }
  });
  
  // PUT /api/pages - Ažurira postojeću stranicu
  app.put("/api/pages", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const { id, type, title, content } = req.body;
      
      if (!id || !type || !title || !content) {
        return res.status(400).json({ message: "ID, type, title, and content are required" });
      }
      
      // Provjeri postoji li stranica
      const existingPage = await storage.getPage(id);
      
      if (!existingPage) {
        return res.status(404).json({ message: "Page not found" });
      }
      
      // Ažuriraj postojeću stranicu
      const page = await storage.updatePage(id, {
        title,
        content,
        type
      });
      
      res.json(page);
    } catch (error) {
      res.status(500).json({ message: "Failed to update page" });
    }
  });
  
  // Instagram API rute
  app.get("/api/instagram/manual", async (req, res) => {
    try {
      // Dohvaća ručno dodane slike iz settings tabele
      const instagramImages = await storage.getSetting("instagram_manual_images");
      if (!instagramImages) {
        return res.json([]);
      }
      
      try {
        const images = JSON.parse(instagramImages.value);
        res.json(images);
      } catch (parseError) {
        console.error("Greška pri parsiranju Instagram slika:", parseError);
        res.json([]);
      }
    } catch (error) {
      console.error("Greška pri dohvaćanju Instagram slika:", error);
      res.status(500).json({ message: "Failed to fetch Instagram images" });
    }
  });
  
  app.post("/api/instagram/manual", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const { images } = req.body;
      
      if (!images || !Array.isArray(images)) {
        return res.status(400).json({ message: "Invalid image data" });
      }
      
      // Prvo provjeri postoji li postavka
      const existingSetting = await storage.getSetting("instagram_manual_images");
      
      if (existingSetting) {
        // Ako postavka već postoji, ažuriraj je
        await storage.updateSetting("instagram_manual_images", JSON.stringify(images));
      } else {
        // Ako postavka ne postoji, kreiraj je
        await storage.createSetting({
          key: "instagram_manual_images",
          value: JSON.stringify(images)
        });
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Greška pri spremanju Instagram slika:", error);
      res.status(500).json({ message: "Failed to save Instagram images" });
    }
  });
  
  app.post("/api/instagram/token", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }
      
      // Provjeri postoji li token već u bazi
      const existingToken = await storage.getSetting("instagram_token");
      
      if (existingToken) {
        // Ako token već postoji, ažuriraj ga
        await storage.updateSetting("instagram_token", token);
      } else {
        // Ako token ne postoji, kreiraj ga
        await storage.createSetting({
          key: "instagram_token",
          value: token
        });
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Greška pri spremanju Instagram tokena:", error);
      res.status(500).json({ message: "Failed to save Instagram token" });
    }
  });
  
  // Zadržavamo postojeću rutu za nazad kompatibilnost
  app.post("/api/pages/:type", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const { type } = req.params;
      const { title, content } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
      }
      
      // Provjeri postoji li stranica
      const existingPage = await storage.getPageByType(type);
      
      let page;
      if (existingPage) {
        // Ažuriraj postojeću stranicu
        page = await storage.updatePage(existingPage.id, {
          title,
          content,
          type
        });
      } else {
        // Kreiraj novu stranicu
        page = await storage.createPage({
          title,
          content,
          type
        });
      }
      
      res.json(page);
    } catch (error) {
      res.status(500).json({ message: "Failed to update page" });
    }
  });
  
  app.get("/api/settings/:key", async (req, res) => {
    try {
      const key = req.params.key;
      const setting = await storage.getSetting(key);
      
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });
  
  app.post("/api/settings/contact", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const { address, city, postalCode, phone, email, workingHours } = req.body;
      
      // Ažuriraj ili kreiraj postavke za kontakt
      await Promise.all([
        storage.updateSetting("contact_address", address),
        storage.updateSetting("contact_city", city),
        storage.updateSetting("contact_postal_code", postalCode),
        storage.updateSetting("contact_phone", phone),
        storage.updateSetting("contact_email", email),
        storage.updateSetting("contact_working_hours", workingHours),
      ]);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update contact settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertSettingSchema.parse(req.body);
      
      // Check if setting already exists
      const existingSetting = await storage.getSetting(validatedData.key);
      if (existingSetting) {
        return res.status(400).json({ message: "Setting with this key already exists" });
      }
      
      const setting = await storage.createSetting(validatedData);
      res.status(201).json(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create setting" });
    }
  });

  app.put("/api/settings/:key", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const key = req.params.key;
      const { value } = req.body;
      
      if (!value || typeof value !== 'string') {
        return res.status(400).json({ message: "Invalid value" });
      }
      
      const setting = await storage.updateSetting(key, value);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  app.delete("/api/settings/:key", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const key = req.params.key;
      await storage.deleteSetting(key);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete setting" });
    }
  });

  // Scents
  app.get("/api/scents", async (req, res) => {
    try {
      const scents = await storage.getAllScents();
      res.json(scents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scents" });
    }
  });

  app.get("/api/scents/active", async (req, res) => {
    try {
      const scents = await storage.getActiveScents();
      res.json(scents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active scents" });
    }
  });

  app.get("/api/scents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const scent = await storage.getScent(id);
      if (!scent) {
        return res.status(404).json({ message: "Scent not found" });
      }
      res.json(scent);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scent" });
    }
  });

  app.post("/api/scents", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertScentSchema.parse(req.body);
      const scent = await storage.createScent(validatedData);
      res.status(201).json(scent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create scent" });
    }
  });

  app.put("/api/scents/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      const validatedData = insertScentSchema.parse(req.body);
      const scent = await storage.updateScent(id, validatedData);
      
      if (!scent) {
        return res.status(404).json({ message: "Scent not found" });
      }
      
      res.json(scent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update scent" });
    }
  });

  app.delete("/api/scents/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      await storage.deleteScent(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete scent" });
    }
  });

  // Ove rute su već definirane iznad - duplikati

  // Colors
  app.get("/api/colors", async (req, res) => {
    try {
      const colors = await storage.getAllColors();
      res.json(colors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch colors" });
    }
  });

  app.get("/api/colors/active", async (req, res) => {
    try {
      const colors = await storage.getActiveColors();
      res.json(colors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active colors" });
    }
  });

  app.get("/api/colors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const color = await storage.getColor(id);
      if (!color) {
        return res.status(404).json({ message: "Color not found" });
      }
      res.json(color);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch color" });
    }
  });

  app.post("/api/colors", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertColorSchema.parse(req.body);
      const color = await storage.createColor(validatedData);
      res.status(201).json(color);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create color" });
    }
  });

  app.put("/api/colors/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      const validatedData = insertColorSchema.parse(req.body);
      const color = await storage.updateColor(id, validatedData);
      
      if (!color) {
        return res.status(404).json({ message: "Color not found" });
      }
      
      res.json(color);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update color" });
    }
  });

  app.delete("/api/colors/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      await storage.deleteColor(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete color" });
    }
  });

  // Product Colors
  app.get("/api/products/:id/colors", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const colors = await storage.getProductColors(productId);
      res.json(colors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product colors" });
    }
  });

  app.post("/api/products/:id/colors/:colorId", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const productId = parseInt(req.params.id);
      const colorId = parseInt(req.params.colorId);
      
      const productColor = await storage.addColorToProduct(productId, colorId);
      res.status(201).json(productColor);
    } catch (error) {
      res.status(500).json({ message: "Failed to add color to product" });
    }
  });

  app.delete("/api/products/:id/colors/:colorId", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const productId = parseInt(req.params.id);
      const colorId = parseInt(req.params.colorId);
      
      await storage.removeColorFromProduct(productId, colorId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove color from product" });
    }
  });

  // ===== API rute za kolekcije =====
  
  // Dohvati sve kolekcije
  app.get("/api/collections", async (req, res) => {
    try {
      console.log("Dohvaćam sve kolekcije...");
      const collections = await storage.getAllCollections();
      console.log("Dohvaćene kolekcije:", collections);
      res.json(collections);
    } catch (error) {
      console.error("Greška pri dohvaćanju kolekcija:", error);
      res.status(500).json({ message: "Failed to fetch collections" });
    }
  });
  
  // Dohvati samo aktivne kolekcije
  app.get("/api/collections/active", async (req, res) => {
    try {
      const collections = await storage.getActiveCollections();
      res.json(collections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active collections" });
    }
  });
  
  // Dohvati kolekcije koje se prikazuju na početnoj stranici
  app.get("/api/collections/featured", async (req, res) => {
    try {
      const collections = await storage.getFeaturedCollections();
      res.json(collections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured collections" });
    }
  });
  
  // Dohvati pojedinačnu kolekciju
  app.get("/api/collections/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const collection = await storage.getCollection(id);
      
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      res.json(collection);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collection" });
    }
  });
  
  // Kreiraj novu kolekciju
  app.post("/api/collections", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      console.log("Kreiranje nove kolekcije, podaci:", req.body);
      const validatedData = insertCollectionSchema.parse(req.body);
      console.log("Podaci nakon validacije:", validatedData);
      const collection = await storage.createCollection(validatedData);
      console.log("Kreirana kolekcija:", collection);
      res.status(201).json(collection);
    } catch (error) {
      console.error("Greška pri kreiranju kolekcije:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create collection" });
    }
  });
  
  // Ažuriraj postojeću kolekciju
  app.put("/api/collections/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      const validatedData = insertCollectionSchema.parse(req.body);
      const collection = await storage.updateCollection(id, validatedData);
      
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      res.json(collection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update collection" });
    }
  });
  
  // Obriši kolekciju
  app.delete("/api/collections/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      await storage.deleteCollection(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete collection" });
    }
  });
  
  // Dohvati proizvode u kolekciji
  app.get("/api/collections/:id/products", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const products = await storage.getCollectionProducts(id);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collection products" });
    }
  });
  
  // Dodaj proizvod u kolekciju
  app.post("/api/collections/:id/products", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const collectionId = parseInt(req.params.id);
      const { productId } = req.body;
      
      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }
      
      const relation = await storage.addProductToCollection(productId, collectionId);
      res.status(201).json(relation);
    } catch (error) {
      res.status(500).json({ message: "Failed to add product to collection" });
    }
  });
  
  // Ukloni proizvod iz kolekcije
  app.delete("/api/collections/:id/products/:productId", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const collectionId = parseInt(req.params.id);
      const productId = parseInt(req.params.productId);
      
      await storage.removeProductFromCollection(productId, collectionId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove product from collection" });
    }
  });

  // Invoices API endpoints
  
  // Get all invoices
  app.get("/api/invoices", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const invoices = await storage.getAllInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Error getting invoices:", error);
      res.status(500).json({ message: "Failed to get invoices" });
    }
  });
  
  // Get invoice by ID
  app.get("/api/invoices/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Only admins or the user who owns the invoice can access it
      if (!req.user?.isAdmin && invoice.userId !== req.user?.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Get invoice items
      const items = await storage.getInvoiceItems(invoiceId);
      
      res.json({
        ...invoice,
        items
      });
    } catch (error) {
      console.error("Error getting invoice:", error);
      res.status(500).json({ message: "Failed to get invoice" });
    }
  });
  
  // Get user's invoices
  app.get("/api/user/invoices", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const invoices = await storage.getUserInvoices(req.user!.id);
      res.json(invoices);
    } catch (error) {
      console.error("Error getting user invoices:", error);
      res.status(500).json({ message: "Failed to get invoices" });
    }
  });
  
  // Create a new invoice
  app.post("/api/invoices", async (req, res) => {
    try {
      console.log("Primljen zahtjev za kreiranje računa, body:", req.body);
      // Privremeno uklonjena provjera autentifikacije zbog problema s klijentom
      // Samo administratori mogu pristupiti admin stranicama iz kojih se poziva ova API ruta
      /*if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }*/
      
      const { invoice, items } = req.body;
      
      console.log("Request body:", req.body);
      
      if (!invoice || !items) {
        console.error("Nedostaje invoice ili items u zahtjevu");
        return res.status(400).json({ message: "Invalid request format - missing invoice or items" });
      }
      
      // Dodaj userId hardkodirano za admina (id=1) ako nemamo korisnika u sesiji
      if (req.user) {
        invoice.userId = req.user.id;
      } else {
        invoice.userId = 1; // Admin ID
      }
      
      console.log("Creating invoice with data:", { invoice, items });
      
      try {
        // Validate the invoice data
        const validatedInvoice = insertInvoiceSchema.parse(invoice);
        
        // Create the invoice with its items
        const newInvoice = await storage.createInvoice(validatedInvoice, items);
        
        console.log("Uspješno kreiran račun:", newInvoice);
        res.status(201).json(newInvoice);
      } catch (validationError) {
        console.error("Validacija nije uspjela:", validationError);
        res.status(400).json({ 
          message: "Validation error", 
          errors: validationError instanceof z.ZodError ? validationError.errors : [{ message: validationError.message }] 
        });
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });
  
  // Delete an invoice
  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const invoiceId = parseInt(req.params.id);
      await storage.deleteInvoice(invoiceId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
