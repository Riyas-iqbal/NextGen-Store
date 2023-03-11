
  # NextGen-Store 
  
  [Live Link](https://next-gen-store.onrender.com)

## Table of contents

- [Introduction](#NextGen-Store)
- [Screenshots](#Screenshots)
- [Getting Started](#getting-started)
- [Run Locally](#Run-Locally)
- [Environment Variables](#Environment-Variables)
- [Features](#features)
- [Contributing](#contributing)
- [Authors](#authors)
- [Acknowledgments](#acknowledgments)


# NextGen-Store
Next-gen store is an e-commerce site built with Node.js, Express, and MongoDB, with server-side rendering using Handlebars as the templating engine.

NOTE: Please read the [Getting Started](#getting-started) section before opening an issue.

## Screenshots

![App Screenshot](https://live.staticflickr.com/65535/52740168784_5d2b7bea7a_z.jpg)

![App Screenshot](https://live.staticflickr.com/65535/52740168779_43caf750e6_z.jpg)

## Admin

![App Screenshot](https://live.staticflickr.com/65535/52740168749_7b419cf5af_z.jpg)

![App Screenshot](https://live.staticflickr.com/65535/52740327795_c9989ee26a_z.jpg)





## Getting Started

To run this e-commerce site on your local machine, follow these steps:

1. Clone this repository
2. Setup [Enviornment variables](#Environment-Variables) 
3. Install the required dependencies using `npm install`
4. Start the application using `npm start`
6. Open `http://localhost:3000` in your web browser to access the site

## Run Locally

Clone the project

```bash
  git clone https://github.com/Riyas-iqbal/NextGen-Store.git
```

Go to the project directory

```bash
  cd NextGen-Store
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm start
```

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file. Additionallly you will need a Twilio, Razorpay, Paypal Account and Mongo Atlas Account to get the api key

`TWILIO_ACCOUNT_SID`

`TWILIO_AUTH_TOKEN`

`TWILIO_SERVICE_ID`

`RAZORPAY_KEY_ID`

`RAZORPAY_KEY_SECRET`

`PAYPAL_SANDBOX_CLIENT_ID`

`PAYPAL_SANDBOX_CLIENT_SECRET`

`MONGODB_ATLAS`


## Features

#### User side

* User registration and login with validation
* OTP login via Twilio
* Multiple address management
* Category-wise product list
* Wishlist and cart management
* Order summary
* Special offers and coupon codes
* Cash on delivery, user wallet, and online payment via Razor Pay and PayPal
* Order history
* Cancellation and return management
* User profile management

#### Admin side

* Signup and login for admin users
* Charts and graphs
* User management: edit, block/unblock users
* Product management
* Order management
* Coupon management
* Offer Management
* Banner Management

## Contributing

If you find a bug or have a feature request, please open an issue or submit a pull request.

## Authors

* [Riyas Iqbal](https://github.com/riyas-iqbal)

## Acknowledgments

* [Node.js](https://nodejs.org/)
* [Express](https://expressjs.com/)
* [MongoDB](https://www.mongodb.com/)
* [Handlebars](https://handlebarsjs.com/)
