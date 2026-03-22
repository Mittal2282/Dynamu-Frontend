import { createContext, useEffect, useRef, useState } from 'react';

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

  useEffect(() => {
    const fetchMenu = () => fetch('/api/menu').then(res => res.json()).then(data => setMenu(data)).catch(() => setMenu([]));
    const fetchOrders = () => fetch('/api/orders').then(res => res.json()).then(data => setOrders(data)).catch(() => setOrders([]));

    fetchMenu();
    const interval = setInterval(fetchOrders, 5000); 
    return () => clearInterval(interval);
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

  const handleSendChat = async () => {
    if (!userInput.trim()) return;
    const msg = userInput;
    setUserInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoadingChat(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
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
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_number: 5,
          items: cart,
          total_price: totalCartValue
        })
      });
      if (res.ok) {
        alert("Order sent to kitchen! 👨‍🍳");
        setCart([]);
      }
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
