import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from 'react-helmet';
import AdminLayout from "@/components/admin/AdminLayout";
import { User } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, MoreVertical, UserCog, Info, Mail, Eye, EyeOff, ShieldCheck, ShieldX, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AdminUsers() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Fetch users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Filter users based on search term
  const filteredUsers = users?.filter((user) => {
    return (
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });
  
  // View user details
  const viewUserDetails = (user: User) => {
    setSelectedUser(user);
    setIsUserDetailsOpen(true);
  };
  
  // Toggle admin status
  const toggleAdminStatus = async (user: User) => {
    try {
      const updatedUser = { ...user, isAdmin: !user.isAdmin };
      await apiRequest("PUT", `/api/users/${user.id}`, updatedUser);
      
      toast({
        title: "Status ažuriran",
        description: `${user.username} je ${!user.isAdmin ? "sada administrator" : "više nije administrator"}.`,
      });
      
      // Refresh users
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      // If the updated user is the currently selected one, update it
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, isAdmin: !selectedUser.isAdmin });
      }
    } catch (error) {
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom ažuriranja statusa korisnika.",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout title="Korisnici">
      <Helmet>
        <title>Upravljanje korisnicima | Admin Panel | Kerzenwelt by Dani</title>
      </Helmet>
      
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Korisnici</h1>
          <p className="text-muted-foreground">Upravljajte korisnicima trgovine</p>
        </div>
        
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Pretraži korisnike..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista korisnika</CardTitle>
            <CardDescription>
              {filteredUsers ? `${filteredUsers.length} korisnika` : "Učitavanje korisnika..."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Korisničko ime</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ime i prezime</TableHead>
                      <TableHead>Registriran</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead className="w-[100px]">Akcije</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nema pronađenih korisnika
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers?.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}` 
                              : user.firstName || user.lastName || "-"}
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.isAdmin ? "default" : "outline"}>
                              {user.isAdmin ? "Administrator" : "Korisnik"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Akcije</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => viewUserDetails(user)}>
                                  <Info className="mr-2 h-4 w-4" /> Detalji
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  toast({
                                    title: "Slanje emaila",
                                    description: `Ova funkcionalnost bi otvorila formu za slanje emaila korisniku ${user.username}.`,
                                  });
                                }}>
                                  <Mail className="mr-2 h-4 w-4" /> Kontaktiraj
                                </DropdownMenuItem>
                                {user.isAdmin ? (
                                  <DropdownMenuItem onClick={() => toggleAdminStatus(user)}>
                                    <ShieldX className="mr-2 h-4 w-4" /> Ukloni admin prava
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => toggleAdminStatus(user)}>
                                    <ShieldCheck className="mr-2 h-4 w-4" /> Dodaj admin prava
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* User Details Dialog */}
      <Dialog open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <UserCog className="mr-2 h-5 w-5" />
              Detalji korisnika
            </DialogTitle>
            <DialogDescription>
              Pregledajte informacije o korisniku {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">ID korisnika</p>
                  <p>{selectedUser.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tip korisnika</p>
                  <Badge variant={selectedUser.isAdmin ? "default" : "outline"}>
                    {selectedUser.isAdmin ? "Administrator" : "Korisnik"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Korisničko ime</p>
                  <p>{selectedUser.username}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p>{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Ime</p>
                  <p>{selectedUser.firstName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Prezime</p>
                  <p>{selectedUser.lastName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Telefon</p>
                  <p>{selectedUser.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Datum registracije</p>
                  <p>{new Date(selectedUser.createdAt).toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Adresa</p>
                <p>{selectedUser.address || "-"}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Grad</p>
                  <p>{selectedUser.city || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Poštanski broj</p>
                  <p>{selectedUser.postalCode || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Država</p>
                  <p>{selectedUser.country || "-"}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={() => toggleAdminStatus(selectedUser!)}
              className={selectedUser?.isAdmin ? "bg-red-50 hover:bg-red-100 border-red-200" : "bg-green-50 hover:bg-green-100 border-green-200"}
            >
              {selectedUser?.isAdmin ? (
                <>
                  <ShieldX className="mr-2 h-4 w-4 text-red-500" />
                  <span className="text-red-500">Ukloni admin prava</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4 text-green-500" />
                  <span className="text-green-500">Dodaj admin prava</span>
                </>
              )}
            </Button>
            <Button onClick={() => setIsUserDetailsOpen(false)}>
              Zatvori
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
