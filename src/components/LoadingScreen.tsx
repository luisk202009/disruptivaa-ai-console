import { useEffect, useState } from "react";
import logo from "@/assets/logo-disruptivaa.png";

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 300);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8">
        <img 
          src={logo} 
          alt="Disruptivaa" 
          className="h-12 md:h-16 logo-pulse"
        />
        
        <div className="flex flex-col items-center gap-3">
          <div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-100 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-muted-foreground text-sm font-medium">
            Inicializando agentes AI...
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
