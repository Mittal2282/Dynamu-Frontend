import { createContext, useRef, useState, useEffect } from 'react';
import api from '../api/axiosInstance';

export const AppContext = createContext();

const CART_KEY = 'dynamu_main_cart';

export const AppProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('menu');
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderingCart, setOrderingCart] = useState(false);

  // Restore cart from localStorage on mount
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: 'Namaste! I am your Dynamu AI assistant. Looking for something spicy, healthy, or a chef specialty?', items: [] }
  ]);
  const [userInput, setUserInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  const chatEndRef = useRef(null);

  // Persist cart to localStorage + sync to API on every change
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {}
    api.put('/api/customer/cart', { items: cart }).catch(() => {});
  }, [cart]);

  // Load cart from API on mount if session exists
  useEffect(() => {
    const token = localStorage.getItem('session_token');
    if (!token) return;

    api.get('/api/customer/cart')
      .then((res) => {
        const apiItems = res.data?.data?.items;
        if (Array.isArray(apiItems) && apiItems.length > 0) {
          const cartArray = apiItems.map(item => ({
            id: item.menu_item._id,
            name: item.menu_item.name,
            price: item.menu_item.price,
            is_veg: item.menu_item.is_veg,
            qty: item.quantity,
          }));
          setCart(cartArray);
        }
      })
      .catch(() => {});
  }, []);

  // Load conversation history on mount (or welcome message if no history)
  useEffect(() => {
    const token = localStorage.getItem('session_token');
    if (!token) return;

    api.get('/api/ai/chat/history')
      .then(res => {
        const history = res.data?.data;
        if (Array.isArray(history) && history.length > 0) {
          setChatMessages(history.map(m => ({
            role: m.role === 'user' ? 'user' : 'ai',
            text: m.content,
            items: [],
          })));
        } else {
          return api.get('/api/ai/chat/welcome');
        }
      })
      .then(res => {
        if (!res) return;
        const welcome = res.data?.data?.message;
        if (welcome) setChatMessages([{ role: 'ai', text: welcome, items: [] }]);
      })
      .catch(() => {}); // Keep default seed message on failure
  }, []);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (!existing) return prev;
      if (existing.qty <= 1) return prev.filter(i => i.id !== item.id);
      return prev.map(i => i.id === item.id ? { ...i, qty: i.qty - 1 } : i);
    });
  };

  /**
   * Send a chat message.
   * @param {string} [overrideMessage] - If provided, sends this text directly (e.g. from chips).
   *   This avoids the React state-race that occurs when setting userInput and immediately reading it.
   */
  const handleSendChat = async (overrideMessage) => {
    const msg = overrideMessage ?? userInput;
    if (!msg.trim()) return;
    if (!overrideMessage) setUserInput('');

    setChatMessages(prev => [...prev, { role: 'user', text: msg, items: [] }]);
    setLoadingChat(true);

    try {
      const res = await api.post('/api/ai/chat', { message: msg });
      const { reply, recommended_items } = res.data.data;
      setChatMessages(prev => [...prev, {
        role: 'ai',
        text: reply,
        items: recommended_items || [],
      }]);
    } catch {
      setChatMessages(prev => [...prev, {
        role: 'ai',
        text: "I'm having trouble connecting to the kitchen. Can I help with something else?",
        items: [],
      }]);
    } finally {
      setLoadingChat(false);
    }
  };

  const MENU_CATEGORIES = ['All', 'Starter', 'Main Course', 'Bread', 'Beverage'];
  const filteredMenu = selectedCategory === 'All'
    ? menu
    : menu.filter(m => m.category === selectedCategory);

  const totalCartValue = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalCartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const handlePlaceOrder = async () => {
    if (orderingCart) return;
    setOrderingCart(true);
    try {
      await api.post('/api/order', {
        table_number: 5,
        items: cart,
        total_price: totalCartValue
      });
      setCart([]);
      localStorage.removeItem(CART_KEY);
      api.put('/api/customer/cart', { items: [] }).catch(() => {});
      setIsCartOpen(false);
      alert("Order sent to kitchen! 👨‍🍳");
    } catch {
      alert("Failed to place order.");
    } finally {
      setOrderingCart(false);
    }
  };

  return (
    <AppContext.Provider value={{
      activeTab, setActiveTab,
      menu, setMenu,
      orders, setOrders,
      selectedCategory, setSelectedCategory,
      cart, setCart,
      chatMessages, setChatMessages,
      userInput, setUserInput,
      loadingChat, setLoadingChat,
      chatEndRef,
      addToCart,
      removeFromCart,
      handleSendChat,
      MENU_CATEGORIES,
      filteredMenu,
      totalCartValue,
      totalCartCount,
      handlePlaceOrder,
      orderingCart,
      isCartOpen,
      setIsCartOpen,
    }}>
      {children}
    </AppContext.Provider>
  );
};
