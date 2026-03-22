import React, { useState, useEffect, useRef } from 'react'

const MENU_CATEGORIES = ['All', 'Starter', 'Main Course', 'Bread', 'Beverage'];
const TABS = ['menu', 'chat', 'cart', 'admin'];

function App() {
  const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'chat', 'cart', 'admin'
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
    const fetchMenu = () => fetch('/api/menu').then(res => res.json()).then(data => setMenu(data));
    const fetchOrders = () => fetch('/api/orders').then(res => res.json()).then(data => setOrders(data));

    fetchMenu();
    const interval = setInterval(fetchOrders, 5000); // Poll for new orders
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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

  const filteredMenu = selectedCategory === 'All'
    ? menu
    : menu.filter(m => m.category === selectedCategory);

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
        setActiveTab('menu');
      }
    } catch (err) {
      alert("Failed to place order.");
    }
  };

  const totalCartValue = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-slate-950 text-white font-sans overflow-hidden">

      {/* Header */}
      <header className="p-6 flex justify-between items-center bg-white/5 backdrop-blur-md border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Dynamu Smart Menu
          </h1>
          <p className="text-xs text-slate-400">Table 05 • Royal Cafe</p>
        </div>
        <div className="relative" onClick={() => setActiveTab('cart')}>
          <span className="text-2xl cursor-pointer">🛒</span>
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-secondary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {cart.reduce((a, b) => a + b.qty, 0)}
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">

        {activeTab === 'menu' && (
          <div className="page-transition space-y-6">
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {MENU_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-slate-400'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu Items */}
            <div className="grid grid-cols-1 gap-4">
              {filteredMenu.map(item => (
                <div key={item.id} className="glass p-4 flex gap-4 items-center group">
                  <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center text-3xl shrink-0">
                    {item.is_veg ? '🥗' : '🍗'}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg">{item.name}</h3>
                      <p className="text-accent font-bold">₹{item.price}</p>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2 mt-1">{item.description}</p>
                    <button
                      onClick={() => addToCart(item)}
                      className="mt-3 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
                    >
                      + Quick Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="page-transition flex flex-col h-full">
            <div className="flex-1 space-y-4 mb-4">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-3xl ${m.role === 'user'
                    ? 'bg-primary rounded-tr-none'
                    : 'bg-white/10 backdrop-blur-md rounded-tl-none border border-white/10'
                    }`}>
                    <p className="text-sm">{m.text}</p>
                  </div>
                </div>
              ))}
              {loadingChat && (
                <div className="flex justify-start">
                  <div className="bg-white/10 p-4 rounded-3xl rounded-tl-none animate-pulse text-xs">AI is typing...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>
        )}

        {activeTab === 'cart' && (
          <div className="page-transition space-y-6">
            <h2 className="text-xl font-bold">Your Order</h2>
            {cart.length === 0 ? (
              <p className="text-slate-400">Your cart is empty. Talk to AI for suggestions!</p>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center glass p-4">
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-xs text-slate-400">₹{item.price} x {item.qty}</p>
                    </div>
                    <div className="font-bold">₹{item.price * item.qty}</div>
                  </div>
                ))}
                <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xl font-bold">
                  <span>Grand Total</span>
                  <span className="text-accent">₹{totalCartValue}</span>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  className="w-full py-4 bg-gradient-to-r from-primary to-secondary rounded-2xl font-bold shadow-xl shadow-primary/20 transform active:scale-95 transition-transform"
                >
                  Place Order Now
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="page-transition space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-secondary">Kitchen Display</h2>
              <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] animate-pulse">Live</span>
            </div>
            {orders.length === 0 ? (
              <p className="text-slate-400">Waiting for first order...</p>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="glass border-l-4 border-secondary p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-bold">Table {order.table_number}</span>
                      <span className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-sm space-y-1">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{it.qty}x {it.name}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 flex justify-between items-center">
                      <span className="text-secondary font-bold">₹{order.total_price}</span>
                      <button className="bg-white/10 px-3 py-1 rounded-lg text-xs">Mark Done</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Chat Input (only visible when in chat tab) */}
      {activeTab === 'chat' && (
        <div className="p-4 bg-slate-950 border-t border-white/10 absolute bottom-[80px] left-0 right-0 max-w-md mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder="Ask for suggestions..."
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
            />
            <button
              onClick={handleSendChat}
              className="bg-primary p-3 rounded-2xl"
            >
              🚀
            </button>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-4 left-4 right-4 max-w-[400px] mx-auto h-16 glass flex justify-around items-center p-2 z-50">
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'menu' ? 'text-white scale-110' : 'text-slate-400'}`}
        >
          <span className="text-xl">📖</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Menu</span>
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'chat' ? 'text-white scale-110' : 'text-slate-400'}`}
        >
          <div className="relative">
            <span className="text-xl">🤖</span>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">AI Hub</span>
        </button>
        <button
          onClick={() => setActiveTab('cart')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'cart' ? 'text-white scale-110' : 'text-slate-400'}`}
        >
          <span className="text-xl">🛍️</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Cart</span>
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'admin' ? 'text-white scale-110' : 'text-slate-400'}`}
        >
          <span className="text-xl">👩‍🍳</span>
          <span className="text-[10px] font-bold uppercase tracking-widest">Admin</span>
        </button>
      </nav>

    </div>
  )
}

export default App
