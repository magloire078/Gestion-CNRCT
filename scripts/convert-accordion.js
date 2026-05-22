const fs = require('fs');

function convertAccordionToTabs(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace imports
  content = content.replace(
    /import \{\s*Accordion,\s*AccordionContent,\s*AccordionItem,\s*AccordionTrigger,\s*\} from "\@\/components\/ui\/accordion";/,
    `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";`
  );

  // Replace main container
  content = content.replace(
    /<Accordion type="multiple" defaultValue=\{\["admin"\]\} className="[^"]*">/,
    `<Tabs defaultValue="admin" className="w-full h-full flex flex-col pb-8">
    <TabsList className="w-full flex overflow-x-auto no-scrollbar justify-start mb-6 bg-slate-100 p-1 h-auto rounded-xl flex-nowrap">
        <TabsTrigger value="admin" className="rounded-lg px-4 py-2 font-bold whitespace-nowrap">Identité</TabsTrigger>
        <TabsTrigger value="sig" className="rounded-lg px-4 py-2 font-bold whitespace-nowrap">SIG & Géo</TabsTrigger>
        <TabsTrigger value="geo" className="rounded-lg px-4 py-2 font-bold whitespace-nowrap">SIG & Géo</TabsTrigger>
        <TabsTrigger value="demography" className="rounded-lg px-4 py-2 font-bold whitespace-nowrap">Démographie</TabsTrigger>
        <TabsTrigger value="history" className="rounded-lg px-4 py-2 font-bold whitespace-nowrap">Histoire</TabsTrigger>
        <TabsTrigger value="economy" className="rounded-lg px-4 py-2 font-bold whitespace-nowrap">Économie</TabsTrigger>
        <TabsTrigger value="infra" className="rounded-lg px-4 py-2 font-bold whitespace-nowrap">Infra.</TabsTrigger>
        <TabsTrigger value="infrastructures" className="rounded-lg px-4 py-2 font-bold whitespace-nowrap">Infra.</TabsTrigger>
        <TabsTrigger value="chief" className="rounded-lg px-4 py-2 font-bold whitespace-nowrap">Autorité</TabsTrigger>
    </TabsList>`
  );

  // Replace AccordionItem
  content = content.replace(/<AccordionItem value="([^"]+)" className="[^"]*">/g, '<TabsContent value="$1" className="mt-0 h-full flex-grow">');

  // Remove AccordionTrigger
  content = content.replace(/<AccordionTrigger className="hover:no-underline py-[^"]+">[\s\S]*?<\/AccordionTrigger>/g, '');

  // Replace AccordionContent
  content = content.replace(/<AccordionContent className="[^"]*">/g, '<div className="pt-4 space-y-4 h-full">');
  
  // Close tags
  content = content.replace(/<\/AccordionContent>/g, '</div>');
  content = content.replace(/<\/AccordionItem>/g, '</TabsContent>');
  content = content.replace(/<\/Accordion>/g, '</Tabs>');

  // Input Type replacements (number fields)
  content = content.replace(/<Input type="number" placeholder="Ex: 5000" className="([^"]+)" \{\.\.\.field\}/g, '<Input type="number" inputMode="numeric" placeholder="Ex: 5000" className="$1" {...field}');
  content = content.replace(/<Input type="number" placeholder="Ex: 2024" className="([^"]+)" \{\.\.\.field\}/g, '<Input type="number" inputMode="numeric" placeholder="Ex: 2024" className="$1" {...field}');
  content = content.replace(/<Input type="number" placeholder="Ex: 850" className="([^"]+)" \{\.\.\.field\}/g, '<Input type="number" inputMode="numeric" placeholder="Ex: 850" className="$1" {...field}');
  content = content.replace(/<Input type="number" placeholder="Ex: 250" className="([^"]+)" \{\.\.\.field\}/g, '<Input type="number" inputMode="numeric" placeholder="Ex: 250" className="$1" {...field}');
  content = content.replace(/<Input type="number" placeholder="Ex: 240" className="([^"]+)" \{\.\.\.field\}/g, '<Input type="number" inputMode="numeric" placeholder="Ex: 240" className="$1" {...field}');
  content = content.replace(/<Input type="number" placeholder="Ex: 15" className="([^"]+)" \{\.\.\.field\}/g, '<Input type="number" inputMode="numeric" placeholder="Ex: 15" className="$1" {...field}');
  content = content.replace(/<Input type="number" placeholder="Habitants" className="([^"]+)" \{\.\.\.field\}/g, '<Input type="number" inputMode="numeric" placeholder="Habitants" className="$1" {...field}');

  // Stepper UI for chiefs is in another file, but phone fields in general
  content = content.replace(/<Input type="tel" className="([^"]+)" \{\.\.\.field\}/g, '<Input type="tel" inputMode="tel" className="$1" {...field}');
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
}

convertAccordionToTabs('src/components/villages/add-village-sheet.tsx');
convertAccordionToTabs('src/components/villages/edit-village-sheet.tsx');
