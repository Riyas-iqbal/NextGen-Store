const express = require('express');
const router = express.Router();
const userHelpers =require('../helpers/user-helpers')
const productHelpers=require('../helpers/product-helpers')
const {uid}=require('uid')
const objectId = require('mongodb').ObjectId

//retrieving username, password and service id of twilio account stored in envi
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceId  = process.env.TWILIO_SERVICE_ID; 
const client = require('twilio')(accountSid, authToken);

//Paypal Integration 
const paypal = require('paypal-rest-sdk');
const { response } = require('express');
paypal.configure({
    'mode': 'sandbox', //sandbox or live 
    'client_id': process.env.PAYPAL_SANDBOX_CLIENT_ID , 
    'client_secret': process.env.PAYPAL_SANDBOX_CLIENT_SECRET
});


//Custom middleware to check if user is logged in
const verifyLogin = (req, res, next) => {
  if (req.session.user) {
    user=req.session.user
    userlogin=user
    console.log("user is logged in");
      next()
  } else {
      userLogin=false
      res.redirect('/login')
  }
}


// Contents : User Landing Page, Login, Signup, Registering User,POST Login,

/* User Landing page. importing all products and latest products*/
router.get('/',function (req, res) {

  productHelpers.findBanner().then((banner)=>{
    productHelpers.getAllProducts().then((products) => {
      limit=4 //for latest products
      
      productHelpers.getLatestProducts(limit).then((newProducts) => {
        if (req.session.user) {
          let userlogin = req.session.user
          res.render('user/index', { userlogin, user: true, products,banner, newProducts,homeActive:true });
        } else {
          res.render('user/index', { user: true, products,banner, newProducts ,homeActive:true })
        }
      })
    
    })
  })

});

/* user Login page. */
router.get('/login', function(req, res) {

  if(req.session.user){
    res.redirect('/')
  }else{
    res.render('user/login',{
      "UserloginErr":req.session.UserloginErr,
      user:true,
      removeFooter:true,
      userBlocked:req.flash('userBlocked'),
    });
    req.session.UserloginErr=false
  }

});

/*goto user Signup page. */
router.get('/signup', function(req, res, next) {

  if(req.session.user) res.redirect('/')

  else{

    res.render('user/signup',{
      removeFooter:true,
      emailExist:req.flash('emailExist'),
      numberExist:req.flash('numberExist'),
    });

  }

});

/*POST Registering new user and redirecting back to login Page*/
router.post('/user_registration',(req,res)=>{

  userHelpers.doSignup(req.body).then((userExist)=>{
    if (userExist) {

      if (userExist=='email'){ 
        req.flash('emailExist','The Email you entered is already connected to another account please enter another Email id');
      } else if (userExist=='phonenumber'){ 
        req.flash('numberExist','The Phone number you entered is already connected to another account please enter another Phone number');
      }
      res.redirect('/signup')
    
    } else res.redirect('/login')
  })

})

/*POST goto Home Page After successful Login */
router.post('/login',(req,res)=>{
  console.log("login Attempted");
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status && response.blockStatus){
      req.session.user=response.user
      res.redirect('/')
    }else{
      if (response.userIsBlocked) {
        req.flash('userBlocked','Access restricted');
      }else{
        req.session.UserloginErr=true
      }
      res.redirect('/login')
    }
  })
})

function CheckItemInWishlist(products,wishlist_products_Id) {
  try {
    //matching product id from PRODUCTS(array) and WISHLIST(array)
    for (let i = 0; i < products.length; i++) {
      for (let j = 0; j < wishlist_products_Id.length; j++) {
        //if a match is found. A variable is passed with value < true > to represent that the product is present in wishlist
        if (objectId(products[i]._id) == wishlist_products_Id[j].toString()) {
          products[i].wishlist = true
        }
      }
    }
    return products
  } catch (error) {
    console.log('user has no wishlist')
    console.log(error)
  }
}

//Explore Section Pushing All Products and Categories, Display Products Based on their Category
router.get('/explore', verifyLogin, (req, res) => {
  productHelpers.getAllProducts().then((products) => {
    productHelpers.getAllCategory().then((category) => {
      userHelpers.getWishlistProductsId(req.session.user._id).then((wishlist_products_Id) => {

        CheckItemInWishlist(products,wishlist_products_Id)

        res.render('user/explore',
          {
            user: true,
            userlogin,
            category,
            products,
            exploreActive: true
          })
      })
    })
  })
})

