import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

interface CheckoutContextValue {
  paymentFile: File | null;
  txLast6: string;
  setPayment: (file: File, tx: string) => void;
  clearPayment: () => void;
}

const CheckoutContext = createContext<CheckoutContextValue | undefined>(
  undefined
);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [txLast6, setTxLast6] = useState('');

  const setPayment = useCallback((file: File, tx: string) => {
    setPaymentFile(file);
    setTxLast6(tx);
  }, []);

  const clearPayment = useCallback(() => {
    setPaymentFile(null);
    setTxLast6('');
  }, []);

  const value: CheckoutContextValue = {
    paymentFile,
    txLast6,
    setPayment,
    clearPayment,
  };

  return (
    <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>
  );
}

export function useCheckout(): CheckoutContextValue {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within CheckoutProvider');
  }
  return context;
}
