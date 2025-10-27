
export interface BreakActivity {
  id: string;
  category: 'Energizing' | 'Restorative';
  duration: number;
  description: string;
}

export const defaultBreakActivities: BreakActivity[] = [
  // Energizing Menu
  { id: 'energize-1', category: 'Energizing', duration: 5, description: 'Quick Walk or Simple Chore' },
  { id: 'energize-2', category: 'Energizing', duration: 5, description: 'Hydrate & Move (stretch)' },
  { id: 'energize-3', category: 'Energizing', duration: 5, description: 'Doodle or listen to a song' },
  { id: 'energize-4', category: 'Energizing', duration: 15, description: 'Go for a proper walk' },

  // Restorative Menu
  { id: 'restore-1', category: 'Restorative', duration: 5, description: 'Connect with a pet' },
  { id: 'restore-2', category: 'Restorative', duration: 5, description: 'Review your long-term goals' },
  { id: 'restore-3', category: 'Restorative', duration: 5, description: 'Stand outside or by a window' },
  { id: 'restore-4', category: 'Restorative', duration: 10, description: 'Mindful listening with eyes closed' },
  { id: 'restore-5', category: 'Restorative', duration: 20, description: 'Take a strategic nap (set an alarm)' },
];
