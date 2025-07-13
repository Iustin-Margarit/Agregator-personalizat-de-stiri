"use client";

import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ColoredAvatarProps {
  username?: string | null;
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-16 w-16 text-lg",
  xl: "h-32 w-32 text-4xl"
};

export function ColoredAvatar({ 
  username, 
  color = "#3B82F6", 
  size = "md", 
  className 
}: ColoredAvatarProps) {
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback 
        style={{ backgroundColor: color }}
        className="text-white font-semibold"
      >
        {getInitials(username)}
      </AvatarFallback>
    </Avatar>
  );
}