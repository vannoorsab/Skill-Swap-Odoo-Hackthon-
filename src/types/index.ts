export interface User {
  uid: string;
  name: string;
  email: string;
  location?: string;
  photoURL?: string;
  skillsOffered: string[];
  skillsWanted: string[];
  availability: string[];
  isPublic: boolean;
  rating?: number;
  reviewCount?: number;
  createdAt: Date;
}

export interface SwapRequest {
  id: string;
  fromUid: string;
  toUid: string;
  fromUser: {
    name: string;
    photoURL?: string;
  };
  toUser: {
    name: string;
    photoURL?: string;
  };
  fromSkill: string;
  toSkill: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface Feedback {
  id: string;
  fromUid: string;
  toUid: string;
  requestId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  googleSignIn: () => Promise<void>; // add this
}