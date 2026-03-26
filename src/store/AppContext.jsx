import { createContext, useRef, useState } from 'react';
import api from '../api/axiosInstance';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('menu');
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: 'Namaste! I am your Dynamu AI assistant. Looking for something spicy, healthy, or a chef specialty?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  const chatEndRef = useRef(null);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const handleSendChat = async () => {
    if (!userInput.trim()) return;
    const msg = userInput;
    setUserInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoadingChat(true);

    try {
      const res = await api.post('/api/ai/chat', { message: msg });
      setChatMessages(prev => [...prev, { role: 'ai', text: res.data.reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting to the kitchen. Can I help with something else?" }]);
    } finally {
      setLoadingChat(false);
    }
  };

  const MENU_CATEGORIES = ['All', 'Starter', 'Main Course', 'Bread', 'Beverage'];
  const filteredMenu = selectedCategory === 'All'
    ? menu
    : menu.filter(m => m.category === selectedCategory);

  const totalCartValue = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handlePlaceOrder = async () => {
    try {
      await api.post('/api/order', {
        table_number: 5,
        items: cart,
        total_price: totalCartValue
      });
      alert("Order sent to kitchen! 👨‍🍳");
      setCart([]);
    } catch (err) {
      alert("Failed to place order.");
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
      handleSendChat,
      MENU_CATEGORIES,
      filteredMenu,
      totalCartValue,
      handlePlaceOrder
    }}>
      {children}
    </AppContext.Provider>
  );
};
