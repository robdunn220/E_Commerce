from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())
from flask import Flask, render_template, redirect, request, session, flash, jsonify
import pg, os, bcrypt, uuid
from time import time
import datetime
from datetime import timedelta
import stripe



tmp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
app = Flask('e-commerce', static_url_path = '')
stripe.api_key = os.environ.get('STRIPE_KEY')
db = pg.DB(
   dbname=os.environ.get('PG_DBNAME'),
   host=os.environ.get('PG_HOST'),
   user=os.environ.get('PG_USERNAME'),
   passwd=os.environ.get('PG_PASSWORD')
)

#Route to main
@app.route('/')
def route_index():
    # print data
    return app.send_static_file('index.html');

#All products
@app.route('/api/products')
def products():
    result = db.query('Select * from product')
    data = result.dictresult()

    # print data
    return jsonify(data);

#Product by ID
@app.route('/api/products/<id>')
def product(id):
    result = db.query('Select * from product where id = $1', id)
    data = result.dictresult()
    return jsonify(data);

#Sign Up Route
@app.route('/api/user/signup', methods=["POST"])
def signup():
    req = request.get_json()
    print req
    password = req['password']
    salt = bcrypt.gensalt()
    encrypted_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    db.insert('customer', {
        'username' : req['username'],
        'email': req['email'],
        'password' : encrypted_password,
        'first_name' : req['first_name'],
        'last_name' : req['last_name']
    })
    # data = result.dictresult()
    return jsonify(req);

#shopping cart POST
@app.route('/api/shopping_cart', methods=["POST"])
def shopping_cart():
    req = request.get_json()
    auth = req['auth_token']
    result = db.query('select id from customer inner join auth_token on auth_token.customer_id = customer.id where auth_token.token = $1',auth).dictresult()

    if(len(result) > 0):
        # print result[0]['id']
        db.insert('product_in_shopping_cart',{
        'product_id' : req['product_id'],
        'customer_id': result[0]['id']
        })
        return jsonify(req);
    else:
        return "Access Forbidden", 403

#shopping cart POST REMOVE
@app.route('/api/shopping_cart/remove', methods=["POST"])
def remove_from_cart():
    req = request.get_json()
    auth = req['auth_token']
    product_id = req['product_id']
    print product_id
    result = db.query('select id from customer inner join auth_token on auth_token.customer_id = customer.id where auth_token.token = $1',auth).dictresult()

    if(len(result) > 0):
        db.query('delete from product_in_shopping_cart where product_id = $1',product_id)

        return jsonify(req);
    else:
        return "Access Forbidden", 403

#Shopping Cart GET
@app.route('/api/shopping_cart', methods=['GET'])
def shopping_cart_get():
    req = request.args
    auth = req['auth_token']
    result = db.query('select id from customer inner join auth_token on auth_token.customer_id = customer.id where auth_token.token = $1',auth).dictresult()
    if(len(result) > 0):
        # print result[0]['id']
        cart_items = db.query('select product_id, product.name as prodname, product.price as prodprice from product_in_shopping_cart inner join product on product_in_shopping_cart.product_id = product.id where customer_id = $1', result[0]['id']).dictresult()
        return jsonify(cart_items)
    else:
        return "Access Forbidden", 403

#shopping cart checkout
@app.route('/api/shopping_cart/checkout', methods=["POST"])
def shopping_cart_checkout():
    req = request.get_json()
    auth = req['auth_token']
    result = db.query('select customer.id as cust_id, product_id, price from auth_token inner join customer on auth_token.customer_id = customer.id inner join product_in_shopping_cart on product_in_shopping_cart.customer_id = customer.id inner join product on product_in_shopping_cart.product_id = product.id where auth_token.token = $1', auth).dictresult()
    print result
    if(len(result) > 0):
        result = result
        customer_id = result[0]['cust_id']
        print customer_id
        print result
        sum_of_sale = 0
        for item in result:
            item = item['price']
            sum_of_sale += item
        print ("Here sum: $1", sum_of_sale)
        db.insert('purchase',{
        'total_price' : sum_of_sale,
        'customer_id': customer_id,
        'address': req['address']
        })

        pub_key = req['stripeToken']
        print pub_key
        stripe.Charge.create(
          amount=sum_of_sale * 100,
          currency="usd",
          source= pub_key, # obtained with Stripe.js
          description="Thank you for your biz!!"
        )


        purchase_query = db.query('select product_id, MAX(purchase.id) from purchase inner join customer on purchase.customer_id = customer.id inner join product_in_shopping_cart on product_in_shopping_cart.customer_id = customer.id where purchase.customer_id = $1 group by product_id', customer_id, ).dictresult()
        for entry in purchase_query:
            print entry
            db.insert('product_in_purchase',{
            'product_id' : entry['product_id'],
            'purchase_id': entry['max']
            })
        db.query('delete from product_in_shopping_cart where customer_id = $1', customer_id)
        return jsonify(req);
    else:
        return "Access Forbidden", 403

    #Login Route
@app.route('/api/user/login', methods=["POST"])
def login():
    req = request.get_json()
    # print req
    username = req['username']
    password = req['password']
    query = db.query('select * from customer where username = $1', username).dictresult()[0]
    # print query
    stored_enc_pword = query['password']
    del query['password']
    print stored_enc_pword
    rehash = bcrypt.hashpw(password.encode('utf-8'), stored_enc_pword)
    print rehash

    if (stored_enc_pword == rehash):
        print "Success"
        # do a query to delete expired auth_token??
        current_date = datetime.datetime.now()
        # db.query('delete token from auth_token where $1 <= token_expires ', current_date)
        db_token = db.query('select token from auth_token where customer_id = $1',query['id']).dictresult()
        print db_token

        if(len(db_token) > 0):
            token = db_token[0]
            print "token exist"
        else:
            # exp_date = datetime.datetime.now() + timedelta(days = 30)
            # print exp_date
            token = uuid.uuid4()
            db.insert('auth_token',{
                'token' : token,
                'customer_id' : query['id']
            })

        return jsonify({
        "user" : query,
        "auth_token" :
            token
        })
    else:
        return "login failed",401


    # # data = result.dictresult()
    # return "jsonify(password)";

app.run(debug=True)
