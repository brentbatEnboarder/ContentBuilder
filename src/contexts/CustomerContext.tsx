import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export interface Customer {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface CustomerContextType {
  customers: Customer[];
  currentCustomer: Customer | null;
  loading: boolean;
  error: string | null;
  selectCustomer: (customer: Customer) => void;
  clearCustomer: () => void;
  createCustomer: (name: string) => Promise<Customer | null>;
  refreshCustomers: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const CUSTOMER_STORAGE_KEY = 'contentbuilder_current_customer';

export function CustomerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch customers from Supabase
  const refreshCustomers = useCallback(async () => {
    if (!user) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (fetchError) {
        console.error('Error fetching customers:', fetchError);
        setError(fetchError.message);
        setCustomers([]);
      } else {
        setCustomers(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching customers:', err);
      setError('Failed to load customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load customers when user changes
  useEffect(() => {
    if (user) {
      refreshCustomers();
    } else {
      // User logged out - clear everything including sessionStorage
      setCustomers([]);
      setCurrentCustomer(null);
      sessionStorage.removeItem(CUSTOMER_STORAGE_KEY);
      setLoading(false);
    }
  }, [user, refreshCustomers]);

  // Restore customer from session storage on mount (after customers load)
  useEffect(() => {
    if (customers.length > 0 && !currentCustomer) {
      const stored = sessionStorage.getItem(CUSTOMER_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const found = customers.find(c => c.id === parsed.id);
          if (found) {
            setCurrentCustomer(found);
          } else {
            // Customer no longer exists, clear storage
            sessionStorage.removeItem(CUSTOMER_STORAGE_KEY);
          }
        } catch {
          sessionStorage.removeItem(CUSTOMER_STORAGE_KEY);
        }
      }
    }
  }, [customers, currentCustomer]);

  // Select a customer and persist to session storage
  const selectCustomer = useCallback((customer: Customer) => {
    setCurrentCustomer(customer);
    sessionStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customer));
  }, []);

  // Clear customer selection (called on logout)
  const clearCustomer = useCallback(() => {
    setCurrentCustomer(null);
    sessionStorage.removeItem(CUSTOMER_STORAGE_KEY);
  }, []);

  // Create a new customer
  const createCustomer = useCallback(async (name: string): Promise<Customer | null> => {
    if (!user) {
      setError('You must be logged in to create a customer');
      return null;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Customer name cannot be empty');
      return null;
    }

    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('customers')
        .insert({ name: trimmedName, created_by: user.id })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating customer:', insertError);
        setError(insertError.message);
        return null;
      }

      // Refresh the customer list
      await refreshCustomers();
      return data;
    } catch (err) {
      console.error('Unexpected error creating customer:', err);
      setError('Failed to create customer');
      return null;
    }
  }, [user, refreshCustomers]);

  return (
    <CustomerContext.Provider
      value={{
        customers,
        currentCustomer,
        loading,
        error,
        selectCustomer,
        clearCustomer,
        createCustomer,
        refreshCustomers,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}
