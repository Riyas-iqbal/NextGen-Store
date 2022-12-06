var express = require('express');
var router = express.Router();
var userHelpers = require('../helpers/user-helpers')
var productHelpers = require('../helpers/product-helpers');
const { order } = require('paypal-rest-sdk');
const { uid } = require('uid')


//Custom middleware to check if admin is logged in
const verifyLogin = (req, res, next) => {
    if (req.session.admin) {
        next()
    } else {
        res.redirect('/admin')
    }
}

// Get Admin Login Page
router.get('/', (req, res) => {
    if (req.session.admin) {
        res.redirect('/admin/home')
    } else {
        res.render('admin/login', { AdminloginErr: req.session.loginErr, error: true, removeFooter: true });
        req.session.loginErr = null;
    }
});

//Get Admin Dashboard after successfull login
router.get('/home', verifyLogin, async (req, res) => {

    let totalUsers = await userHelpers.getTotalUserCount()

    let totalProducts = await userHelpers.getTotalProductsCount()

    let monthlySales = await userHelpers.getMonthlySales()

    let yearlySales = await userHelpers.getYearlySales()

    let pendingOrder = await userHelpers.getStatusCount('Pending')
    let PlacedOrder = await userHelpers.getStatusCount('Placed')
    let cancelledOrder = await userHelpers.getStatusCount('Cancelled')

    pendingOrderPercentage = parseInt(pendingOrder * (100 / (pendingOrder + PlacedOrder)))

    res.render('admin/admin-dashboard',
        {
            layout: 'adminLayout',
            dashboardActive: true,
            totalUsers,
            totalProducts,
            monthlySales,
            yearlySales,
            pendingOrderPercentage,
            PlacedOrder,
            pendingOrder,
            cancelledOrder
        })
});

//Admin Login Credintials Validation
router.post('/login', (req, res) => {
    const adminID = "admin@gmail.com";
    const adminPass = "ad";
    if (req.body.email == adminID && req.body.password == adminPass) {
        req.session.admin = req.body
        req.session.adminLog = true
        res.redirect('/admin/home')
    }
    else {
        req.session.loginErr = true;
        res.redirect('/admin')
    }
})


//---------------------USERS---------------------//

//Get View Users Page
router.get('/view-users', verifyLogin, (req, res) => {
    userHelpers.getAllUsers().then((users) => {
        res.render('admin/view-users', { users, layout: 'adminLayout', usersActive: true })
    })
});

//Block User from login
router.get('/blockuser/:id', (req, res) => {
    userHelpers.blockUser(req.params.id).then((blockeduser) => {
        console.log('Blockd user Id' + blockeduser.name)
        req.session.user = null
        req.session.userlogin = null
        res.redirect('/admin/view-users')
    });
})

//Unblock User from Login 
router.get('/unblockuser/:id', function (req, res, next) {
    userHelpers.unblockUser(req.params.id).then((blockeduser) => {
        console.log('Unblocked user Id' + blockeduser.name)
        res.redirect('/admin/view-users')
    });
})


//--------------Product Management----------------//

//View All Products
router.get('/view-products', verifyLogin, (req, res) => {
    productHelpers.getAllProducts().then((products) => {
        res.render('admin/view-products', { layout: 'adminLayout', products, productActive: true })
    })
})

//Get Add Product page
router.get('/add-products', verifyLogin, (req, res) => {
    productHelpers.getAllCategory().then((category) => {
        res.render('admin/add-products', { layout: 'adminLayout', category, productActive: true })
    })


})

//POST Admin Add Product
router.post('/add-products', (req, res) => {
    console.log(req.body)
    console.log(req.files)
    productHelpers.addProduct(req.body, (insertedId) => {
        console.log(insertedId)
        let image = req.files.image
        let image1 = req.files.image1
        let image2 = req.files.image2
        image.mv('./public/product-image/' + insertedId + '.jpg', (err, done) => {
            image1.mv('./public/product-image/' + insertedId + '1.jpg', (err, done) => {
                image2.mv('./public/product-image/' + insertedId + '2.jpg', (err, done) => {
                    if (!err) {
                        res.redirect('/admin/add-products')
                    }
                    else console.log(err)
                })
            })
        })
    })
})


//Delete a product using id
router.get('/delete-product/:id', (req, res) => {
    let productId = req.params.id
    productHelpers.deleteProduct(productId).then(() => {
        res.redirect('/admin/view-products')
    })
});

//Get Admin Edit Product Page based on product id
router.get('/edit-product/', (req, res) => {
    console.log(req.query.id)
    productHelpers.getAllCategory().then((category) => {
        productHelpers.getProductDetails(req.query.id).then((product) => {
            res.render('admin/edit-product', { layout: 'adminLayout', product, category, productActive: true })
        })
    })
});

//POST Admin Edit Product 
router.post('/update-product/:id', (req, res) => {
    console.log(req.body)
    productHelpers.updateProduct(req.params.id, req.body).then(() => {
        if (req.files) {
            let image = req.files.image;
            let image1 = req.files.image1;
            let image2 = req.files.image2;
            if (image) {
                image.mv('./public/product-image/' + req.params.id + '.jpg', (err, done) => {
                    if (err) {
                        console.log(err)
                    }
                })
            }
            if (image1) {
                image1.mv('./public/product-image/' + req.params.id + '1.jpg', (err, done) => {
                    if (err) {
                        console.log(err)
                    }
                })
            }
            if (image2) {
                image2.mv('./public/product-image/' + req.params.id + '2.jpg', (err, done) => {
                    if (err) {
                        console.log(err)
                    }
                })
            }
        }
        res.redirect('/admin/view-products')
    })
});


