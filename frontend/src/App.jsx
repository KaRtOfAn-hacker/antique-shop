import React, { createContext, useState, useEffect, useContext } from 'react'
import { Routes, Route, Link, useNavigate, Navigate, useParams } from 'react-router-dom'
import { ShoppingCart, User as UserIcon, LogOut, Package, ClipboardList, Menu, X, Hammer, Search, ArrowLeft, ShieldCheck } from 'lucide-react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

// --- Contexts ---
const AuthContext = createContext();
const CartContext = createContext();

export const useAuth = () => useContext(AuthContext);
export const useCart = () => useContext(CartContext);

// --- API ---
const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.authorization = `Bearer ${token}`;
  return config;
});

// --- Components ---
const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-antique-brown text-antique-cream sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Package className="w-8 h-8 text-antique-gold" />
            <span className="font-serif text-2xl font-bold tracking-tight">АНТИКВАРНА ЛАВКА</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="hover:text-antique-gold transition-colors">Каталог</Link>
            {user && (
              <Link to="/requests" className="hover:text-antique-gold transition-colors">Мої Заявки</Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link to="/admin" className="hover:text-antique-gold transition-colors font-bold text-antique-gold">Адмін Панель</Link>
            )}
            <Link to="/cart" className="relative hover:text-antique-gold transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-antique-gold text-antique-dark text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {cart.length}
                </span>
              )}
            </Link>
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm border-r border-antique-cream/20 pr-4 italic">{user.name}</span>
                <button onClick={logout} className="hover:text-antique-gold transition-colors"><LogOut className="w-5 h-5" /></button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center space-x-1 hover:text-antique-gold transition-colors">
                <UserIcon className="w-5 h-5" />
                <span>Увійти</span>
              </Link>
            )}
          </div>

          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-antique-dark px-4 py-4 space-y-4">
          <Link to="/" className="block" onClick={() => setIsOpen(false)}>Каталог</Link>
          <Link to="/requests" className="block" onClick={() => setIsOpen(false)}>Заявки</Link>
          <Link to="/cart" className="block" onClick={() => setIsOpen(false)}>Кошик ({cart.length})</Link>
          {!user ? (
            <Link to="/login" className="block" onClick={() => setIsOpen(false)}>Увійти</Link>
          ) : (
            <button onClick={() => { logout(); setIsOpen(false); }} className="block w-full text-left">Вийти</button>
          )}
        </div>
      )}
    </nav>
  );
};

