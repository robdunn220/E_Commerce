var app = angular.module('e-commerce', ['ui.router', 'ngCookies']);

app.run(function($rootScope, $cookies, $state) {
  $rootScope.logOut = function() {
    $cookies.remove('username');
    $cookies.remove('customer_id');
    $cookies.remove('token');
    $rootScope.user_name = '';
    $rootScope.logState = false;
    $state.go('login');
  };
});

app.factory("Commerce_api", function factoryFunction($http, $cookies, $rootScope){
  var service = {};
  $rootScope.cart_counter = $cookies.get('cart_counter');
  $rootScope.user_name = $cookies.get('username');
  $rootScope.token = $cookies.get('token');
  $rootScope.logState = false;
  if ($rootScope.user_name) {
    $rootScope.logState = true;
  }
  service.displayProducts = function(){
    return $http({
      url: '/api/products'
    });
  };

  service.displayIndProduct = function(product_id) {
    return $http({
      url: '/api/products/' + product_id
    });
  };

  service.userSignup = function(username, email, password, first_name, last_name) {
    return $http ({
      url: '/api/user/signup',
      method: "POST",
      data: {
        username: username,
        email: email,
        password: password,
        first_name: first_name,
        last_name: last_name
      }
    });
  };

  service.userLogin = function(username, password) {
    return $http ({
      url: '/api/user/login',
      method: "POST",
      data: {
        username: username,
        password: password
      }
    });
  };

  service.addToCart = function(product_id, auth_token) {
    return $http ({
      url: '/api/shopping_cart',
      method: "POST",
      data: {
        product_id: product_id,
        auth_token: auth_token
      }
    });
  };

  service.removeFromCart = function(product_id, auth_token) {
    return $http ({
      url: '/api/shopping_cart/remove',
      method: "POST",
      data: {
        product_id: product_id,
        auth_token: auth_token
      }
    });
  };

    service.displayCart = function(auth_token){
      return $http({
        url: '/api/shopping_cart',
        params: {
          auth_token : auth_token
        }
      });
    };

  service.checkOut = function(address, auth_token, stripeToken) {
    return $http({
      url: '/api/shopping_cart/checkout',
      method: 'POST',
      data: {
        address: address,
        auth_token: auth_token,
        stripeToken : stripeToken
      }
    });
  };

  return service;
});

app.controller('HomeController', function($scope, Commerce_api, $cookies, $rootScope){
    Commerce_api.displayProducts().success(function(results){
      $scope.results = results;
      console.log("Here", $scope.results);
    });
});

app.controller('IndProductController', function($scope, $stateParams, Commerce_api, $rootScope, $cookies, $state){
  $scope.product_id = $stateParams.product_id;
    Commerce_api.displayIndProduct($scope.product_id).success(function(result){
      $scope.result = result[0];
      console.log("Here", $scope.result);
    });
    $scope.cart_add = false;
    $scope.addToCart = function(product_id){
      var auth_token = $cookies.get('token');
      Commerce_api.addToCart(product_id, auth_token).success(function(){
        console.log("Items added to cart");
        $scope.cart_add = true;
      }).error(function(){
        $cookies.putObject('redirect', true);
        $cookies.put('product_id', $scope.product_id);
        $state.go('login');
      });
    };
});

app.controller('SignupController', function($scope, $state, Commerce_api){
   $scope.signUpUser = function() {
    if($scope.password2 === $scope.password1){
    Commerce_api.userSignup($scope.username, $scope.email, $scope.password1, $scope.first_name, $scope.last_name).success(function() {
      console.log('Stuff');
    });
    $state.go('login');
    }
    else {
      $scope.pwmatch = true;
      console.log('Something');
    }
  };
});

app.controller('LoginController', function($scope, Commerce_api, $state, $cookies, $rootScope){
   $scope.loginUser = function() {
    Commerce_api.userLogin($scope.username, $scope.password).success(function(response) {
      $scope.loginFail = false;
      $cookies.put('token', response.auth_token.token);
      $cookies.put('customer_id', response.user.id);
      $cookies.put('username', response.user.username);

      $rootScope.logState = true;
      $rootScope.user_name = $cookies.get('username');
      var redirect_to_prod = $cookies.getObject('redirect');

      if (redirect_to_prod) {
        $state.go('individual_product', {'product_id': $cookies.get('product_id')});
        // $cookies.remove('product_id');
        $cookies.putObject('redirect', false);
      }
      else {
        $state.go('home');
      }

    }).error(function(){
      $scope.loginFail = true;
    });

  };
});

