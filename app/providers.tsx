"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState, createContext, useContext, useEffect } from 'react'

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

interface UserEmailContextType {
  userEmail: string;
  setUserEmail: (email: string) => void;
  clearUserEmail: () => void;
  showEmailModal: boolean;
  handleSetEmail: (email: string) => void;
  handleChangeEmail: () => void;
}

const UserEmailContext = createContext<UserEmailContextType | undefined>(undefined);

export function UserEmailProvider({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmailState] = useState<string>('');
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') || '' : '';
    setUserEmailState(email);
    setShowEmailModal(!email);
  }, []);

  const setUserEmail = (email: string) => {
    localStorage.setItem('userEmail', email);
    setUserEmailState(email);
    setShowEmailModal(false);
  };
  const clearUserEmail = () => {
    localStorage.removeItem('userEmail');
    setUserEmailState('');
    setShowEmailModal(true);
  };
  const handleSetEmail = setUserEmail;
  const handleChangeEmail = clearUserEmail;

  // Prevent hydration error: don't render children or modal until client
  if (!isClient) return null;

  return (
    <UserEmailContext.Provider value={{ userEmail, setUserEmail, clearUserEmail, showEmailModal, handleSetEmail, handleChangeEmail }}>
      {children}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 max-w-xs w-full">
            <h2 className="text-base font-medium mb-2">กรอกอีเมลของคุณ</h2>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full px-3 py-2 border border-stone-200 rounded-xl mb-3 text-xs"
              onKeyDown={e => { if (e.key === 'Enter') handleSetEmail((e.target as HTMLInputElement).value) }}
              autoFocus
            />
            <button
              className="w-full bg-stone-800 hover:bg-stone-900 text-white rounded-xl py-2 text-xs"
              onClick={() => {
                const input = document.querySelector<HTMLInputElement>('input[type=email]')
                if (input && input.value) handleSetEmail(input.value)
              }}
            >ยืนยัน</button>
          </div>
        </div>
      )}
    </UserEmailContext.Provider>
  );
}

export function useUserEmail() {
  const context = useContext(UserEmailContext);
  if (!context) throw new Error('useUserEmail must be used within a UserEmailProvider');
  return context;
} 