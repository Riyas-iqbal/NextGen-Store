const db = require('../config/connection')
const collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { resolve, reject } = require('promise')
const { response } = require('express')
const objectId = require('mongodb').ObjectId
const paypal = require('paypal-rest-sdk');

//Razorpay integration
const Razorpay = require('razorpay')
const Razorpay_key_secret = process.env.RAZORPAY_KEY_SECRET
let Razorpay_id = process.env.RAZORPAY_KEY_ID

var instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: Razorpay_key_secret,
});


module.exports = {
    doSignup: ((userData) => {
        return new Promise(async (resolve, reject) => {
            let emailExist = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            let phonenumberExist = await db.get().collection(collection.USER_COLLECTION).findOne({ phonenumber: userData.phonenumber })
            if (emailExist || phonenumberExist) {
                if (emailExist) {
                    let userExist = 'email'
                    resolve(userExist)
                } else if (phonenumberExist) {
                    let userExist = 'phonenumber'
                    resolve(userExist)
                }
            } else {
                userData.password = await bcrypt.hash(userData.password, 10)
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then(resolve()).catch((err) => console.error(err))
            }
        })
    }),



    doLogin: ((userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })

            if (user) {
                bcrypt.compare(userData.password,user.password).then((status) => {
                    if (status) {
                        console.log("User login Success");
                        response.user = user
                        response.status = true

                        if (user.isBlocked == false) {
                            console.log("Login Success")
                            response.blockStatus = true;
                            resolve(response)
                        } else {
                            console.log("user is blocked")
                            response.userIsBlocked = true;
                            resolve(response)
                        }
                    } else {
                        console.log("login Wrong Password ");
                        resolve({ status: false })
                    }
                }).catch((err) => {
                    console.log('error in DoLogin');
                    console.log(err)
                })
            } else {
                console.log("login Failed User doesnt Exist");
                resolve({ status: false })
            }
        })
    }),
    checkUser: (userData) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ phonenumber: userData.phonenumber })
            if (user) {
                console.log(`user is ${user}`);
                response.user = user
                resolve(response)
            } else {
                console.log("user not found");
                resolve(response)
            }
        })
    },

    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            console.log(users);
            resolve(users)
        })
    },
    blockUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: {
                    isBlocked: true
                }
            }).then((response) => {
                db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }).then((user) => {
                    resolve(user)
                })
            })
        })
    },
    unblockUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: {
                    isBlocked: false
                }
            }).then((response) => {
                db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }).then((user) => {
                    resolve(user)
                })
            })
        })
    },
    updateProfile: (userData, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $set: {
                    name: userData.name,
                    lname: userData.lname,
                    phonenumber: userData.phonenumber,
                    state: userData.state,
                    email: userData.email,
                    country: userData.country
                }
            }).then((result) => {
                console.log(result);
                resolve(result)
            })
        })
    },
    findUser: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }).then((user) => {
                console.log(user)
                resolve(user)
            })
        })
    },

    changePassword: ((userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userData._id) })
            console.log("hi");
            bcrypt.compare(userData.oldPassword, user.password).then(async (status) => {
                //bcrypt.compare returns true if the password matches 
                if (status) {
                    response.user = user
                    response.status = true
                    userData.newPassword = await bcrypt.hash(userData.newPassword, 10)
                    db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userData._id) },
                        {
                            $set: {
                                password: userData.newPassword
                            }
                        }).then(() => {
                            resolve(response)
                        })
                } else {
                    console.log("Password Mismatch");
                    response.status = false;
                    resolve(response)
                }
            })
        })
    }),


    //Add to Cart Riyas

    // addToCart:(proId,userId)=>{
    //     return new Promise(async(resolve,reject)=>{
    //         let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
    //         if (userCart) {
    //             db.get().collection(collection.CART_COLLECTION).updateOne({user:ObjectId(userId)},
    //                 {
    //                     $push:{
    //                         products:ObjectId(proId)
    //                     }
    //                 }
    //             )
    //             .then((response)=>{
    //                 resolve()
    //             })
    //         } else {
    //             let cartObj={
    //                 user:objectId(userId),
    //                 products:[objectId(proId)]
    //             }
    //             db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
    //                 resolve()
    //             })
    //         }
    //     })
    // },
    // getCartProducts:(userId)=>{
    //     return new Promise(async(resolve,reject)=>{
    //          let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
    //             {
    //                 $match:{user:objectId(userId)}
    //             },
    //             {
    //                 $lookup:{
    //                     from:collection.PRODUCT_COLLECTION,
    //                     let:{proList:'$products'},
    //                     pipeline: [
    //                         {
    //                             $match:{
    //                                 $expr:{
    //                                     $in:['$_id','$$prodList']
    //                                 }
    //                             }
    //                         }
    //                     ],
    //                     as:'cartItems'
    //                 }
    //             }
    //          ]).toArray()
    //          resolve()

    //     })
    // }




    //Add to cart P

    addToCart: (proId, userId) => {
        let prodObj = {
            item: objectId(proId),
            quantity: 1,
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then(() => {
                            resolve()
                        })
                } else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {

                                $push: { products: prodObj }

                            }).then((response) => {
                                resolve()
                            })
                }

            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [prodObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then(() => {
                    resolve()
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()

            if (cartItems.length === 0) {
                resolve()

            } else {
                resolve(cartItems)
            }  

        })

    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                resolve({ Nothing: true })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }

                        }
                    ).then((response) => {

                        resolve({ status: true })
                    })
            }



        })
    },
    removeItem: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({ _id: objectId(details.cart) },
                    {
                        $pull: { products: { item: objectId(details.product) } }
                    }
                ).then(() => {
                    resolve(true)
                })
        })
    },
    emptyCart: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(userId) }).then((response) => {
                resolve(response)
            })
        })
    },
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let totalAmount = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$product.price'] } }
                    }
                }

            ]).toArray()

            console.log(totalAmount)
        
            if (totalAmount.length == 0) {
                resolve({ status: true })
            } else {
                resolve(totalAmount[0].total)
            }

        })
    },
    getTotalOfOneProduct: (userId, proId) => {
        // console.log(proId)
        return new Promise(async (resolve, reject) => {
            let totalAmount = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { $and: [{ user: objectId(userId) }, { 'products.item': objectId(proId) }] }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $match: { item: objectId(proId) }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $project: {
                        //_id:null,
                        total: { $sum: { $multiply: ['$quantity', '$product.price'] } }
                    }
                }

            ]).toArray()
            if (totalAmount.length == 0) {
                resolve({ status: true })
            } else {
                // console.log("********************");
                // console.log(totalAmount[0].total);
                resolve(totalAmount[0].total)
            }

        })
    },

    //order

    placeOrder: (order, products, total) => {
        return new Promise(async (resolve, reject) => {
            let status = order.paymentMethod === 'COD' ? 'Placed' : 'Pending'

            if (order.coupon) {
                console.log('coupon found')
            }else{
                order.coupon=null
            }

            let address = await db.get().collection(collection.USER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(order.userId) },
                },
                {
                    $unwind: '$address'
                },
                {
                    $project: {
                        _id: 0,
                        name: '$address.name',
                        email: '$address.email',
                        phone: '$address.phone',
                        address: '$address.address',
                        state: '$address.state',
                        pincode: '$address.pincode',
                        location: '$address.location',
                        uid: '$address.uid'
                    }
                }, {
                    $match: { uid: order.address }
                }
            ]).toArray()
            let orderObj = {
                deliveryDetails: address[0],
                userId: objectId(order.userId),
                paymentMethod: order.paymentMethod,
                products: products,
                totalAmount: total,
                status: status,
                coupon : order.coupon,
                date: new Date().toLocaleString('en-US')
            }
            console.log(orderObj)

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                console.log(response)
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
                resolve(response.insertedId)
            })
        })
    },
    generateRazorpay: (orderId, totalPrice) => {
        return new Promise((resolve, reject) => {
            orderId_string = orderId.toString()
            var options = {
                amount: totalPrice * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: orderId_string
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err)
                }
                console.log(order);
                resolve(order)
            });
        })
    },
    createPay:( payment ) => {
        return new Promise( ( resolve , reject ) => {
            paypal.payment.create( payment , function( err , payment ) {
             if ( err ) {
                 reject(err); 
             }
            else {
                resolve(payment); 
            }
            }); 
        });
    },
    
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256', 'UComcrPtLwU59KNUfoRnpgmz')
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            console.log("sig received ", details['payment[razorpay_signature]']);
            console.log("sig generated ", hmac);
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                console.log('sig mismatch in verify payment');
                reject()
            }
        })
    },
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: objectId(orderId) },
                    {
                        $set: {
                            status: 'Placed'
                        }
                    }).then(() => {
                        resolve()
                    })
        })
    },

    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart.products)
        })
    },
    getOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let order = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectId(userId) }).sort({ $natural: -1 }).toArray()
            resolve(order)
        })
    },
    getOrderDetails: (orderId) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()
                .then(async (products) => {
                    let orderDetails = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                        {
                            $match: { _id: objectId(orderId) }
                        }, {
                            $project: {
                                deliveryDetails: 1,
                                paymentMethod: 1,
                                totalAmount: 1,
                                status: 1,
                                date: 1,
                                coupon: 1
                            }
                        }
                    ]).toArray()
                    response.products = products
                    response.details = orderDetails[0]
                    resolve(response)
                })
        })
    },
    cancelOrder: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: objectId(details.order) },
                    {
                        $set: { status: "Cancelled" }

                    }
                ).then((response) => {
                    resolve({ status: true })
                })
        })
    },

    ///admin

    getAllOrdersAdmin: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).find().sort({ $natural: -1 }).toArray().then((allOrders) => {
                console.log(allOrders)
                resolve(allOrders)
            })
        })
    },
    changeOrderStatus: (orderDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderDetails.order) }, {
                $set: {
                    status: orderDetails.stat
                }
            }).then((response) => {
                resolve({ status: true })
            })
        })
    },


    addNewAddress: (address) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(address.userId) }, {
                $push: {
                    address: address
                }
            }).then(() => {
                resolve()
            })
        })
    },
    getAllAddress: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).aggregate([
                {
                    $match: {
                        _id: objectId(userId)
                    }
                },
                {
                    $unwind: '$address'
                },
                {
                    $project: {
                        address: 1
                    }
                }
            ]).toArray()
                .then((response) => {
                    console.log(response);
                    resolve(response)
                })
        })
    },
    deleteAddress: (uid, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) }, {
                $pull: {
                    address: {
                        uid: uid
                    }
                }
            }).then((response) => {
                resolve(response)
            })
        })
    },
    addToWishlist: (productId, userId) => {
        return new Promise(async (resolve, reject) => {
            let proExist = await db.get().collection(collection.USER_COLLECTION).findOne( {$and: [{_id:objectId(userId)},{wishlist:objectId(productId)}]}  )
            console.log('product exist in wishlist');
            if (proExist) {
                let response={
                    exist:true
                }
                resolve(response)
            } else {
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) },
                {
                    $addToSet: {
                        wishlist: objectId(productId)
                    }
                }).then((response) => {
                    resolve(response)
                })
            }
        })
    },
    getAllProductsWishlist: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(userId) }
                },
                {
                    $unwind: '$wishlist'
                },
                {
                    $project: {
                        wishlist: '$wishlist'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'wishlist',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
                .then((response) => {
                    console.log(response);
                    resolve(response)
                })
        })
    },
    removeProductFromWishlist: (productId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) },
                {
                    $pull: {
                        wishlist: objectId(productId)
                    }
                })
                .then((response) => {
                    console.log(response)
                    resolve(response)
                }).catch((err) => {
                    console.log(err)
                })
        })
    },

    getWishlistProductsId: (userId) => {
        return new Promise((resolve,reject) => {
            db.get().collection(collection.USER_COLLECTION)
                
            .findOne(
                { _id: objectId(userId) },
                { projection:{ _id : 0 , wishlist : 1} })
                
            .then((response)=>{
                resolve(response.wishlist)
            })
        })
    },

    



    //--------------------------ADMIN DASHBOARD--------------------------//


    getTotalUserCount: ()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).countDocuments().then((count)=>{
                resolve(count)
            })
        })
    },

    getTotalProductsCount: ()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).countDocuments().then((count)=>{
                resolve(count)
            })
        })
    },

    getStatusCount: (status)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).countDocuments({status:status}).then((response)=>{
                resolve(response)
            })
        })
    },

    getMonthlySales: () => {
        return new Promise(async (resolve, reject) => {
            let monthNumber = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {},
                },
                {
                    $group: {
                        _id: { month: { $month: { $toDate: "$date" } } },
                        total: { $sum: "$totalAmount" },
                    },
                },
                {
                    $sort: { _id: 1 },
                },
                {
                    $project: { _id: 0, month: "$_id.month", total: 1 },
                },
            ])
                .toArray()
            monthNumber.forEach((element) => {
                function toMonthName(monthNumber) {
                    const date = new Date();
                    date.setMonth(monthNumber - 1);

                    return date.toLocaleString("en-US", {
                        month: "long",
                    });
                }
                element.month = toMonthName(element.month);
            })
            resolve(monthNumber)
        })
    },

    getYearlySales: ()=>{
        return new Promise(async(resolve,reject)=>{
            let monthNumber = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                  $match: {},
                },
                {
                  $group: {
                    _id: { month: { $year: { $toDate: "$date" } } },
                    total: { $sum: "$totalAmount" },
                  },
                },
                {
                  $sort: { _id: 1 },
                },
                {
                  $project: { _id: 0, year: "$_id.month", total: 1 },
                },
              ])
              .toArray()
              resolve(monthNumber)
        })
    },


    //--------------------------Manage Coupons--------------------------//


    addCoupon:(coupon)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.COUPON_COLLECTION).insertOne(coupon).then((response)=>{
                console.log(response)
                resolve(response)
            })
        })
    },

    getAllCoupons:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.COUPON_COLLECTION).find().toArray().then((coupons)=>{
                console.log(coupons);
                resolve(coupons)
            })
        })
    },

    deleteCoupon:(coupon_code)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.COUPON_COLLECTION).deleteOne({ coupon_code : coupon_code}).then((response)=>{
                console.log(response)
                resolve(response)
            })
        })
    },

    checkCoupon:(coupon_code)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.COUPON_COLLECTION).findOne({ coupon_code : coupon_code}).then((response)=>{
                resolve(response)
            })
        })
    }


}