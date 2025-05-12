import React, { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CompanyDocument } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, Trash2, File, Calendar } from "lucide-react";
import { format } from "date-fns";

// Pomoćna funkcija za formatiranje veličine datoteke
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i)) + " " + sizes[i];
};

const DocumentManager: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Dohvati dokumente
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery<CompanyDocument[]>({
    queryKey: ['/api/company-documents'],
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "Greška",
        description: "Molimo odaberite datoteku",
        variant: "destructive"
      });
      return;
    }
    
    if (!name.trim()) {
      toast({
        title: "Greška",
        description: "Molimo unesite naziv dokumenta",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Pripremi FormData objekt za prijenos datoteke
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', name);
      formData.append('description', description);
      
      // Pošalji zahtjev za prijenos datoteke
      const response = await fetch('/api/company-documents/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Greška prilikom prijenosa datoteke');
      }
      
      // Osvježi popis dokumenata
      queryClient.invalidateQueries({ queryKey: ['/api/company-documents'] });
      
      // Resetiraj formu
      setName("");
      setDescription("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      toast({
        title: "Uspjeh",
        description: "Dokument je uspješno prenesen",
      });
    } catch (error) {
      console.error('Greška:', error);
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom prijenosa dokumenta",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDeleteDocument = async (documentId: number) => {
    try {
      await apiRequest('DELETE', `/api/company-documents/${documentId}`);
      
      // Osvježi popis dokumenata
      queryClient.invalidateQueries({ queryKey: ['/api/company-documents'] });
      
      toast({
        title: "Uspjeh",
        description: "Dokument je uspješno obrisan",
      });
    } catch (error) {
      console.error('Greška:', error);
      toast({
        title: "Greška",
        description: "Došlo je do greške prilikom brisanja dokumenta",
        variant: "destructive"
      });
    }
  };
  
  const handleDownloadDocument = (doc: CompanyDocument) => {
    // Kreiraj link za preuzimanje i simuliraj klik
    const link = window.document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.name;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dodaj novi dokument</CardTitle>
          <CardDescription>
            Ovdje možete dodati dokumente firme poput knjigovodstvenih dokumenata, ugovora itd.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="font-medium">
                Naziv dokumenta*
              </label>
              <Input
                id="name"
                placeholder="Npr. Račun za najam prostora"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="font-medium">
                Opis dokumenta
              </label>
              <Textarea
                id="description"
                placeholder="Opis dokumenta (opcionalno)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="file" className="font-medium">
                Datoteka*
              </label>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  required
                  className="flex-1"
                />
                {selectedFile && (
                  <Badge variant="outline">
                    {formatFileSize(selectedFile.size)}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button type="submit" disabled={isUploading} className="w-full">
              {isUploading ? (
                "Prijenos u tijeku..."
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Dodaj dokument
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Postojeći dokumenti</CardTitle>
          <CardDescription>
            Pregled svih dokumenata firme
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingDocuments ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <File className="mx-auto h-10 w-10 mb-2" />
              <p>Nema pronađenih dokumenata</p>
              <p className="text-sm">Dodajte prvi dokument koristeći formu iznad</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naziv</TableHead>
                    <TableHead>Tip datoteke</TableHead>
                    <TableHead>Veličina</TableHead>
                    <TableHead>Datum prijenosa</TableHead>
                    <TableHead>Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{document.name}</p>
                          {document.description && (
                            <p className="text-sm text-muted-foreground">{document.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {document.fileType.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatFileSize(document.fileSize)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {format(new Date(document.uploadedAt), "dd.MM.yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDownloadDocument(document)}
                            title="Preuzmi"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="icon"
                                title="Obriši"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Jeste li sigurni?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Ova akcija će trajno obrisati dokument "{document.name}" iz sustava.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Odustani</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteDocument(document.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Obriši
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>
                  Ukupno {documents.length} dokumenata
                </TableCaption>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentManager;