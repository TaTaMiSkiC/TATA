import { Fragment } from "react";
import { Link } from "wouter";
import { X, ChevronRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
        <SheetHeader className="p-6 text-left border-b">
          <div className="flex items-center gap-3">
            <img 
              src="/images/logo.png" 
              alt="Kerzenwelt Logo" 
              className="h-10 w-auto" 
            />
            <SheetTitle className="heading text-xl font-bold text-primary">Kerzenwelt by Dani</SheetTitle>
          </div>
        </SheetHeader>
        
        <div className="py-6 px-6">
          <nav className="flex flex-col space-y-1">
            <Link href="/">
              <a className="font-body text-text-dark py-2 hover:text-primary" onClick={onClose}>
                Početna
              </a>
            </Link>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="products" className="border-b-0">
                <AccordionTrigger className="font-body text-text-dark py-2 hover:text-primary hover:no-underline">
                  Proizvodi
                </AccordionTrigger>
                <AccordionContent className="pl-4">
                  <div className="flex flex-col space-y-2">
                    <Link href="/products?category=1">
                      <a className="font-body text-text-dark py-1 hover:text-primary flex items-center" onClick={onClose}>
                        <ChevronRight size={14} className="mr-1" />
                        Mirisne svijeće
                      </a>
                    </Link>
                    <Link href="/products?category=2">
                      <a className="font-body text-text-dark py-1 hover:text-primary flex items-center" onClick={onClose}>
                        <ChevronRight size={14} className="mr-1" />
                        Dekorativne svijeće
                      </a>
                    </Link>
                    <Link href="/products?category=3">
                      <a className="font-body text-text-dark py-1 hover:text-primary flex items-center" onClick={onClose}>
                        <ChevronRight size={14} className="mr-1" />
                        Personalizirane svijeće
                      </a>
                    </Link>
                    <Link href="/products">
                      <a className="font-body text-text-dark py-1 hover:text-primary flex items-center" onClick={onClose}>
                        <ChevronRight size={14} className="mr-1" />
                        Posebne ponude
                      </a>
                    </Link>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <Link href="/about">
              <a className="font-body text-text-dark py-2 hover:text-primary" onClick={onClose}>
                O nama
              </a>
            </Link>
            <Link href="/blog">
              <a className="font-body text-text-dark py-2 hover:text-primary" onClick={onClose}>
                Blog
              </a>
            </Link>
            <Link href="/contact">
              <a className="font-body text-text-dark py-2 hover:text-primary" onClick={onClose}>
                Kontakt
              </a>
            </Link>
            
            <Separator className="my-4" />
            
            <Link href="/auth">
              <a className="font-body text-text-dark py-2 hover:text-primary" onClick={onClose}>
                Prijava / Registracija
              </a>
            </Link>
            <Link href="/cart">
              <a className="font-body text-text-dark py-2 hover:text-primary" onClick={onClose}>
                Košarica
              </a>
            </Link>
          </nav>
        </div>
        
        <div className="absolute bottom-4 right-4">
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X size={18} />
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
