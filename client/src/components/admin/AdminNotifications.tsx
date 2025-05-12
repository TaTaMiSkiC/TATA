import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { queryClient } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { hr } from 'date-fns/locale';

// Tipovi za notifikacije
export type NotificationType = 'order' | 'invoice' | 'other';

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  referenceId?: number; // ID narudžbe ili računa
  read: boolean;
  createdAt: string;
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Dohvati notifikacije
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      try {
        // Za sada simuliramo dohvat notifikacija jer još nemamo API endpoint
        const pendingOrders = await queryClient.fetchQuery({
          queryKey: ['/api/orders/pending'],
          queryFn: async () => {
            const response = await fetch('/api/orders?status=pending');
            if (!response.ok) {
              throw new Error('Greška kod dohvata narudžbi');
            }
            return response.json();
          }
        });

        return pendingOrders.map((order: any) => ({
          id: order.id,
          type: 'order' as NotificationType,
          message: `Nova narudžba #${order.id} - ${order.total} EUR`,
          referenceId: order.id,
          read: false,
          createdAt: order.createdAt
        })) as Notification[];
      } catch (err) {
        console.error('Greška kod dohvata notifikacija:', err);
        return [];
      }
    },
    refetchInterval: 60000, // Provjeri nove notifikacije svakih 60 sekundi
  });

  useEffect(() => {
    if (data) {
      setNotifications(data);
    }
  }, [data]);

  const handleNotificationClick = (notification: Notification) => {
    // Ažuriraj pročitano stanje
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    
    // Zatvori dropdown ako je otvoreno
    setIsOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: hr });
    } catch (error) {
      return 'nepoznato vrijeme';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative p-2">
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1.5 bg-red-500">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Obavijesti</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Označi sve kao pročitano
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Obriši sve
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="p-4 text-center">Učitavanje...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">Greška kod dohvata obavijesti</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center">Nema novih obavijesti</div>
        ) : (
          notifications.map(notification => (
            <DropdownMenuItem key={notification.id} className={`p-3 cursor-pointer ${!notification.read ? 'bg-muted/50' : ''}`}>
              {notification.type === 'order' ? (
                <Link to={`/admin/orders/${notification.referenceId}`} onClick={() => handleNotificationClick(notification)}>
                  <div className="flex flex-col">
                    <span className="font-medium">{notification.message}</span>
                    <span className="text-sm text-muted-foreground">{formatTimeAgo(notification.createdAt)}</span>
                  </div>
                </Link>
              ) : (
                <div className="flex flex-col" onClick={() => handleNotificationClick(notification)}>
                  <span className="font-medium">{notification.message}</span>
                  <span className="text-sm text-muted-foreground">{formatTimeAgo(notification.createdAt)}</span>
                </div>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}