//-----------------Category Management--------------//

//View All Category + add new catgeory
router.get('/view-category', verifyLogin, (req, res) => {
    productHelpers.getAllCategory().then((category) => {
        categoryExist = req.session.categoryExist
        res.render('admin/view-category', { layout: 'adminLayout', category, categoryExist, categoryActive: true })
        req.session.categoryExist = null
    })
})

//POST Add new category after checking if that category exist based on category name
router.post('/add-category', (req, res) => {
    let categoryObj = {}
    categoryObj.category = req.body.category.toLowerCase()
    categoryObj.description = req.body.description
    console.log(categoryObj);
    productHelpers.addCategory(categoryObj).then((response) => {
        if (response) {
            req.session.categoryExist = true
            res.redirect('/admin/view-category')
        } else {
            res.redirect('/admin/view-category')
        }
    })
})

//Delete Category using category name
router.get('/delete-category/', (req, res) => {
    console.log(req.query.name)
    productHelpers.deleteCategory(req.query.name).then((product) => {
        res.redirect('/admin/view-category')
    })
});

//edit category
router.get('/edit-category/', (req, res) => {
    if (req.query.name) {
        category = req.query.name
        req.session.category = category
    } else {
        category = req.session.categoryName
        console.log("hii");
    }
    productHelpers.getCategoryDetails(category).then((category) => {
        categoryExist = req.session.categoryExist
        res.render('admin/edit-category', { layout: 'adminLayout', category, categoryExist, categoryActive: true })
        req.session.categoryExist = null
    })
});

//update category using id | passing category name from /edit-category through session while redirecting if category already exist while updating
router.post('/update-category/', (req, res) => {
    category = req.body
    category.id = req.query.id
    console.log(category);
    productHelpers.editCategory(category).then((response) => {
        if (response) {
            req.session.categoryExist = true
            req.session.categoryName = req.session.category
            console.log('category exist');
            res.redirect('/admin/edit-category')
        } else {
            console.log('category updated')
            res.redirect('/admin/view-category')
        }
    })
})

//-------------Order Management-----------//


router.get('/view-orders', verifyLogin, (req, res) => {
    userHelpers.getAllOrdersAdmin().then((order) => {
        res.render('admin/view-orders', { layout: 'adminLayout', order, ordersActive: true })
    })
})

router.post('/change-order-status', (req, res) => {
    console.log(req.body)
    userHelpers.changeOrderStatus(req.body).then((response) => {
        res.json(response)
    })
})

//-------------Offer Management-----------//

router.get('/view-offers', verifyLogin, (req, res) => {
    productHelpers.getAllCategoryOffers().then((categoryOffers) => {
        res.render('admin/view-offers',
            {
                layout: 'adminLayout',
                categoryOffers,
                offersActive: true
            })
    })
})

router.get('/add-category-offer', verifyLogin, (req, res) => {
    productHelpers.getAllCategory().then((category) => {
        res.render('admin/add-catergory-offer',
            {
                layout: 'adminLayout',
                category,
                offersActive: true
            })
    })
})

router.post('/add-category-offer', verifyLogin, (req, res) => {
    console.log(req.body)
    productHelpers.addCategoryOffer(req.body).then((response) => {
        res.redirect('/admin/view-offers')
    })
})

router.get('/remove-category-offer/:categoryName', verifyLogin, (req, res) => {
    productHelpers.removeCategoryOffer(req.params.categoryName).then(() => {
        res.redirect('/admin/view-offers')
    })
})

//-------------Banner Management-----------//

router.get('/view-banner', verifyLogin, (req, res) => {
    productHelpers.findBanner().then((banner) => {
        res.render('admin/view-banner',
            {
                layout: 'adminLayout',
                bannerActive: true,
                banner
            })
    })
})

router.post('/update-banner', verifyLogin, (req, res) => {
    console.log(req.body)
    console.log(req.files)
    productHelpers.updateBanner(req.body).then(() => {
        if (req.files) {
            let image1 = req.files.image1;
            let image2 = req.files.image2;
            if (image1) {
                image1.mv('./public/banner/banner1.jpg', (err, done) => {
                    if (err) {
                        console.log(err)
                    }
                })
            }
            if (image2) {
                image2.mv('./public/banner/banner2.jpg', (err, done) => {
                    if (err) {
                        console.log(err)
                    }
                })
            }
        }
        res.redirect('/admin/view-banner')
    })
})



//-------------Coupon Management-----------//

router.get('/view-coupons', verifyLogin, (req, res) => {

    userHelpers.getAllCoupons().then((coupons) => {
        res.render('admin/view-coupons',
            {
                layout: 'adminLayout',
                couponsActive: true,
                coupons
            })
    })

})

router.post('/add-coupon', verifyLogin, (req, res) => {
    req.body.name = req.body.name.toUpperCase();
    req.body.discount = parseInt(req.body.discount)
    req.body.coupon_code = uid(5) //(UID Generates unique string (a-z,0-9) with argument as length)
    console.log(req.body)
    userHelpers.addCoupon(req.body).then((response) => {
        res.redirect('/admin/view-coupons')
    })
})

router.get('/delete-coupon/:coupon_code', verifyLogin, (req, res) => {
    console.log('call received')
    userHelpers.deleteCoupon(req.params.coupon_code).then((response) => {
        res.json(response)
    })
})






//Admin logout
router.get('/logout', function (req, res) {
    req.session.adminLogged = false
    req.session.admin = null
    res.redirect('/admin')
});



module.exports = router;