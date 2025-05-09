// Redirect stranica - preusmjerava korisnika na delivery-settings
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function AdminSettings() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation("/admin/delivery-settings");
  }, [setLocation]);
  
  return <div>Preusmjeravanje...</div>;
}