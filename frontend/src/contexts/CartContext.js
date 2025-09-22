import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
}

export function CartProvider({ children }) {
  const [itemCount, setItemCount] = useState(0);

  const value = {
    itemCount,
    addItem: () => setItemCount(prev => prev + 1),
    removeItem: () => setItemCount(prev => Math.max(0, prev - 1)),
    clearCart: () => setItemCount(0)
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}