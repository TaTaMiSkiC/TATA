import { Helmet } from "react-helmet";
import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EyeIcon, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { OrderItem, Order } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PaymentWithOrder {
  id: number;
  orderId: number;
  paymentMethod: string;
  amount: string;
  status: string;
  transactionId: string | null;
  createdAt: Date;
  order: Order;
}

export default function AdminPayments() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithOrder | null>(null);
  
  // Dohvati plaćanja putem API-ja
  const { data: payments = [], isLoading, refetch } = useQuery<PaymentWithOrder[]>({
    queryKey: ['/api/payments'],
  });
  
  // Filtriranje plaćanja ovisno o odabranom tabu
  const filteredPayments = activeTab === 'all' 
    ? payments 
    : payments.filter(payment => payment.status.toLowerCase() === activeTab);
  
  // Definicija stupaca za tablicu plaćanja
  const columns: ColumnDef<PaymentWithOrder>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "orderId",
      header: "Broj narudžbe",
      cell: ({ row }) => {
        return <span>#{row.original.orderId}</span>;
      }
    },
    {
      accessorKey: "paymentMethod",
      header: "Način plaćanja",
      cell: ({ row }) => {
        const method = row.original.paymentMethod;
        return (
          <Badge variant={
            method === 'paypal' ? 'outline' : 
            method === 'bank' ? 'secondary' : 'default'
          }>
            {method === 'paypal' ? 'PayPal' : 
             method === 'bank' ? 'Bankovni prijenos' : 'Gotovina'}
          </Badge>
        );
      }
    },
    {
      accessorKey: "amount",
      header: "Iznos",
      cell: ({ row }) => {
        return <span>{row.original.amount} €</span>;
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant={
            status === 'completed' ? 'default' : 
            status === 'pending' ? 'outline' : 
            status === 'failed' ? 'destructive' : 'default'
          }>
            {status === 'completed' ? 'Plaćeno' : 
             status === 'pending' ? 'U obradi' : 
             status === 'failed' ? 'Neuspjelo' : status}
          </Badge>
        );
      }
    },
    {
      accessorKey: "createdAt",
      header: "Datum",
      cell: ({ row }) => {
        return format(new Date(row.original.createdAt), "dd.MM.yyyy HH:mm");
      }
    },
    {
      id: "actions",
      header: "Akcije",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSelectedPayment(row.original)}
                >
                  <EyeIcon className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Detalji plaćanja #{row.original.id}</DialogTitle>
                  <DialogDescription>
                    Povezano s narudžbom #{row.original.orderId}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="font-semibold">Način plaćanja:</span>
                    <span>{row.original.paymentMethod === 'paypal' ? 'PayPal' : 
                          row.original.paymentMethod === 'bank' ? 'Bankovni prijenos' : 'Gotovina'}</span>
                    
                    <span className="font-semibold">Iznos:</span>
                    <span>{row.original.amount} €</span>
                    
                    <span className="font-semibold">Status:</span>
                    <span>{row.original.status === 'completed' ? 'Plaćeno' : 
                          row.original.status === 'pending' ? 'U obradi' : 
                          row.original.status === 'failed' ? 'Neuspjelo' : row.original.status}</span>
                    
                    <span className="font-semibold">Datum:</span>
                    <span>{format(new Date(row.original.createdAt), "dd.MM.yyyy HH:mm")}</span>
                    
                    {row.original.transactionId && (
                      <>
                        <span className="font-semibold">Transakcijski ID:</span>
                        <span>{row.original.transactionId}</span>
                      </>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Zatvori</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        );
      }
    }
  ];
  
  // Za sada nije implementiran API za plaćanja, pa vraćamo obavijest
  return (
    <AdminLayout>
      <Helmet>
        <title>Upravljanje plaćanjima | Kerzenwelt by Dani</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Plaćanja</h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Osvježi
          </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">Ukupno plaćanja</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{payments.length}</div>
              <p className="text-xs text-muted-foreground">
                Sva procesirana plaćanja
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">Završena plaćanja</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">
                {payments.filter(p => p.status === 'completed').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Plaćanja koja su uspješno realizirana
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium">Plaćanja u obradi</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">
                {payments.filter(p => p.status === 'pending').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Plaćanja koja su u procesu
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Sva plaćanja</TabsTrigger>
            <TabsTrigger value="completed">Završena</TabsTrigger>
            <TabsTrigger value="pending">U obradi</TabsTrigger>
            <TabsTrigger value="failed">Neuspjela</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-4">
            <div className="rounded-md border">
              {isLoading ? (
                <div className="p-8 text-center">
                  <p>Učitavanje plaćanja...</p>
                </div>
              ) : payments.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="mb-4">Funkcionalnost upravljanja plaćanjima još nije implementirana.</p>
                  <p>Trenutno se podaci o načinu plaćanja bilježe zajedno s narudžbom i računom.</p>
                </div>
              ) : (
                <DataTable columns={columns} data={filteredPayments} />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}