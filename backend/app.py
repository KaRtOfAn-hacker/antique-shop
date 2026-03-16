from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import jwt
import bcrypt
import datetime
from functools import wraps
import os

app = Flask(__name__)
CORS(app)

# Database Configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dev.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'antique_shop_super_secret_long_key_32_chars_minimum'

db = SQLAlchemy(app)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), default='CLIENT')
    requests = db.relationship('Request', backref='user', lazy=True)
    orders = db.relationship('Order', backref='user', lazy=True)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Float, nullable=False)
    image = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    year = db.Column(db.String(50))
    order_items = db.relationship('OrderItem', backref='product', lazy=True)

class Request(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), default='PENDING')
    description = db.Column(db.Text, nullable=False)
    admin_comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String(20), default='PENDING')
    total = db.Column(db.Float, nullable=False)
    admin_comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    items = db.relationship('OrderItem', backref='order', lazy=True)

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    price = db.Column(db.Float, nullable=False)

# Auth Decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        
        if not token:
            return jsonify({'error': 'Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(id=data['user_id']).first()
        except:
            return jsonify({'error': 'Token is invalid!'}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

# Routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    new_user = User(email=data['email'], password=hashed_password, name=data['name'], role='CLIENT')
    try:
        db.session.add(new_user)
        db.session.commit()
        token = jwt.encode({'user_id': new_user.id, 'role': new_user.role, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)}, app.config['SECRET_KEY'])
        return jsonify({'token': token, 'user': {'id': new_user.id, 'email': new_user.email, 'name': new_user.name, 'role': new_user.role}})
    except:
        return jsonify({'error': 'User already exists!'}), 400

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not bcrypt.checkpw(data['password'].encode('utf-8'), user.password.encode('utf-8')):
        return jsonify({'error': 'Invalid credentials!'}), 401
        
    token = jwt.encode({'user_id': user.id, 'role': user.role, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)}, app.config['SECRET_KEY'])
    return jsonify({'token': token, 'user': {'id': user.id, 'email': user.email, 'name': user.name, 'role': user.role}})

@app.route('/api/products', methods=['GET'])
def get_products():
    products = Product.query.all()
    return jsonify([{'id': p.id, 'name': p.name, 'description': p.description, 'price': p.price, 'image': p.image, 'category': p.category, 'year': p.year} for p in products])

@app.route('/api/products/<int:id>', methods=['GET'])
def get_product(id):
    p = Product.query.get_or_404(id)
    return jsonify({'id': p.id, 'name': p.name, 'description': p.description, 'price': p.price, 'image': p.image, 'category': p.category, 'year': p.year})

@app.route('/api/products', methods=['POST'])
@token_required
def create_product(current_user):
    if current_user.role != 'ADMIN': return jsonify({'error': 'Forbidden'}), 403
    data = request.get_json()
    new_product = Product(name=data['name'], description=data['description'], price=float(data['price']), category=data['category'], image=data['image'], year=data.get('year'))
    db.session.add(new_product)
    db.session.commit()
    return jsonify({'id': new_product.id, 'name': new_product.name, 'category': new_product.category})

@app.route('/api/products/<int:id>', methods=['PATCH'])
@token_required
def update_product(current_user, id):
    if current_user.role != 'ADMIN': return jsonify({'error': 'Forbidden'}), 403
    p = Product.query.get_or_404(id)
    data = request.get_json()
    p.name = data.get('name', p.name)
    p.description = data.get('description', p.description)
    p.price = float(data.get('price', p.price))
    p.category = data.get('category', p.category)
    p.image = data.get('image', p.image)
    p.year = data.get('year', p.year)
    db.session.commit()
    return jsonify({'id': p.id, 'name': p.name})

@app.route('/api/products/<int:id>', methods=['DELETE'])
@token_required
def delete_product(current_user, id):
    if current_user.role != 'ADMIN': return jsonify({'error': 'Forbidden'}), 403
    p = Product.query.get_or_404(id)
    db.session.delete(p)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/api/requests', methods=['POST'])
@token_required
def create_request(current_user):
    data = request.get_json()
    new_req = Request(type=data['type'], description=data['description'], user_id=current_user.id)
    db.session.add(new_req)
    db.session.commit()
    return jsonify({'id': new_req.id, 'status': new_req.status})

@app.route('/api/requests', methods=['GET'])
@token_required
def get_requests(current_user):
    if current_user.role == 'ADMIN':
        reqs = Request.query.all()
        return jsonify([{'id': r.id, 'type': r.type, 'status': r.status, 'description': r.description, 'adminComment': r.admin_comment, 'createdAt': r.created_at.isoformat(), 'user': {'name': r.user.name, 'email': r.user.email}} for r in reqs])
    reqs = Request.query.filter_by(user_id=current_user.id).all()
    return jsonify([{'id': r.id, 'type': r.type, 'status': r.status, 'description': r.description, 'adminComment': r.admin_comment, 'createdAt': r.created_at.isoformat()} for r in reqs])

@app.route('/api/requests/<int:id>', methods=['PATCH'])
@token_required
def update_request(current_user, id):
    if current_user.role != 'ADMIN': return jsonify({'error': 'Forbidden'}), 403
    r = Request.query.get_or_404(id)
    data = request.get_json()
    r.status = data.get('status', r.status)
    r.admin_comment = data.get('adminComment', r.admin_comment)
    db.session.commit()
    return jsonify({'id': r.id, 'status': r.status})

@app.route('/api/orders', methods=['POST'])
@token_required
def create_order(current_user):
    try:
        data = request.get_json()
        print(f"DEBUG: Creating order for user {current_user.id}, total: {data.get('total')}")
        
        new_order = Order(total=float(data['total']), user_id=current_user.id)
        db.session.add(new_order)
        db.session.flush() # Отримуємо ID замовлення без повного коміту
        
        for item in data['items']:
            # Перевіряємо чи існує товар в новій базі
            product = Product.query.get(item['id'])
            if not product:
                return jsonify({'error': f"Товар з ID {item['id']} не знайдено. Очистіть кошик і додайте його заново."}), 400
                
            oi = OrderItem(order_id=new_order.id, product_id=product.id, price=float(item['price']))
            db.session.add(oi)
            
        db.session.commit()
        print(f"DEBUG: Order {new_order.id} created successfully")
        return jsonify({'id': new_order.id})
    except Exception as e:
        db.session.rollback()
        print(f"ERROR creating order: {str(e)}")
        return jsonify({'error': f"Помилка на сервері: {str(e)}"}), 500

@app.route('/api/orders', methods=['GET'])
@token_required
def get_orders(current_user):
    if current_user.role == 'ADMIN':
        orders = Order.query.order_by(Order.created_at.desc()).all()
    else:
        orders = Order.query.filter_by(user_id=current_user.id).order_by(Order.created_at.desc()).all()
    
    result = []
    for o in orders:
        items = [{'product': {'name': i.product.name, 'image': i.product.image}, 'price': i.price} for i in o.items]
        order_data = {'id': o.id, 'status': o.status, 'total': o.total, 'adminComment': o.admin_comment, 'createdAt': o.created_at.isoformat(), 'items': items}
        if current_user.role == 'ADMIN':
            order_data['user'] = {'name': o.user.name, 'email': o.user.email}
        result.append(order_data)
    return jsonify(result)

@app.route('/api/orders/<int:id>', methods=['PATCH'])
@token_required
def update_order(current_user, id):
    if current_user.role != 'ADMIN': return jsonify({'error': 'Forbidden'}), 403
    o = Order.query.get_or_404(id)
    data = request.get_json()
    o.status = data.get('status', o.status)
    o.admin_comment = data.get('adminComment', o.admin_comment)
    db.session.commit()
    return jsonify({'id': o.id, 'status': o.status})

def seed():
    if Product.query.count() == 0:
        products = [
            Product(name='Вікторіанський годинник', description='Золочений настільний годинник XIX століття.', price=12500, category='Годинники', image='https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=500&q=80', year='1890'),
            Product(name='Порцелянова ваза', description='Династія Мін (репліка високої якості).', price=8900, category='Кераміка', image='https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=500&q=80', year='XIX ст.'),
            Product(name='Дубовий секретер', description='Масив дуба, ручна різьба, початок XX ст.', price=45000, category='Меблі', image='https://images.unsplash.com/photo-1540638349517-3abd5afc5847?w=500&q=80', year='1910'),
            Product(name='Старовинна лампа', description='Бронза та скло, стиль Ар-нуво.', price=15600, category='Освітлення', image='https://images.unsplash.com/photo-1534073828943-f801091bb18c?w=500&q=80', year='1920')
        ]
        db.session.bulk_save_objects(products)
        
        admin_pass = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin = User(email='admin@antique.com', password=admin_pass, name='Адміністратор', role='ADMIN')
        db.session.add(admin)
        db.session.commit()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        seed()
    app.run(host='0.0.0.0', port=5001, debug=True)
