var db=require('../config/connection')
var collection=require('../config/collections')
const { resolve } = require('promise')
const { response } = require('express')
var objectId=require('mongodb').ObjectId
module.exports={
    addProduct:(product,callback)=>{
        product.price=parseInt(product.price)
        product.mrp=parseInt(product.price)
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data)=>{
            console.log(data.insertedId)
            callback(data.insertedId)
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    getLatestProducts:(limit)=>{
        return new Promise(async(resolve,reject)=>{
            let newProducts=await db.get().collection(collection.PRODUCT_COLLECTION).find().limit(limit).sort({$natural:-1}).toArray()
            resolve(newProducts)
        })
    },
    deleteProduct:(productId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(productId)}).then((response)=>{
                console.log(response)
                resolve()
            })
        })
    },
    getProductDetails:(productId)=>{
        return new Promise((resolve,reject)=>{
            try {
                db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(productId)}).then((product)=>{
                    console.log(product);
                    resolve(product)
                })
            } catch (error) {
                console.log(productId)
                console.log('Product id received is not valid',productId)
                console.log(error)
                
            }
        })
    },
    updateProduct:(productId,productDetails)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(productId)},{
                $set:{
                    name:productDetails.name,
                    price:parseInt(productDetails.price),
                    mrp:parseInt(productDetails.price),
                    description:productDetails.description,
                    category:productDetails.category,
                    ram:productDetails.ram,
                    storage:productDetails.storage
                }
            }).then(()=>{
                resolve()
            })
        })
    },

    // ----------category section--------------

    getAllCategory:()=>{
        return new Promise(async(resolve,reject)=>{
            let category=await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(category)
        })
    },
    addCategory:(categoryObj)=>{
        return new Promise(async(resolve,reject)=>{
            let category= await db.get().collection(collection.CATEGORY_COLLECTION).findOne({category:categoryObj.category})
            if (category) {
                console.log(category);
                let categoryExist=true
                resolve(categoryExist)
            } else {
                db.get().collection(collection.CATEGORY_COLLECTION).insertOne(categoryObj)
                resolve()
            }
        })
    },
    deleteCategory:(categoryName)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({category:categoryName}).then((response)=>{
                console.log('Deleted Product '+response)
                resolve()
            })
        })
    },
    getCategoryProduct:(categoryName)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).find({category:categoryName}).toArray().then((products)=>{
                console.log(products)
                resolve(products)
            })
        })
    },
    getCategoryDetails:(categoryName)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({category:categoryName}).then((category)=>{
                resolve(category)
            })
        })
    },
    editCategory:(categoryObj)=>{
        return new Promise(async(resolve, reject) => {
            let category= await db.get().collection(collection.CATEGORY_COLLECTION).findOne({category:categoryObj.category})
            if (category) {
                console.log('Category Already exist');
                let categoryExist=true
                resolve(categoryExist)
            } else {
                db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:objectId(categoryObj.id)},{
                    $set:{
                        category:categoryObj.category,
                        description:categoryObj.description
                    }
                }).then((updatedCategory)=>{
                    console.log('Updated Category is '+updatedCategory);
                    resolve()
                })
            }
        })
    },

    //--------------------------Category Offer------------------------------//

    addCategoryOffer:(offer)=>{
        return new Promise((resolve,reject)=>{
            offer.percentage = parseInt(offer.percentage)
            offer.max_discount = parseInt(offer.max_discount)
            offer.type = 'category'
            
            db.get().collection(collection.OFFER_COLLECTION).insertOne(offer)
            .then((InsertResponse)=>{

                db.get().collection(collection.PRODUCT_COLLECTION).updateMany( 
                    {
                        category : offer.category
                    },
                    [
                        {
                            $set: { 
                                price: {            //set value of price according to ofer
                                    $round:             //round off final value
                                    [ 
                                        { 
                                            $subtract: [                //subract discount value from original price 
                                                '$mrp' ,
                                                { 
                                                    $cond:                  //condition to check if the discount value exceeds max_discount offer
                                                    { 
                                                        if:                     //if discount percentage value <= max_discount then discount percentage value
                                                                                //will be subracted from original price

                                                            { $lte: [ { $multiply: [ '$mrp' , (offer.percentage/100) ] } , offer.max_discount ] },

                                                            then: { $multiply: [ '$mrp' , (offer.percentage/100) ] }, 

                                                        else:                   //else max_discount will subracted from original price
                                                            offer.max_discount 
                                                    } 
                                                } 
                                            ] 
                                        } 
                                    , 0 ] 
                                },
                                cat_offer:true
                            }  
                        }
                    ]
                  )
                  .then((UpdateResponse)=>{
                    console.log(UpdateResponse)
                    resolve(InsertResponse)
                  })
                  .catch((error)=>{
                    console.log(error)
                  })

            })
            .catch((error)=>{
                console.log(error)
            })
        })
    },

    getAllCategoryOffers:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.OFFER_COLLECTION)
                .find()
                .sort({$natural:-1})
                .toArray()
                .then((allCategoryOffers)=>{
                    resolve(allCategoryOffers)
                })
        })
    },

    removeCategoryOffer:(categoryName)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.OFFER_COLLECTION).deleteOne({ category : categoryName }).then((response)=>{
                console.log(response)

                db.get().collection(collection.PRODUCT_COLLECTION).updateMany(
                    {
                        category : categoryName
                    },
                    [
                        {
                           $set : {
                            price: '$mrp',
                            cat_offer: null
                           } 
                        }
                    ]
                )
                .then((deleteResponse)=>{
                    console.log(deleteResponse)
                    resolve()
                })
                .catch((error)=>{
                    console.log(error)
                })
            })
        })
    },

    //------------------------banner------------------------//

    updateBanner:(banner)=>{
        return new Promise(async(resolve,reject)=>{
            let bannerExist =await db.get().collection(collection.BANNER_COLLECTION).findOne({})
            console.log('Find Banner Result \n', bannerExist)
            if (bannerExist) {
                db.get().collection(collection.BANNER_COLLECTION).updateOne({},{
                    $set:{
                        title1 : banner.title1,
                        name1 : banner.name1,
                        description1 : banner.description1,
                        title2 : banner.title1,
                        name2 : banner.name2,
                        description2 : banner.description2
                    }
                }).then((response)=>{
                    console.log(response)
                    resolve()
                }).catch((error)=>{
                    console.log(error)
                })
            } else {
                db.get().collection(collection.BANNER_COLLECTION).insertOne(banner).then((response)=>{
                    console.log(response)
                    resolve()
                })
            }            
        })
    },

    findBanner:()=>{
        return new Promise((resolve,reject)=>{
            try {
                db.get().collection(collection.BANNER_COLLECTION).findOne({}).then((response)=>{
                    resolve(response)
                })   
            } catch (error) {
                console.log('Error Happened In Find Banner')
                console.log(error)
            } 
        })
    },

    getSearchProducts:(name)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ name: { $regex : name , $options: 'i' } })
                .then((products)=>{

                    console.log(products)

                    resolve(products)
                })
                .catch((e)=>{
                    console.log(e)
                })
        })
    }



}