//Req to Display Products Based on their Category using category name from query
router.get('/category/',verifyLogin,(req,res)=>{
  let categoryName=req.query.category
  console.log(categoryName)
  productHelpers.getCategoryProduct(categoryName).then((products) => {
    productHelpers.getAllCategory().then((category) => {
      userHelpers.getWishlistProductsId(req.session.user._id).then((wishlist_products_Id) => {
        
        CheckItemInWishlist(products,wishlist_products_Id) //returns PRODUCTS(array) with a variable(true) if a product is found in User wishlist

        res.render('user/explore', { user, userlogin,category,products,exploreActive:true})
      })
    })
  })
})

//Get Product Details Page, Passing Product ID From query 
router.get('/product-details/',verifyLogin,(req,res)=>{
  productHelpers.getProductDetails(req.query.id).then((product)=>{
    console.log(product);
    res.render('user/product-details',{user,userlogin,product,exploreActive:true})
  })
})




//cart riyas

// router.get('/cart',verifyLogin, async(req,res)=>{
//   let products = userHelpers.getCartProducts(req.session.user._id)
//   res.render('user/cart',{user:true,userlogin:true,cartActive:true})
// })


// router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
//   userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
//     res.redirect('/cart')
//   })
// })



//cart old

router.get('/cart', verifyLogin, (req, res) => {
  userHelpers.getCartProducts(req.session.user._id).then((products) => {
    console.log(products)
    userHelpers.getTotalAmount(req.session.user._id).then((totalAmount) => {
      if (products) {
        res.render('user/cart', { user, userlogin, products, totalAmount, cartActive: true })
      } else {
        res.render('user/cart', { user, userlogin })
      }
    })
  })
})

router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.redirect('/cart')
  })
})

router.get('/add-to-cart-ajax/:id',verifyLogin,(req,res)=>{
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    let response=true
    res.json(response)
  })
})

router.post('/change-product-quantity', verifyLogin, (req, res) => {
  userHelpers.changeProductQuantity(req.body)
    .then(async (response) => {
      response.totalAmount = await userHelpers.getTotalAmount(req.body.user)
      response.totalOne = await userHelpers.getTotalOfOneProduct(req.body.user, req.body.product)
      res.json(response)
    })
})

router.post('/remove-item', (req, res) => {
  userHelpers.removeItem(req.body).then((response) => {
    res.json(response)
  })
})

router.get('/empty-cart', verifyLogin, (req, res) => {
  userHelpers.emptyCart(req.session.user._id).then(() => {
    res.redirect('/cart')
  })
})

//Place Order

router.get('/place-order', verifyLogin, async (req, res) => {
  let products = await userHelpers.getCartProducts(req.session.user._id)
  let totalAmount = await userHelpers.getTotalAmount(req.session.user._id)
  let allAddress = await userHelpers.getAllAddress(req.session.user._id)
  let coupons = await userHelpers.getAllCoupons()
  if (products) {
    res.render('user/userorder', { user, userlogin, products, totalAmount, allAddress, coupons })
  } else {
    res.redirect('/cart')
  }
})

router.post('/place-order', verifyLogin, async (req, res) => {

  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)

  if (req.body.coupon) {
    console.log('coupon req received')
    await userHelpers.checkCoupon(req.body.coupon).then((coupon)=>{
      if (coupon) {
        console.log('coupon found is')
        console.log(coupon)
        req.body.coupon = coupon
        req.body.coupon.oldPrice = totalPrice
        totalPrice = totalPrice - coupon.discount
        req.body.coupon.newPrice = totalPrice
        console.log('req.body is ');
        console.log(req.body)
      }
    })
  }

  let products = await userHelpers.getCartProductList(req.body.userId)
  
  userHelpers.placeOrder(req.body, products, totalPrice).then((orderId) => {

    //--------------------COD--------------------//

    if (req.body.paymentMethod === 'COD') {
      res.json({ codSuccess: true })

    } else if (req.body.paymentMethod === 'RAZORPAY') {
      //--------------------Razorpay API--------------------//

      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        response.razorpay = true
        res.json(response)
      })

    } else if (req.body.paymentMethod === 'PAYPAL') {
      //--------------------Paypal API--------------------//
      var payment = {
        "intent": "authorize",
        "payer": {
          "payment_method": "paypal"
        },
        "redirect_urls": {
          "return_url": "http://localhost:3000/status-page",
          "cancel_url": "http://localhost:3000/place-order"
        },
        "transactions": [{
          "amount": {
            "total": totalPrice,
            "currency": "USD"
          },
          "description": "nextgen"
        }]
      }

      userHelpers.createPay(payment)
        .then((transaction) => {
          var id = transaction.id;
          var links = transaction.links;
          var counter = links.length;
          while (counter--) {
            if (links[counter].rel === 'approval_url') {
              // redirect to paypal where user approves the transaction 

              console.log(links[counter].href);
              transaction.pay = true
              transaction.linkto = links[counter].href
              transaction.orderId = orderId
              console.log(payment)
              console.log(transaction)
              userHelpers.changePaymentStatus(orderId).then(() => {
                transaction.paypal = true
                res.json(transaction)
              })
            }
          }
        })
        .catch((err) => {
          console.log(err);
          res.redirect('/err');
        });
    }
  })
})

