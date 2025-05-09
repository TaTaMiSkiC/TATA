import React from "react";
import { Helmet } from "react-helmet";
import AdminLayout from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageSettingsForm from "@/components/admin/PageSettingsForm";

export default function PageSettingsPage() {
  return (
    <>
      <Helmet>
        <title>Postavke stranica | Admin Panel</title>
      </Helmet>
      
      <AdminLayout>
        <div className="container py-6">
          <h1 className="text-3xl font-bold mb-6">Postavke stranica</h1>
          
          <Tabs defaultValue="about">
            <TabsList className="mb-6">
              <TabsTrigger value="about">O nama</TabsTrigger>
              <TabsTrigger value="contact">Kontakt</TabsTrigger>
              <TabsTrigger value="blog">Blog</TabsTrigger>
            </TabsList>
            
            <TabsContent value="about">
              <PageSettingsForm 
                pageType="about" 
                title="O nama stranica" 
                description="Uredite sadržaj stranice O nama. Ovaj sadržaj će biti prikazan na stranici O nama na web stranici."
              />
            </TabsContent>
            
            <TabsContent value="contact">
              <PageSettingsForm 
                pageType="contact" 
                title="Kontakt stranica" 
                description="Uredite sadržaj kontakt stranice. Ovaj sadržaj će biti prikazan na kontakt stranici na web stranici."
              />
            </TabsContent>
            
            <TabsContent value="blog">
              <PageSettingsForm 
                pageType="blog" 
                title="Blog stranica" 
                description="Uredite sadržaj blog stranice. Ovaj sadržaj će biti prikazan na blog stranici na web stranici."
              />
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </>
  );
}