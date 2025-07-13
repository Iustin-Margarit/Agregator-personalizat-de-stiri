'use client';

import { useState, useEffect } from 'react';
import zxcvbn from 'zxcvbn';

interface PasswordStrengthProps {
  password?: string;
  onStrengthChange?: (isStrong: boolean) => void;
}

export function PasswordStrength({ password = '', onStrengthChange }: PasswordStrengthProps) {
  const [strength, setStrength] = useState({
    score: 0,
    feedback: {
      warning: '',
      suggestions: [] as string[],
    },
  });

  useEffect(() => {
    if (password) {
      const result = zxcvbn(password);
      setStrength({
        score: result.score,
        feedback: result.feedback,
      });
      if (onStrengthChange) {
        onStrengthChange(result.score >= 2);
      }
    } else {
      setStrength({ score: 0, feedback: { warning: '', suggestions: [] } });
       if (onStrengthChange) {
        onStrengthChange(false);
      }
    }
  }, [password, onStrengthChange]);

  const
 
strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'];

  return (
    <div className="space-y-2">
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${strengthColors[strength.score]}`}
          style={{ width: `${(strength.score + 1) * 20}%` }}
        />
      </div>
      <p className="text-sm text-gray-600">
        Strength: <span className="font-semibold">{strengthLabels[strength.score]}</span>
      </p>
      {strength.feedback.warning && (
        <p className="text-xs text-red-600">{strength.feedback.warning}</p>
      )}
      {strength.feedback.suggestions.length > 0 && (
        <ul className="text-xs text-gray-500 list-disc pl-4 space-y-1">
          {strength.feedback.suggestions.map((suggestion, index) => (
            <li key={index}>{suggestion}</li>
          ))}
        </ul>
      )}
    </div>
  );
}