app.controller('ShoppingCartController', function($scope, Commerce_api, $cookies, $rootScope, $state){
    $scope.shoppingCartLoad = function(){
    $scope.auth_token = $cookies.get('token');
    Commerce_api.displayCart($scope.auth_token).success(function(results){
      $scope.results = results;
      if(results.length === 0){
        $scope.cart_active = false;
      }
      else{
        $scope.cart_active = true;
      }

      $scope.sum_of_sale = 0;
      $scope.cart_counter = 0;
      for (var i = 0; i < results.length; i++) {
        $scope.sum_of_sale += results[i].prodprice;
        $scope.cart_counter += 1;
      }
      $cookies.put('cart_counter', $scope.cart_counter);
      $cookies.put('sum', $scope.sum_of_sale);
      console.log($scope.sum_of_sale);
      console.log("Here", $scope.results);
    });

  };
    $scope.shoppingCartLoad();
    $scope.goToCheckout = function(){
      $state.go('checkout');
    };
    $scope.removeItem = function(product_id){
      Commerce_api.removeFromCart(product_id, $scope.auth_token).success(function(){
        $scope.shoppingCartLoad();
      });
    };
});

app.controller('CheckoutController', function($scope, $cookies, Commerce_api, $rootScope, $state) {
  $scope.auth_token = $cookies.get('token');
  Commerce_api.displayCart($scope.auth_token).success(function(results){
    $scope.results = results;
    $cookies.putObject('productInfo', $scope.results);
    $scope.sum_of_sale = 0;
    for (var i = 0; i < results.length; i++) {
      $scope.sum_of_sale += results[i].prodprice;
    }
  });

  $scope.checkout = function () {
    if (!$scope.address2) {
      $scope.address2 = "";
    }
    $scope.addressString = ($scope.address + " " + "" + $scope.city + " " + $scope.state_of_US + " " + ($scope.zip_code).toString());
    $cookies.put('address', $scope.addressString);
    $scope.auth_token = $cookies.get('token');

  var handler = StripeCheckout.configure({
  // publishable key
  key: 'pk_test_XLTl6ww9jSwcUWNjhfFjrlgZ',
  locale: 'auto',
  token: function callback(token) {
    var stripeToken = token.id;
    console.log(stripeToken);
    // Make checkout API call here and send the stripe token
    // to the back end
    Commerce_api.checkOut($scope.addressString, $scope.auth_token, stripeToken).success(function() {
      $state.go('order_confirmation');
    });
  }
});
// this actually opens the popup modal dialog
handler.open({
  name: 'Ugly Sweater Store',
  description: 'Sweaters yall',
  amount: $scope.sum_of_sale * 100
});



  };


  $scope.goToCart = function(){
    $state.go('shopping_cart');
  };
});

app.controller('ConfirmationController', function($scope, $cookies, $rootScope, $state) {
  $scope.address = $cookies.get('address');
  console.log($scope.address);
  $scope.productInfo = $cookies.getObject('productInfo');
  console.log($scope.productInfo);
  $scope.sum = $cookies.get('sum');
  $cookies.remove('address');
  $cookies.remove('productInfo');
});

app.config(function($stateProvider, $urlRouterProvider){
  $stateProvider
    .state({
      name : 'home',
      url : '/home',
      templateUrl: 'home.html',
      controller: 'HomeController'
    })
    .state({
      name : 'individual_product',
      url : '/product/{product_id}',
      templateUrl: 'individual_product.html',
      controller: 'IndProductController'
    })
    .state({
      name : 'signup',
      url : '/user/signup',
      templateUrl: 'user_signup.html',
      controller: 'SignupController'
    })
    .state({
      name : 'login',
      url : '/user/login',
      templateUrl: 'login.html',
      controller: 'LoginController'
    })
    .state({
      name : 'shopping_cart',
      url : '/shopping_cart',
      templateUrl: 'shopping_cart.html',
      controller: 'ShoppingCartController'
    })
    .state({
      name: 'checkout',
      url: '/checkout',
      templateUrl: 'checkout.html',
      controller: 'CheckoutController'
    })
    .state({
      name: 'order_confirmation',
      url: '/confirmation',
      templateUrl: 'thank_you.html',
      controller: 'ConfirmationController'
    })
    ;
});

// pk_test_XLTl6ww9jSwcUWNjhfFjrlgZ
// sk_test_545bfjRSG5ciHpAyW6NACZCj  (secret)
