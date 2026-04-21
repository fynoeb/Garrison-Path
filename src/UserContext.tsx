/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserProfile, UserRole } from './types';

interface UserContextType {
  user: UserProfile | null;
  role: UserRole;
  switchRole: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const MOCK_DRIVER: UserProfile = {
  id: 'user-123',
  name: 'Alex Garrison',
  email: 'alex@garrison.com',
  role: 'driver',
  avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop',
  phone: '+62 812 3456 7890',
  vehicle: {
    brand: 'Shelby',
    series: 'GT500 (Legacy)'
  }
};

const MOCK_WORKSHOP: UserProfile = {
  id: 'workshop-123',
  name: 'Arthur Lee',
  email: 'arthur@padanggarage.id',
  role: 'workshop',
  workshopName: 'Padang High-Performance Garage',
  avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop',
  phone: '+62 811 9988 7766'
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile>(MOCK_DRIVER);

  const switchRole = () => {
    setUser(prev => prev.role === 'driver' ? MOCK_WORKSHOP : MOCK_DRIVER);
  };

  const updateProfile = (profile: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...profile } : null);
  };

  return (
    <UserContext.Provider value={{ user, role: user.role, switchRole, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
