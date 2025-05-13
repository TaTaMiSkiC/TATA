import { useState } from "react";
import { useTranslation } from "@/lib/i18n-context";
import { Language, languages } from "@/lib/i18n";
import { Check, ChevronDown, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher() {
  const { currentLanguage, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Zastave za svaki jezik (emoji zastave)
  const flags: Record<Language, string> = {
    de: "🇩🇪",
    hr: "🇭🇷",
    en: "🇬🇧",
    it: "🇮🇹",
    sl: "🇸🇮"
  };

  // Redoslijed jezika prema zahtjevu
  const languageOrder: Language[] = ['de', 'hr', 'en', 'it', 'sl'];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
        <Globe className="h-4 w-4" />
        <span className="hidden md:inline">{languages[currentLanguage]}</span>
        <span className="inline md:hidden">{flags[currentLanguage]}</span>
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languageOrder.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => {
              setLanguage(lang);
              setIsOpen(false);
            }}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span>{flags[lang]}</span>
              <span>{languages[lang]}</span>
            </span>
            {currentLanguage === lang && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}