router.post('/verify-coupon', verifyLogin, (req, res) => {
  try {
    userHelpers.checkCoupon(req.body.coupon_code).then((coupon) => {
      userHelpers.getTotalAmount(req.session.user._id).then((totalAmount) => {
        let response = {}
        if (coupon) {
          
          response.coupon_name = coupon.name
          response.discount = coupon.discount
          response.coupon_code = coupon.coupon_code
          response.old_price = totalAmount
          response.new_price = (totalAmount - coupon.discount)
        } else {
          response = null
        }
        console.log(response)
        res.json(response)
      })
    })
  } catch (error) {
    console.log(error)
  }

})


//verify razorpay payment status
router.post('/verify-payment', verifyLogin, (req, res) => {
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log('payment success');
      res.json({ status: true })
    })
  }).catch(() => {
    res.json({ status: false })
  })
})


//--------------------VIEW ORDERS--------------------//

router.get('/status-page',verifyLogin,(req,res)=>{
    res.render('user/status-page',{user:true})
})

router.get('/view-orders', verifyLogin, (req, res) => {
  userHelpers.getOrders(req.session.user._id).then((order) => {
    
    let totalSpent = UserTotalOrder = 0 

    for (let i = 0; i < order.length; i++) {

      //total Amount spent      
      totalSpent += order[i].totalAmount

      //get order no -1 natural
      order[i].no = (order.length)-i 

      //converting String date to DD/MM/YYYY Format
      var orderDate = new Date(order[i].date);
      order[i].date = orderDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

      //unique products count
      order[i].totalUniqueProducts = order[i].products.length

      //total products count
      order[i].totalProducts = 0
      for (let j = 0; j < order[i].products.length; j++) {
        order[i].totalProducts = order[i].totalProducts + order[i].products[j].quantity
      }

      UserTotalOrder += order[i].totalProducts
    }
    
    totalOrders = order.length
    console.log(UserTotalOrder)


      res.render('user/view-orders',
      { 
        user,
        order,
        userlogin,
        totalOrders,
        totalSpent,
        UserTotalOrder,
        profileActive:true 
      })
    })
})

router.get('/view-order-products/:id',verifyLogin,(req,res)=>{
  userHelpers.getOrderDetails(req.params.id).then((response)=>{
    
    orderDetails=response.details
    products=response.products

    //check status of order and change stepper status according to it 
    let stepper = {}
    if (response.details.status == 'Placed') {
      stepper.placed = true
    } else if (response.details.status == 'Shipped'){
      stepper.placed = true
      stepper.shipped = true
    } else if (response.details.status == 'Delivered') {
      stepper.placed = true
      stepper.shipped = true
      stepper.delivered = true
    } else if (response.details.status == 'Cancelled'){
      stepper.cancelled = true
    }
    console.log(orderDetails)
    res.render('user/order-product-details',{userlogin,user,products,orderDetails,stepper,profileActive:true})
  })
})

router.post('/order-cancel',(req,res)=>{
  userHelpers.cancelOrder(req.body).then((response)=>{
    res.json(response)
  })
})

//--------------User Profile-------------//

router.get('/profile',verifyLogin,(req,res)=>{
  userHelpers.findUser(req.session.user._id).then((userDetails)=>{
    req.session.user=userDetails
    res.render('user/profile',{user:req.session.user,userlogin,profileActive:true,profileUpdated:req.flash('profileUpdated')})
  })
})

router.post('/profile',verifyLogin,(req,res)=>{
  userHelpers.updateProfile(req.body,req.session.user._id).then(()=>{
    req.flash('profileUpdated','Profile Updated Successfully');
    res.redirect('/profile')
  })
})


//-----------------User Password Change------------------//

//Get Change Passsword
router.get('/change-password',verifyLogin,(req,res)=>{
  if (req.session.passwordChanged) {
    req.session.user=null //clearing user session if password is changed.
    req.session.passwordChanged=null 
  }
  res.render('user/change-password',{
    user,
    userlogin,
    profileActive:true,
    passwordMismatch:req.flash('passwordMismatch'),
    passwordChanged:req.flash('passwordChanged')
  })
  
})

//POST change Password
router.post('/change-password',verifyLogin,(req,res)=>{
  let user={
    oldPassword:req.body.oldPassword,
    newPassword:req.body.newPassword,
    _id:req.session.user._id
  }
  console.log(user)
  userHelpers.changePassword(user).then((response)=>{
    if (response.status) {
      req.flash('passwordChanged','Password Changed Successfully');
      req.session.passwordChanged=true 
      res.redirect('/change-password')
    } else {
      req.flash('passwordMismatch', 'Incorrect Password Entered');
      res.redirect('/change-password')
    }
  })
})

