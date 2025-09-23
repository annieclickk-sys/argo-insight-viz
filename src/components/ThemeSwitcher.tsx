import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Waves } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const themes = [
  {
    name: 'Dark Ocean',
    value: 'dark' as const,
    icon: Moon,
    color: 'hsl(193 76% 48%)',
    description: 'Deep ocean darkness'
  },
  {
    name: 'Light Ocean',
    value: 'light' as const,
    icon: Sun,
    color: 'hsl(193 76% 40%)',
    description: 'Bright surface waters'
  },
  {
    name: 'Deep Blue Earth',
    value: 'deep-blue' as const,
    icon: Waves,
    color: 'hsl(215 84% 60%)',
    description: 'Deep blue planet'
  }
];

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  
  const currentTheme = themes.find(t => t.value === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="h-9 w-9 p-0 border border-border/50 bg-background/80 backdrop-blur-sm hover:bg-card/80"
        >
          <CurrentIcon className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-background/95 backdrop-blur-md border border-border/50 shadow-xl"
      >
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isActive = theme === themeOption.value;
          
          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className={`cursor-pointer p-3 hover:bg-card/80 transition-colors ${
                isActive ? 'bg-card/60' : ''
              }`}
            >
              <div className="flex items-center gap-3 w-full">
                <div 
                  className="flex items-center justify-center w-8 h-8 rounded-full border"
                  style={{ backgroundColor: `${themeOption.color}20`, borderColor: themeOption.color }}
                >
                  <Icon 
                    className="h-4 w-4" 
                    style={{ color: themeOption.color }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{themeOption.name}</span>
                    {isActive && (
                      <motion.div
                        className="w-2 h-2 rounded-full bg-primary"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{themeOption.description}</p>
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};