'use client';
import { Button } from '@/components/ui/Button';

export default function ScrollButton() {
  return (
    <Button
      size="lg"
      fullWidth
      className="mb-4 max-w-xs mx-auto"
      onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
    >
      See How It Works →
    </Button>
  );
}
