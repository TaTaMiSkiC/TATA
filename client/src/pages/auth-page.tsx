import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Helmet } from 'react-helmet';
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Korisničko ime je obavezno"),
  password: z.string().min(1, "Lozinka je obavezna"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, "Korisničko ime mora imati barem 3 znaka"),
  email: z.string().email("Nevažeća email adresa"),
  password: z.string().min(6, "Lozinka mora imati barem 6 znakova"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Lozinke se ne podudaraju",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if already logged in
  if (user) {
    navigate("/");
    return null;
  }

  // Login form setup
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form setup
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Form submission handlers
  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  const onRegisterSubmit = (values: RegisterFormValues) => {
    const { confirmPassword, ...registerData } = values;
    registerMutation.mutate(registerData);
  };

  return (
    <Layout>
      <Helmet>
        <title>Prijava / Registracija | Kerzenwelt by Dani</title>
        <meta name="description" content="Prijavite se ili registrirajte kako biste kupovali ručno izrađene svijeće, pratili svoje narudžbe i uživali u posebnim ponudama." />
      </Helmet>
      
      <div className="py-16 bg-neutral">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left side - Auth forms */}
            <div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="login">Prijava</TabsTrigger>
                  <TabsTrigger value="register">Registracija</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <Card>
                    <CardHeader>
                      <CardTitle className="heading text-2xl">Prijava</CardTitle>
                      <CardDescription>
                        Prijavite se na vaš Kerzenwelt račun
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...loginForm}>
                        <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                          <FormField
                            control={loginForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Korisničko ime</FormLabel>
                                <FormControl>
                                  <Input placeholder="Unesite korisničko ime" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={loginForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Lozinka</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Unesite lozinku" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={loginMutation.isPending}
                          >
                            {loginMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Prijava u tijeku...
                              </>
                            ) : (
                              "Prijava"
                            )}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                      <Button 
                        variant="link" 
                        onClick={() => setActiveTab("register")}
                      >
                        Nemate račun? Registrirajte se
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="register">
                  <Card>
                    <CardHeader>
                      <CardTitle className="heading text-2xl">Registracija</CardTitle>
                      <CardDescription>
                        Kreirajte novi Kerzenwelt račun
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...registerForm}>
                        <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                          <FormField
                            control={registerForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Korisničko ime</FormLabel>
                                <FormControl>
                                  <Input placeholder="Odaberite korisničko ime" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={registerForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email adresa</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="Unesite email adresu" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={registerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Lozinka</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Unesite lozinku" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={registerForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Potvrdite lozinku</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="Potvrdite lozinku" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={registerMutation.isPending}
                          >
                            {registerMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Registracija u tijeku...
                              </>
                            ) : (
                              "Registracija"
                            )}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                      <Button 
                        variant="link" 
                        onClick={() => setActiveTab("login")}
                      >
                        Već imate račun? Prijavite se
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Right side - Hero content */}
            <div className="bg-primary p-10 rounded-lg text-white">
              <h2 className="heading text-3xl md:text-4xl font-bold mb-6">
                Dobrodošli u Kerzenwelt svijet
              </h2>
              <p className="mb-6">
                Ručno izrađene svijeće, stvorene s pažnjom i ljubavlju, baš za vas. Otkrijte razliku koju 
                prirodni sastojci i umijeće izrade mogu donijeti vašem domu.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center mr-4">
                    <span className="text-xl font-bold">1</span>
                  </div>
                  <p>Stvorite svoj račun i započnite kupovinu</p>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center mr-4">
                    <span className="text-xl font-bold">2</span>
                  </div>
                  <p>Otkrijte široki asortiman ručno izrađenih svijeća</p>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center mr-4">
                    <span className="text-xl font-bold">3</span>
                  </div>
                  <p>Pratite svoje narudžbe i uživajte u posebnim pogodnostima</p>
                </div>
              </div>
              
              <p className="text-sm text-white text-opacity-80 italic">
                "Svaka svijeća koja napusti našu radionicu nosi djelić naše duše i strasti prema ovom zanatu."
              </p>
              <p className="text-sm font-medium mt-2">- Dani, osnivačica</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
