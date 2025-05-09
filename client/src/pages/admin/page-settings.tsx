import React from "react";
import { Helmet } from "react-helmet";
import AdminLayout from "@/components/admin/AdminLayout";
import { Settings, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageSettingsForm from "@/components/admin/PageSettingsForm";

export default function PageSettingsPage() {
  return (
    <AdminLayout title="Postavke stranica">
      <Helmet>
        <title>Postavke stranica | Admin Panel</title>
      </Helmet>
      
      <div className="flex items-center mb-6">
        <FileText className="mr-2 h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Postavke stranica</h1>
          <p className="text-muted-foreground">Upravljajte sadržajem važnih stranica na vašoj web trgovini</p>
        </div>
      </div>
      
      <div className="space-y-4 bg-card p-6 rounded-md border">
        <Tabs defaultValue="about">
          <TabsList className="mb-4">
            <TabsTrigger value="about">O nama</TabsTrigger>
            <TabsTrigger value="contact">Kontakt</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
          </TabsList>
          
          <TabsContent value="about">
            <PageSettingsForm 
              pageType="about" 
              title="Stranica O nama" 
              description="Uredite sadržaj stranice O nama koji će se prikazivati korisnicima" 
            />
          </TabsContent>
          
          <TabsContent value="contact">
            <PageSettingsForm 
              pageType="contact" 
              title="Kontakt stranica" 
              description="Uredite sadržaj kontakt stranice" 
            />
          </TabsContent>
          
          <TabsContent value="blog">
            <PageSettingsForm 
              pageType="blog" 
              title="Blog stranica" 
              description="Uredite sadržaj blog stranice" 
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}