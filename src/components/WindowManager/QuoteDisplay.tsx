import React, { useState, useEffect } from 'react';

const QUOTES = [
  "One idea away from greatness… or chaos.",
  "If your characters behave, you're doing it wrong.",
  "Warning: Ideas may explode.",
  "Scribble first, explain later.",
  "Every masterpiece starts as a mess.",
  "Loading… Summoning creativity gremlins.",
  "Please wait… your plot is thickening.",
  "Fetching character drama…",
  "Add a scene. Any scene. Even a dramatic sandwich moment.",
  "This space is waiting for greatness. No pressure.",
  "Brainstorming… please stand back for safety reasons.",
  "This story has big 'trust me it'll make sense later' energy.",
  "Give your character flaws. The bigger the train wreck, the better.",
  "If your character is happy, don't worry. We'll fix that.",
  "Every character needs a weird hobby. Trust me.",
  "A plot hole? No— that's a mystery."
];

interface QuoteDisplayProps {
  className?: string;
}

const QuoteDisplay: React.FC<QuoteDisplayProps> = ({ className = '' }) => {
  const [currentQuote, setCurrentQuote] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Select a random quote
    const randomIndex = Math.floor(Math.random() * QUOTES.length);
    const selectedQuote = QUOTES[randomIndex];
    
    // Set the quote
    setCurrentQuote(selectedQuote);
    
    // Fade in animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`flex items-center justify-center min-h-screen ${className}`}>
      <div className="text-center max-w-2xl mx-auto px-8">
        <blockquote 
          className={`text-2xl md:text-3xl lg:text-4xl font-serif italic text-gray-600 dark:text-gray-300 leading-relaxed transition-all duration-1000 ease-in-out ${
            isVisible 
              ? 'opacity-100 transform translate-y-0' 
              : 'opacity-0 transform translate-y-4'
          }`}
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          "{currentQuote}"
        </blockquote>
        
        {/* Decorative elements */}
        <div className="mt-8 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
        
        {/* Subtle hint */}
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 font-light">
          Open a window to begin your story
        </p>
      </div>
    </div>
  );
};

export default QuoteDisplay;
