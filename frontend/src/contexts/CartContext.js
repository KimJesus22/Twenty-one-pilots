import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Estado inicial del carrito
const initialState = {
  items: [],
  total: 0,
  itemCount: 0,
  isLoading: false,
  error: null
};

// Tipos de acciones
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  LOAD_CART: 'LOAD_CART'
};

// Reducer del carrito
function cartReducer(state, action) {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM: {
      const { product, quantity = 1 } = action.payload;
      const existingItem = state.items.find(item => item.product._id === product._id);

      let newItems;
      if (existingItem) {
        newItems = state.items.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newItems = [...state.items, { product, quantity }];
      }

      const total = calculateTotal(newItems);
      const itemCount = calculateItemCount(newItems);

      return {
        ...state,
        items: newItems,
        total,
        itemCount,
        error: null
      };
    }

    case CART_ACTIONS.REMOVE_ITEM: {
      const { productId } = action.payload;
      const newItems = state.items.filter(item => item.product._id !== productId);
      const total = calculateTotal(newItems);
      const itemCount = calculateItemCount(newItems);

      return {
        ...state,
        items: newItems,
        total,
        itemCount,
        error: null
      };
    }

    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { productId, quantity } = action.payload;

      if (quantity <= 0) {
        return cartReducer(state, { type: CART_ACTIONS.REMOVE_ITEM, payload: { productId } });
      }

      const newItems = state.items.map(item =>
        item.product._id === productId
          ? { ...item, quantity }
          : item
      );

      const total = calculateTotal(newItems);
      const itemCount = calculateItemCount(newItems);

      return {
        ...state,
        items: newItems,
        total,
        itemCount,
        error: null
      };
    }

    case CART_ACTIONS.CLEAR_CART:
      return {
        ...state,
        items: [],
        total: 0,
        itemCount: 0,
        error: null
      };

    case CART_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case CART_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case CART_ACTIONS.LOAD_CART: {
      const { items } = action.payload;
      const total = calculateTotal(items);
      const itemCount = calculateItemCount(items);

      return {
        ...state,
        items,
        total,
        itemCount,
        isLoading: false,
        error: null
      };
    }

    default:
      return state;
  }
}

// Funciones auxiliares
function calculateTotal(items) {
  return items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
}

function calculateItemCount(items) {
  return items.reduce((count, item) => count + item.quantity, 0);
}

// Contexto
const CartContext = createContext();

// Hook personalizado
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
}

// Provider
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart);
        dispatch({ type: CART_ACTIONS.LOAD_CART, payload: { items: cartItems } });
      } catch (error) {
        console.error('Error cargando carrito desde localStorage:', error);
      }
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  // Acciones del carrito
  const addItem = (product, quantity = 1) => {
    dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: { product, quantity } });
  };

  const removeItem = (productId) => {
    dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: { productId } });
  };

  const updateQuantity = (productId, quantity) => {
    dispatch({ type: CART_ACTIONS.UPDATE_QUANTITY, payload: { productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
  };

  const setLoading = (loading) => {
    dispatch({ type: CART_ACTIONS.SET_LOADING, payload: loading });
  };

  const setError = (error) => {
    dispatch({ type: CART_ACTIONS.SET_ERROR, payload: error });
  };

  // Validar stock antes de proceder al pago
  const validateStock = async () => {
    try {
      setLoading(true);

      // Aquí iría la validación con el backend
      // Por ahora, asumimos que el stock es válido
      for (const item of state.items) {
        if (item.quantity > item.product.stock) {
          throw new Error(`Stock insuficiente para ${item.product.name}`);
        }
      }

      return true;
    } catch (error) {
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    // Estado
    items: state.items,
    total: state.total,
    itemCount: state.itemCount,
    isLoading: state.isLoading,
    error: state.error,

    // Acciones
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    validateStock,
    setError
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}