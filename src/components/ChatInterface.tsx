import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Paperclip, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'data' | 'visualization';
  data?: any;
}

const sampleMessages: Message[] = [
  {
    id: '1',
    content: "Hello! I'm your AI oceanographic assistant. Ask me anything about ARGO float data, ocean conditions, or specific measurements.",
    sender: 'ai',
    timestamp: new Date(),
    type: 'text'
  }
];

const suggestedQueries = [
  "Show me temperature patterns in the Arabian Sea",
  "Ocean conditions near the equator in the Indian Ocean", 
  "Salinity data from Bay of Bengal last month",
  "Temperature profiles in the Southern Indian Ocean"
];

export const ChatInterface = ({ onDataReceived }: { onDataReceived?: (data: any) => void }) => {
  const [messages, setMessages] = useState<Message[]>(sampleMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Step 1: Parse the query
      const parseResponse = await supabase.functions.invoke('argo-ai-query', {
        body: { query: content, type: 'parse_query' }
      });

      if (parseResponse.error) throw parseResponse.error;

      const { params, knowledge } = parseResponse.data;

      // Step 2: Get ARGO data
      const dataResponse = await supabase.functions.invoke('argo-ai-query', {
        body: { params, type: 'get_data' }
      });

      if (dataResponse.error) throw dataResponse.error;

      const { data: argoData } = dataResponse.data;

      // Step 3: Generate AI summary
      const summaryResponse = await supabase.functions.invoke('argo-ai-query', {
        body: { 
          data: argoData, 
          userQuery: content,
          type: 'generate_summary' 
        }
      });

      if (summaryResponse.error) throw summaryResponse.error;

      const { summary } = summaryResponse.data;

      // Add AI response with data
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: summary,
        sender: 'ai',
        timestamp: new Date(),
        type: 'data',
        data: {
          argoData,
          queryParams: params,
          knowledge
        }
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Pass data to parent component for dashboard
      if (onDataReceived) {
        onDataReceived(argoData);
      }
    } catch (error) {
      console.error('Error processing query:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I apologize, but I encountered an error while processing your query: "${content}". Please try rephrasing your question or try one of the suggested queries below.`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestedQuery = (query: string) => {
    handleSendMessage(query);
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <motion.div 
        className="p-6 border-b border-border/50 bg-card/50 backdrop-blur-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center glow-primary">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Ocean AI Assistant</h2>
            <p className="text-sm text-muted-foreground">Ask questions about ARGO ocean data</p>
          </div>
        </div>
      </motion.div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
        <div className="space-y-6 max-w-4xl mx-auto">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                
                <div className={`${message.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'} float-element`}>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Show data visualization for ARGO data responses */}
                  {message.type === 'data' && message.data?.argoData && (
                    <div className="mt-4 p-4 bg-card/50 rounded-lg border border-border/50">
                      <h4 className="font-semibold text-sm mb-2">📊 ARGO Data Summary ({message.data.argoData.length} measurements)</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Temperature Range:</span>
                          <br />
                          {Math.min(...message.data.argoData.map((d: any) => parseFloat(d.temperature))).toFixed(1)}°C - {Math.max(...message.data.argoData.map((d: any) => parseFloat(d.temperature))).toFixed(1)}°C
                        </div>
                        <div>
                          <span className="text-muted-foreground">Salinity Range:</span>
                          <br />
                          {Math.min(...message.data.argoData.map((d: any) => parseFloat(d.salinity))).toFixed(1)} - {Math.max(...message.data.argoData.map((d: any) => parseFloat(d.salinity))).toFixed(1)} PSU
                        </div>
                        <div>
                          <span className="text-muted-foreground">Region:</span>
                          <br />
                          {message.data.argoData[0]?.region || 'Multiple Regions'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Time Range:</span>
                          <br />
                          {message.data.queryParams?.start_date} to {message.data.queryParams?.end_date}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>

                {message.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-accent-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="chat-bubble-ai">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Suggested Queries */}
      {messages.length <= 1 && (
        <motion.div 
          className="p-6 border-t border-border/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-sm font-semibold text-foreground mb-3">Try asking:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestedQueries.map((query, index) => (
              <motion.button
                key={index}
                onClick={() => handleSuggestedQuery(query)}
                className="text-left p-3 rounded-lg bg-card/50 hover:bg-card border border-border/50 text-sm text-muted-foreground hover:text-foreground transition-smooth"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {query}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Input Area */}
      <motion.div 
        className="p-6 border-t border-border/50 bg-card/30 backdrop-blur-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about ocean data, ARGO floats, or specific measurements..."
              className="pr-24 bg-background/80 border-border/50 focus:border-primary transition-smooth"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }
              }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Mic className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Button 
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            className="ocean-button"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
};