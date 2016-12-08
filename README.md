# E_Commerce Ugly Sweater Store
######
[Overview](https://github.com/robdunn220/E_Commerce#overview)   |   [What We Used](https://github.com/robdunn220/E_Commerce#what-we-used)   |   [MVP](https://github.com/robdunn220/E_Commerce#mvp-minimum-viable-product)   |    [Code](https://github.com/robdunn220/E_Commerce#code-snippets)   | [Screenshots](https://github.com/robdunn220/E_Commerce#screenshots)   |   [Contributing](https://github.com/robdunn220/E_Commerce##contributing)

##Overview:
Ugly Sweater store is an e-commerce project that I created to sharpen my skills using Python, Flask, and PostgreSQL, as well as implement some newly learned JavaScript concepts, such as Angular routing. I also made use of an API called Stripe for the checkout portion.

##Github Link:
[NerdReview](https://github.com/DigitalCrafts-September-2016-Cohort/team_freedom_nerdreview.git)

##What we used:
**Languages:**  
* Python
* JavaScript
* HTML5
* CSS

**Frameworks:**  
* Flask
* Angular
* Bootstrap
  * [Validator - plugin](https://1000hz.github.io/bootstrap-validator/)

##MVP (Minimum Viable Product):
In terms of functionality, our MVP was to allow users to securely login, and, using a generated authentication token, give them access to viewing and purchasing the products. It was the first time merging Python/Flask and Angular, so the routing from the front-end all the way down to the data base queries was more difficult then we first thought. Also, in the log-in functionality, we used b-crypt to salt the passwords, and created hash keys in their place. It was the first time any encryption had been used, and was slightly challenging to implement when it came to verification.

##Code Snippets

Sample page route with drop-down sort functionality:
```Python

```

HTML with Jinja template for displaying a tile grid page (products by sub-category)
```html

```

Show/hide animation for the left-fixed vertical nav bar :
```JavaScript

```

##Screenshots
![Homepage](static/img/Homepage.png)

********

##Contributing
1. Fork it
2. Create a new feature branch (named after your intended feature): `git checkout -b new-feature-name`
3. Commit your changes: `git commit -am 'Added the feature!'`
4. Push to your feature branch: `git push origin new-feature-name`
5. Submit a pull request!

##Project History
10/24/2016 - Project Completion and Deployment  
10/18/2016 - Project Start
