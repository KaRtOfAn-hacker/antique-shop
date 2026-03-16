import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = 5001;
const SECRET = 'antique_secret_key_123';

app.use(cors());
app.use(express.json());

// Middleware to authenticate
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Auth Routes
app.post('/api/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role: 'CLIENT' }
    });
    const token = jwt.sign({ userId: user.id, role: user.role }, SECRET);
    res.json({ token, user: { id: user.id, email, name, role: user.role } });
  } catch (err) {
    res.status(400).json({ error: 'User already exists' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ userId: user.id, role: user.role }, SECRET);
  res.json({ token, user: { id: user.id, email, name: user.name, role: user.role } });
});

// Products Routes
app.get('/api/products', async (req, res) => {
  const products = await prisma.product.findMany();
  res.json(products);
});

app.get('/api/products/:id', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: parseInt(req.params.id) }
  });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

app.post('/api/products', authenticate, async (req, res) => {
  if (req.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { name, description, price, category, image, year } = req.body;
  const product = await prisma.product.create({
    data: { name, description, price: parseFloat(price), category, image, year }
  });
  res.json(product);
});

app.patch('/api/products/:id', authenticate, async (req, res) => {
  if (req.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { name, description, price, category, image, year } = req.body;
  const product = await prisma.product.update({
    where: { id: parseInt(req.params.id) },
    data: { name, description, price: parseFloat(price), category, image, year }
  });
  res.json(product);
});

app.delete('/api/products/:id', authenticate, async (req, res) => {
  if (req.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  await prisma.product.delete({
    where: { id: parseInt(req.params.id) }
  });
  res.json({ success: true });
});

// Requests Routes
app.post('/api/requests', authenticate, async (req, res) => {
  const { type, description } = req.body;
  const request = await prisma.request.create({
    data: { type, description, userId: req.userId }
  });
  res.json(request);
});

app.get('/api/requests', authenticate, async (req, res) => {
  if (req.role === 'ADMIN') {
    const requests = await prisma.request.findMany({ include: { user: true } });
    return res.json(requests);
  }
  const requests = await prisma.request.findMany({ where: { userId: req.userId } });
  res.json(requests);
});

app.patch('/api/requests/:id', authenticate, async (req, res) => {
  if (req.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { status, adminComment } = req.body;
  const request = await prisma.request.update({
    where: { id: parseInt(req.params.id) },
    data: { status, adminComment }
  });
  res.json(request);
});

// Orders Routes
app.post('/api/orders', authenticate, async (req, res) => {
  const { items, total } = req.body;
  try {
    const order = await prisma.order.create({
      data: {
        total,
        userId: req.userId,
        items: {
          create: items.map(item => ({
            productId: item.id,
            price: item.price
          }))
        }
      },
      include: { items: true }
    });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create order' });
  }
});

app.get('/api/orders', authenticate, async (req, res) => {
  if (req.role === 'ADMIN') {
    const orders = await prisma.order.findMany({
      include: { user: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(orders);
  }
  const orders = await prisma.order.findMany({
    where: { userId: req.userId },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(orders);
});

app.patch('/api/orders/:id', authenticate, async (req, res) => {
  if (req.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { status, adminComment } = req.body;
  const order = await prisma.order.update({
    where: { id: parseInt(req.params.id) },
    data: { status, adminComment }
  });
  res.json(order);
});

// Seed some data if empty
async function seed() {
  const count = await prisma.product.count();
  if (count === 0) {
    await prisma.product.createMany({
      data: [
        { name: 'Вікторіанський годинник', description: 'Золочений настільний годинник XIX століття.', price: 12500, category: 'Годинники', image: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=500&q=80' },
        { name: 'Порцелянова ваза', description: 'Династія Мін (репліка високої якості).', price: 8900, category: 'Кераміка', image: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=500&q=80' },
        { name: 'Дубовий секретер', description: 'Масив дуба, ручна різьба, початок XX ст.', price: 45000, category: 'Меблі', image: 'https://images.unsplash.com/photo-1540638349517-3abd5afc5847?w=500&q=80' },
        { name: 'Старовинна лампа', description: 'Бронза та скло, стиль Ар-нуво.', price: 15600, category: 'Освітлення', image: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?w=500&q=80' }
      ]
    });
    // Create admin if not exists
    const adminExists = await prisma.user.findUnique({ where: { email: 'admin@antique.com' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: { email: 'admin@antique.com', password: hashedPassword, name: 'Адміністратор', role: 'ADMIN' }
      });
    }
  }
}

seed().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