//-------------view Addresss--------------//

router.get('/view-address',verifyLogin,((req,res)=>{
  userHelpers.getAllAddress(req.session.user._id).then((allAddress)=>{
    res.render('user/view-address',{user,userlogin,allAddress,addressAdded:req.flash('addressAdded')})
  })
}))

router.post('/add-address',verifyLogin,((req,res)=>{
  req.body.uid=uid() //to Differentiate each object pushed as array in a address field inside User collection (UID Generates random numbers (a-z,0-9)11)
  console.log(req.body); 
  userHelpers.addNewAddress(req.body).then(()=>{
    req.flash('addressAdded','New Addess Added');
    res.redirect('/view-address')
  })
}))

router.get('/delete-address/:uid',verifyLogin,(req,res)=>{
  userHelpers.deleteAddress(req.params.uid,req.session.user._id).then((response)=>{
    console.log(response);
    res.json(response)
  })
})

//-------------Wishlist----------------//

router.get('/wishlist',verifyLogin,(req,res)=>{
  userHelpers.getAllProductsWishlist(req.session.user._id).then((wishlistProducts)=>{
    res.render('user/view-wishlist',{user,userlogin,wishlistProducts})
  })
})

router.get('/add-to-wishlist/:id',verifyLogin,(req,res)=>{
  userHelpers.addToWishlist(req.params.id,req.session.user._id).then((response)=>{
    console.log(response)
    res.json(response) 
  })
})

router.get('/remove-from-wishlist/:productId',verifyLogin,(req,res)=>{
  userHelpers.removeProductFromWishlist(req.params.productId,req.session.user._id).then(async(response)=>{
    let wishlistItems = await userHelpers.getAllProductsWishlist(req.session.user._id)
    res.json(wishlistItems.length)
  })
})




//-------------Twilio Otp API----------// 

// Get Otp login Page
router.get('/otp',(req,res)=>{

  otpSend=req.session.otpSend //if false display enter phone number section else show enter otp section
  noaccount=req.session.noaccount //error message that shows if the phone number entered is connected to any account
  otpResend=req.session.otpResend //success message that shows otp resend
  wrongOtp=req.session.otpLoginErr //wrong otp message

  res.render('user/otp-login',{otpSend,noaccount,otpResend,removeFooter:true,wrongOtp})

  //removing all error data from session to prevent error messages reapppearing while refreshing
  req.session.otpLoginErr=req.session.otpResend=req.session.noaccount=null 
})

//POST Send Otp To Twilio 
router.post('/sendotp',(req,res)=>{
  console.log(req.body);
  userHelpers.checkUser(req.body).then((response)=>{
    console.log(response);
    req.session.tempUser=response.user
    if (response.user) {
      let ph_no=(`+91${req.body.phonenumber}`)
      req.session.phonenumber=ph_no;
      client.verify.v2.services(serviceId)
                .verifications
                .create({to: ph_no, channel: 'sms'})
                .then(verification =>{
                  console.log(verification.status)
                  req.session.otpSend=true
                  res.redirect('/otp')
                })
    } else {
      req.session.noaccount=true
      res.redirect('/otp')
    }
  })
})

//Resend Otp Ajax Request using Phone Number Stored in Session
router.get('/resend-otp', (req, res) => {
  let mobileNumber = req.session.phonenumber
  client.verify.v2.services(serviceId)
    .verifications
    .create({ to: mobileNumber, channel: 'sms' })
    .then((verification) => {
      console.log(verification.status);
      req.session.otpResend = true
      res.redirect('/otp')
    })
})

//Service to Verify Otp from client using Phone Number stored in Session and Otp from Body
router.post('/verifyotp',(req,res)=>{
  let ph_no=req.session.phonenumber
  let otp = req.body.otp

  client.verify.v2.services(serviceId)
      .verificationChecks
      .create({to: ph_no , code: otp})
      .then(verification_check => {
        console.log(verification_check.status)
        if (verification_check.status=='approved') {
          req.session.user=req.session.tempUser
          req.session.otpSend=req.session.phonenumber=req.session.tempUser=null
          res.redirect('/')
          
        }else{
          console.log("wrong otp");
          req.session.otpLoginErr=true
          res.redirect('/otp')
        }
      });
})


//User logout Clearing Cookies and redirecting back to landing page
router.get('/logout',verifyLogin,(req,res)=>{
  console.log(req.session);
  req.session.user=null
  res.redirect('/')
})






module.exports = router;
