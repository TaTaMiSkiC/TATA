import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

export default function LoadingSpinner({ size = "md" }: LoadingSpinnerProps) {
  const sizeClass = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  }[size];

  return (
    <div className="flex items-center justify-center">
      <Loader2 className={`${sizeClass} animate-spin text-primary`} />
    </div>
  );
}