// --- Pages ---
const Home = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Всі');
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/products').then(res => setProducts(res.data));
  }, []);

  const categories = ['Всі', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Всі' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <header className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl font-serif mb-6 text-antique-dark tracking-tight"
        >
          Скарби минулого
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-antique-brown/70 italic max-w-2xl mx-auto text-lg"
        >
          Ми збираємо унікальні предмети антикваріату з усього світу та даруємо їм нове життя.
        </motion.p>
      </header>

      {/* Filters & Search */}
      <div className="mb-12 flex flex-col md:flex-row gap-8 items-center justify-between">
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-full border transition-all duration-300 ${
                selectedCategory === cat 
                ? 'bg-antique-brown text-antique-cream border-antique-brown shadow-lg scale-105' 
                : 'border-antique-brown/20 text-antique-brown hover:border-antique-brown/50 hover:bg-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-antique-brown/40 group-focus-within:text-antique-gold transition-colors" />
          <input
            type="text"
            placeholder="Пошук скарбів..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-antique-brown/10 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-antique-gold/30 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Products Grid */}
      <motion.div 
        layout
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
      >
        <AnimatePresence mode="popLayout">
          {filteredProducts.map(product => (
            <motion.div 
              layout
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -10 }}
              transition={{ duration: 0.3 }}
              className="antique-card overflow-hidden group flex flex-col h-full bg-white shadow-xl border-0"
            >
              <div 
                className="h-72 overflow-hidden relative cursor-pointer"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <motion.img 
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-antique-dark/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <span className="px-3 py-1 bg-antique-gold text-antique-dark text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                    {product.category}
                  </span>
                  {product.year && (
                    <span className="px-3 py-1 bg-antique-dark/80 text-antique-cream text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                      {product.year}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <h3 
                  className="text-2xl font-serif mb-3 text-antique-dark group-hover:text-antique-accent transition-colors cursor-pointer"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  {product.name}
                </h3>
                <p className="text-antique-brown/60 text-sm mb-6 line-clamp-3 leading-relaxed">{product.description}</p>
                <div className="mt-auto flex justify-between items-center pt-6 border-t border-antique-brown/5">
                  <span className="text-2xl font-bold font-serif text-antique-brown">{product.price.toLocaleString()} ₴</span>
                  <button 
                    onClick={() => addToCart(product)} 
                    className="btn-primary flex items-center space-x-2 text-sm px-6 py-3 rounded-xl shadow-lg hover:shadow-antique-gold/20 active:scale-95 transition-all"
                  >
                    <span>У кошик</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredProducts.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24"
        >
          <div className="inline-block p-8 rounded-full bg-antique-brown/5 mb-6">
            <Search className="w-12 h-12 text-antique-brown/20" />
          </div>
          <h3 className="text-2xl font-serif text-antique-dark mb-2">Нічого не знайдено</h3>
          <p className="text-antique-brown/50 italic">Спробуйте змінити умови пошуку або обрати іншу категорію.</p>
        </motion.div>
      )}

      {/* Restoration Section */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-32 relative overflow-hidden bg-antique-dark text-antique-cream p-12 md:p-20 rounded-[2.5rem] shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-antique-gold/10 blur-[100px] rounded-full -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="max-w-2xl text-center lg:text-left">
            <h2 className="text-5xl font-serif mb-6 flex items-center justify-center lg:justify-start gap-4">
              <Hammer className="text-antique-gold w-12 h-12" /> Майстерня Реставрації
            </h2>
            <p className="text-xl opacity-70 mb-10 leading-relaxed italic">
              Кожна тріщина має свою історію. Наші майстри дбайливо відновлюють дух минулих епох, зберігаючи автентичність ваших сімейних реліквій.
            </p>
            <Link to="/new-request" className="inline-block px-10 py-4 bg-antique-gold text-antique-dark font-bold rounded-2xl hover:bg-white transition-all duration-300 shadow-xl transform hover:-translate-y-1">
              Створити заявку на реставрацію
            </Link>
          </div>
          <div className="hidden lg:flex items-center justify-center">
             <div className="w-64 h-64 border-[1px] border-antique-gold/30 rounded-full flex items-center justify-center rotate-12 relative">
                <div className="absolute inset-4 border-[1px] border-antique-gold/20 rounded-full animate-pulse" />
                <span className="font-serif italic text-3xl text-antique-gold">Established 1924</span>
             </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(res => {
        setProduct(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-antique-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <h2 className="text-3xl font-serif mb-4">Предмет не знайдено</h2>
      <button onClick={() => navigate('/')} className="btn-primary">Повернутися до каталогу</button>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 py-12"
    >
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center space-x-2 text-antique-brown/60 hover:text-antique-brown mb-12 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-serif italic text-lg">Назад до скарбів</span>
      </button>

      <div className="grid lg:grid-cols-2 gap-16 items-start">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-antique-brown/5 rounded-[2.5rem] -rotate-3 group-hover:rotate-0 transition-transform duration-500" />
          <img 
            src={product.image} 
            alt={product.name} 
            className="relative z-10 w-full h-[600px] object-cover rounded-[2.5rem] shadow-2xl" 
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col h-full pt-4"
        >
          <div className="flex items-center space-x-4 mb-6">
            <span className="px-4 py-1 bg-antique-brown/5 text-antique-brown text-xs font-bold uppercase tracking-widest rounded-full">
              {product.category}
            </span>
            {product.year && (
              <span className="px-4 py-1 bg-antique-dark text-antique-cream text-xs font-bold uppercase tracking-widest rounded-full">
                Рік: {product.year}
              </span>
            )}
            <span className="flex items-center space-x-1 text-antique-gold text-xs font-bold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" />
              <span>Автентичність гарантована</span>
            </span>
          </div>

          <h1 className="text-5xl font-serif mb-6 text-antique-dark leading-tight">{product.name}</h1>
          
          <div className="mb-8 p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-antique-brown/5">
            <p className="text-antique-brown/80 text-lg leading-relaxed italic">
              {product.description}
            </p>
          </div>

          <div className="mt-auto space-y-8">
            <div className="flex items-baseline space-x-4">
              <span className="text-4xl font-bold font-serif text-antique-brown">
                {product.price.toLocaleString()} ₴
              </span>
              <span className="text-antique-brown/40 line-through text-xl italic">
                {(product.price * 1.2).toLocaleString()} ₴
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => addToCart(product)}
                className="flex-1 btn-primary py-5 text-xl font-serif rounded-2xl shadow-xl shadow-antique-brown/20 hover:shadow-antique-brown/30 active:scale-95 transition-all"
              >
                Додати в колекцію
              </button>
              <button className="flex-1 btn-outline py-5 text-xl font-serif rounded-2xl border-2 hover:bg-antique-brown hover:text-white transition-all">
                Запитати про предмет
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-antique-brown/10">
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-antique-brown/40 mb-1">Доставка</p>
                <p className="font-bold text-sm">Спеціальна упаковка</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-antique-brown/40 mb-1">Сертифікат</p>
                <p className="font-bold text-sm">Паспорт предмета</p>
              </div>
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-antique-brown/40 mb-1">Огляд</p>
                <p className="font-bold text-sm">Відео-дзвінок</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const Login = () => {
  const [isReg, setIsReg] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isReg) await register(formData);
      else await login(formData.email, formData.password);
      navigate('/');
    } catch (err) {
      alert('Помилка авторизації. Перевірте дані.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 antique-card bg-white">
      <h2 className="text-3xl font-serif mb-8 text-center">{isReg ? 'Реєстрація' : 'Вхід'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isReg && (
          <div>
            <label className="block text-sm mb-1">Ім'я</label>
            <input type="text" className="input-field" required onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
        )}
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input type="email" className="input-field" required onChange={e => setFormData({...formData, email: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm mb-1">Пароль</label>
          <input type="password" className="input-field" required onChange={e => setFormData({...formData, password: e.target.value})} />
        </div>
        <button type="submit" className="w-full btn-primary py-3 mt-4 text-lg font-serif">
          {isReg ? 'Створити акаунт' : 'Увійти'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-antique-brown/60">
        {isReg ? 'Вже маєте акаунт?' : 'Ще не з нами?'}
        <button onClick={() => setIsReg(!isReg)} className="ml-2 text-antique-gold font-bold hover:underline">
          {isReg ? 'Увійти' : 'Зареєструватися'}
        </button>
      </p>
    </div>
  );
};

const NewRequest = () => {
  const [formData, setFormData] = useState({ type: 'REPAIR', description: '' });
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/requests', formData);
    navigate('/requests');
  };

  return (
    <div className="max-w-2xl mx-auto mt-16 p-8 antique-card">
      <h2 className="text-3xl font-serif mb-6">Нова заявка</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm mb-2">Тип запиту</label>
          <select className="input-field" onChange={e => setFormData({...formData, type: e.target.value})}>
            <option value="REPAIR">Реставрація</option>
            <option value="APPRAISAL">Оцінка антикваріату</option>
            <option value="BUY">Викуп магазином</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-2">Детальний опис предмета та ваші побажання</label>
          <textarea rows="5" className="input-field" required onChange={e => setFormData({...formData, description: e.target.value})} />
        </div>
        <button type="submit" className="btn-primary w-full py-3 font-serif text-lg">Надіслати на розгляд</button>
      </form>
    </div>
  );
};

const UserRequests = () => {
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('requests');

  useEffect(() => {
    api.get('/requests').then(res => setRequests(res.data));
    api.get('/orders').then(res => setOrders(res.data));
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-50';
      case 'PROCESSING': return 'text-blue-600 bg-blue-50';
      case 'COMPLETED': return 'text-green-600 bg-green-50';
      case 'SHIPPED': return 'text-purple-600 bg-purple-50';
      case 'DELIVERED': return 'text-emerald-600 bg-emerald-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-serif">Мій Кабінет</h2>
        <div className="flex bg-antique-brown/5 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-md transition-all text-sm ${activeTab === 'requests' ? 'bg-antique-brown text-antique-cream' : 'text-antique-brown'}`}
          >
            Звернення
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-md transition-all text-sm ${activeTab === 'orders' ? 'bg-antique-brown text-antique-cream' : 'text-antique-brown'}`}
          >
            Замовлення
          </button>
        </div>
      </div>

      {activeTab === 'requests' ? (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-12 antique-card italic opacity-60">У вас поки немає активних заявок.</div>
          ) : (
            requests.map(req => (
              <div key={req.id} className="antique-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(req.status)}`}>{req.status}</span>
                    <span className="text-xs text-antique-brown/40">{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-lg">{req.type === 'REPAIR' ? '🛠 Реставрація' : req.type === 'APPRAISAL' ? '📜 Оцінка' : '💰 Продаж'}</h4>
                  <p className="text-sm opacity-70 mt-1">{req.description}</p>
                  {req.adminComment && (
                    <div className="mt-4 p-4 bg-antique-gold/10 border-l-4 border-antique-gold rounded-r-lg">
                      <p className="text-xs uppercase font-bold text-antique-brown/60 mb-1">Відповідь майстра:</p>
                      <p className="text-sm text-antique-brown italic">"{req.adminComment}"</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 antique-card italic opacity-60">Ви ще не робили замовлень.</div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="antique-card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>{order.status}</span>
                      <span className="text-sm font-bold">Замовлення #{order.id}</span>
                    </div>
                    <span className="text-xs text-antique-brown/40">{new Date(order.createdAt).toLocaleString()}</span>
                  </div>
                  <span className="text-xl font-bold font-serif">{order.total.toLocaleString()} ₴</span>
                </div>
                <div className="space-y-2 mb-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm items-center py-1 border-b border-antique-brown/5">
                      <div className="flex items-center gap-2">
                        <img src={item.product.image} className="w-8 h-8 object-cover rounded" />
                        <span>{item.product.name}</span>
                      </div>
                      <span className="opacity-60">{item.price.toLocaleString()} ₴</span>
                    </div>
                  ))}
                </div>
                {order.adminComment && (
                  <div className="p-3 bg-antique-brown/5 rounded-lg border-l-2 border-antique-brown italic text-sm">
                    {order.adminComment}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const AdminPanel = () => {
  const [tab, setTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', category: '', image: '', year: '' });
  const { user } = useAuth();
  
  if (user?.role !== 'ADMIN') return <Navigate to="/" />;

  useEffect(() => {
    if (tab === 'requests') {
      api.get('/requests').then(res => setRequests(res.data));
    } else if (tab === 'products') {
      api.get('/products').then(res => setProducts(res.data));
    } else if (tab === 'orders') {
      api.get('/orders').then(res => setOrders(res.data));
    }
  }, [tab]);

  const updateStatus = async (id, status, adminComment) => {
    await api.patch(`/requests/${id}`, { status, adminComment });
    setRequests(requests.map(r => r.id === id ? {...r, status, adminComment} : r));
  };

  const updateOrderStatus = async (id, status, adminComment) => {
    await api.patch(`/orders/${id}`, { status, adminComment });
    setOrders(orders.map(o => o.id === id ? {...o, status, adminComment} : o));
  };

  const handleCommentChange = (id, value) => {
    setRequests(requests.map(r => r.id === id ? {...r, adminComment: value} : r));
  };

  const handleOrderCommentChange = (id, value) => {
    setOrders(orders.map(o => o.id === id ? {...o, adminComment: value} : o));
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (editingProduct) {
      const res = await api.patch(`/products/${editingProduct.id}`, productForm);
      setProducts(products.map(p => p.id === editingProduct.id ? res.data : p));
      setEditingProduct(null);
    } else {
      const res = await api.post('/products', productForm);
      setProducts([...products, res.data]);
    }
    setProductForm({ name: '', description: '', price: '', category: '', image: '', year: '' });
  };

  const startEdit = (p) => {
    setEditingProduct(p);
    setProductForm({ name: p.name, description: p.description, price: p.price, category: p.category, image: p.image, year: p.year || '' });
  };

  const deleteProduct = async (id) => {
    if (confirm('Ви впевнені, що хочете видалити цей товар?')) {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div className="max-w-6xl mx-auto mt-12 px-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-antique-brown/20 pb-4 gap-4">
        <h2 className="text-4xl font-serif">Адмін Панель</h2>
        <div className="flex bg-antique-brown/5 p-1 rounded-lg">
          <button 
            onClick={() => setTab('requests')}
            className={`px-6 py-2 rounded-md transition-all ${tab === 'requests' ? 'bg-antique-brown text-antique-cream shadow-md' : 'text-antique-brown hover:bg-antique-brown/10'}`}
          >
            Заявки
          </button>
          <button 
            onClick={() => setTab('products')}
            className={`px-6 py-2 rounded-md transition-all ${tab === 'products' ? 'bg-antique-brown text-antique-cream shadow-md' : 'text-antique-brown hover:bg-antique-brown/10'}`}
          >
            Товари
          </button>
          <button 
            onClick={() => setTab('orders')}
            className={`px-6 py-2 rounded-md transition-all ${tab === 'orders' ? 'bg-antique-brown text-antique-cream shadow-md' : 'text-antique-brown hover:bg-antique-brown/10'}`}
          >
            Замовлення
          </button>
        </div>
      </div>

      {tab === 'requests' ? (
        <div className="grid gap-6">
          {requests.map(req => (
            <div key={req.id} className="antique-card p-6 border-l-4 border-antique-gold">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <span className="font-serif font-bold text-antique-brown">#{req.id}</span>
                    <span className="text-sm px-2 py-1 bg-antique-brown/5 text-antique-brown rounded">{req.type}</span>
                    <span className="text-xs italic opacity-40">{new Date(req.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="mb-4">
                    <p className="text-xs uppercase tracking-wider opacity-40 mb-1">Клієнт</p>
                    <p className="font-bold">{req.user?.name} ({req.user?.email})</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-40 mb-1">Опис запиту</p>
                    <p className="italic text-antique-brown/80">"{req.description}"</p>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-wider opacity-40 mb-1">Повідомлення клієнту</p>
                    <textarea 
                      className="input-field text-sm" 
                      rows="2" 
                      placeholder="Напишіть відповідь або інструкції..."
                      value={req.adminComment || ''}
                      onChange={(e) => handleCommentChange(req.id, e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-center gap-2">
                  <p className="text-xs font-bold uppercase mb-2">Змінити статус:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => updateStatus(req.id, 'PROCESSING', req.adminComment)} className={`px-4 py-2 text-xs rounded transition-all ${req.status === 'PROCESSING' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>В роботі</button>
                    <button onClick={() => updateStatus(req.id, 'COMPLETED', req.adminComment)} className={`px-4 py-2 text-xs rounded transition-all ${req.status === 'COMPLETED' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>Завершено</button>
                    <button onClick={() => updateStatus(req.id, 'REJECTED', req.adminComment)} className={`px-4 py-2 text-xs rounded transition-all ${req.status === 'REJECTED' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>Відхилити</button>
                    <button onClick={() => updateStatus(req.id, 'PENDING', req.adminComment)} className={`px-4 py-2 text-xs rounded transition-all ${req.status === 'PENDING' ? 'bg-yellow-600 text-white' : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'}`}>Очікує</button>
                  </div>
                  <button 
                    onClick={() => updateStatus(req.id, req.status, req.adminComment)}
                    className="mt-2 w-full btn-primary py-2 text-xs"
                  >
                    Зберегти повідомлення
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : tab === 'orders' ? (
        <div className="grid gap-6">
          {orders.map(order => (
            <div key={order.id} className="antique-card p-6 border-l-4 border-antique-accent">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-4 mb-2">
                        <span className="font-serif font-bold text-xl">Замовлення #{order.id}</span>
                        <span className="text-xs italic opacity-40">{new Date(order.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="font-bold text-antique-brown">{order.user?.name} ({order.user?.email})</p>
                    </div>
                    <span className="text-2xl font-bold font-serif text-antique-accent">{order.total.toLocaleString()} ₴</span>
                  </div>
                  
                  <div className="bg-antique-brown/5 p-4 rounded-xl mb-4">
                    <p className="text-xs uppercase font-bold opacity-40 mb-2">Склад замовлення:</p>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.product.name}</span>
                          <span className="font-bold">{item.price.toLocaleString()} ₴</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider opacity-40 mb-1">Коментар до замовлення</p>
                    <textarea 
                      className="input-field text-sm" 
                      rows="2" 
                      placeholder="Додайте коментар для клієнта..."
                      value={order.adminComment || ''}
                      onChange={(e) => handleOrderCommentChange(order.id, e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-2">
                  <p className="text-xs font-bold uppercase mb-2">Статус замовлення:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => updateOrderStatus(order.id, 'PROCESSING', order.adminComment)} className={`px-4 py-2 text-xs rounded transition-all ${order.status === 'PROCESSING' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>Обробка</button>
                    <button onClick={() => updateOrderStatus(order.id, 'SHIPPED', order.adminComment)} className={`px-4 py-2 text-xs rounded transition-all ${order.status === 'SHIPPED' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}>Відправлено</button>
                    <button onClick={() => updateOrderStatus(order.id, 'DELIVERED', order.adminComment)} className={`px-4 py-2 text-xs rounded transition-all ${order.status === 'DELIVERED' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>Доставлено</button>
                    <button onClick={() => updateOrderStatus(order.id, 'REJECTED', order.adminComment)} className={`px-4 py-2 text-xs rounded transition-all ${order.status === 'REJECTED' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>Відмовлено</button>
                  </div>
                  <button 
                    onClick={() => updateOrderStatus(order.id, order.status, order.adminComment)}
                    className="mt-2 w-full btn-primary py-2 text-xs"
                  >
                    Зберегти коментар
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="antique-card p-6 sticky top-24">
              <h3 className="text-2xl font-serif mb-6">{editingProduct ? 'Редагувати товар' : 'Додати новий товар'}</h3>
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Назва</label>
                  <input type="text" className="input-field" value={productForm.name} required onChange={e => setProductForm({...productForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Категорія (виберіть або напишіть нову)</label>
                  <input 
                    list="category-list"
                    className="input-field" 
                    value={productForm.category} 
                    required 
                    onChange={e => setProductForm({...productForm, category: e.target.value})} 
                    placeholder="Виберіть або введіть..."
                  />
                  <datalist id="category-list">
                    {categories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm mb-1">Ціна (₴)</label>
                  <input type="number" className="input-field" value={productForm.price} required onChange={e => setProductForm({...productForm, price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Рік виготовлення</label>
                  <input type="text" className="input-field" value={productForm.year} onChange={e => setProductForm({...productForm, year: e.target.value})} placeholder="Наприклад: 1890 або XIX ст." />
                </div>
                <div>
                  <label className="block text-sm mb-1">URL Фото</label>
                  <input type="text" className="input-field" value={productForm.image} required onChange={e => setProductForm({...productForm, image: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Опис</label>
                  <textarea rows="3" className="input-field" value={productForm.description} required onChange={e => setProductForm({...productForm, description: e.target.value})} />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 btn-primary">{editingProduct ? 'Оновити' : 'Створити'}</button>
                  {editingProduct && (
                    <button type="button" onClick={() => { setEditingProduct(null); setProductForm({ name: '', description: '', price: '', category: '', image: '' }); }} className="btn-outline">Скасувати</button>
                  )}
                </div>
              </form>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            {products.map(p => (
              <div key={p.id} className="antique-card p-4 flex gap-4 items-center">
                <img src={p.image} className="w-20 h-20 object-cover rounded shadow-sm" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-antique-gold uppercase tracking-tighter">{p.category}</span>
                    {p.year && <span className="text-xs text-antique-brown/40">• {p.year}</span>}
                    <span className="text-xs opacity-30">ID: {p.id}</span>
                  </div>
                  <h4 className="font-serif font-bold text-lg">{p.name}</h4>
                  <p className="text-sm font-bold text-antique-brown">{p.price.toLocaleString()} ₴</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(p)} className="p-2 text-antique-brown hover:bg-antique-brown/10 rounded-full transition-colors">
                    <Hammer className="w-5 h-5" />
                  </button>
                  <button onClick={() => deleteProduct(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Cart = () => {
  const { cart, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const total = cart.reduce((acc, item) => acc + item.price, 0);

  const handleCheckout = async () => {
    if (!user) {
      alert('Будь ласка, увійдіть в акаунт для оформлення замовлення');
      navigate('/login');
      return;
    }
    try {
      await api.post('/orders', { items: cart, total });
      alert('Замовлення успішно оформлено! Ми зв’яжемося з вами найближчим часом.');
      clearCart();
      navigate('/requests'); // Redirect to my orders/requests
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Помилка при оформленні замовлення';
      alert(errorMsg);
      console.error('Checkout error:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-12 px-4">
      <h2 className="text-4xl font-serif mb-8">Ваш кошик</h2>
      {cart.length === 0 ? (
        <div className="text-center py-20 antique-card">
          <p className="italic text-antique-brown/60 mb-8">Кошик порожній...</p>
          <Link to="/" className="btn-primary">Повернутися до каталогу</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item, idx) => (
              <div key={idx} className="antique-card p-4 flex gap-4 items-center">
                <img src={item.image} className="w-20 h-20 object-cover rounded" />
                <div className="flex-1">
                  <h4 className="font-serif font-bold">{item.name}</h4>
                  <p className="text-sm opacity-60">{item.price.toLocaleString()} ₴</p>
                </div>
                <button onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
          <div className="antique-card p-6 h-fit sticky top-24">
            <h3 className="text-xl font-serif mb-6 pb-4 border-b">Підсумок</h3>
            <div className="flex justify-between mb-4 font-bold text-xl">
              <span>Разом:</span>
              <span>{total.toLocaleString()} ₴</span>
            </div>
            <button className="w-full btn-primary py-3 mb-4" onClick={handleCheckout}>
              Оформити замовлення
            </button>
            <p className="text-xs text-center italic opacity-40">Всі предмети є унікальними та доступні в одному екземплярі.</p>
          </div>
        </div>
      )}
    </div>
  );
};

// --- App Root ---
export default function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/login', { email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
  };

  const register = async (data) => {
    const res = await api.post('/register', data);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const addToCart = (p) => setCart([...cart, p]);
  const removeFromCart = (idx) => setCart(cart.filter((_, i) => i !== idx));
  const clearCart = () => setCart([]);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow pb-20">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/new-request" element={<NewRequest />} />
              <Route path="/requests" element={<UserRequests />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/cart" element={<Cart />} />
            </Routes>
          </main>
          <footer className="bg-antique-dark text-antique-cream/40 py-12 border-t border-antique-brown/20">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="font-serif italic text-lg mb-2">Антикварна Лавка</p>
              <p className="text-xs uppercase tracking-widest">© 2026 Всі права захищені • Естетика минулого для вашого дому</p>
            </div>
          </footer>
        </div>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
}
