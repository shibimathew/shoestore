// <!--       
//        <div class="filter-section">
//          <div class="filter-title">Brands</div>
//          <div class="category-brand-container">
//            <ul>
//             <%for (let i=0; i<brand.length;i++){%>
//                <li class="filter-item">
//                  <a href="/filter?brand=<%=brand[i]._id%>"><%=brand[i].brandName%></a>
//                </li>
//                <%}%>
//            </ul>
//          </div>
//        </div> --> //after category


// <main class="product-grid">
// <% for (let i=0;i<products.length;i++){ %>
//    <div class="product-card">
//      <span class="wishlist-btn" onclick="">❤️</span>
//      <a href="">
//        <img src="<% products[i].images[0] %>" alt="<%= products[i].productName %>" />
//        <h4><%=products[i].productName%></h4>
//        <!-- <p>Brand:<%products[i].brand%></p> -->
//        <p>Price:₹<%=products[i].salePrice.toLocateString('en-IN')%><span class="text-muted"><strike>₹<%=products[i].regularPrice.toLocateString('en-IN')%></strike></span></p>
//      </a>
//      <button class="add-to-cart-btn" onclick="">Add to Cart</button>
//    </div>
//    <%}%>
// </main>
// </div>




// ﻿<%- include('../partials/user/header.ejs') %>

// <style>
// .zoom-container {
//     position: relative;
//     display: inline-block;
// }

// .zoom-image {
//     width: 100%;
//     display: block;
// }
// </style>
    
    

//     <header class="header-area header-style-1 header-height-2">
//         <div class="header-top header-top-ptb-1 d-none d-lg-block">
//             <div class="container">
//                 <div class="row align-items-center">
//                     <div class="col-xl-3 col-lg-4">
//                         <div class="header-info">
//                             <ul>
//                                 <li><i class="fi-rs-smartphone"></i> <a href="#">(+01) - 2345 - 6789</a></li>
//                                 <li><i class="fi-rs-marker"></i><a  href="/contact">Our location</a></li>
//                             </ul>
//                         </div>
//                     </div>
//                     <div class="col-xl-6 col-lg-4">
//                         <div class="text-center">
                       
//                         </div>
//                     </div>
//                     <div class="col-xl-3 col-lg-4">
//                         <div class="header-info header-info-right">
//                             <ul>
//                                 <li>
//                                     <a class="language-dropdown-active" href="#"> <i class="fi-rs-world"></i> English <i class="fi-rs-angle-small-down"></i></a>
//                                     <ul class="language-dropdown">
//                                         <li><a href="#"><img src="assets/imgs/theme/flag-fr.png" alt="">Français</a></li>
//                                         <li><a href="#"><img src="assets/imgs/theme/flag-dt.png" alt="">Deutsch</a></li>
//                                         <li><a href="#"><img src="assets/imgs/theme/flag-ru.png" alt="">Pусский</a></li>
//                                     </ul>
//                                 </li>
//                                 <li><i class="fi-rs-user"></i><a href="/signup">Log in/Sign Up</a></li>
//                             </ul>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//         <div class="header-middle header-middle-ptb-1 d-none d-lg-block">
//             <div class="container">
//                 <div class="header-wrap">
//                     <div class="logo logo-width-1">
//                        <img src="assets/imgs/theme/jaeger.png" alt="logo">
//                     </div>
//                     <div class="header-right">
//                         <div class="search-style-2">
//                             <form action="#">
//                                 <!-- <select class="select-active">
//                                     <option>All Categories</option>
//                                     <option>Women's</option>
//                                     <option>Men's</option>
//                                     <option>Cellphones</option>
//                                     <option>Computer</option>
//                                     <option>Electronics</option>
//                                     <option> Accessories</option>
//                                     <option>Home & Garden</option>
//                                     <option>Luggage</option>
//                                     <option>Shoes</option>
//                                     <option>Mother & Kids</option>
//                                 </select> -->
//                                 <input type="text" placeholder="Search for items...">
//                             </form>
//                         </div>
//                         <div class="header-action-right">
//                             <div class="header-action-2">
//                                 <div class="header-action-icon-2">
//                                     <a href="shop-wishlist.html">
//                                         <img class="svgInject" alt="Evara" src="assets/imgs/theme/icons/icon-heart.svg">
//                                         <span class="pro-count blue">4</span>
//                                     </a>
//                                 </div>
//                                 <div class="header-action-icon-2">
//                                     <a class="mini-cart-icon" href="shop-cart.html">
//                                         <img alt="Evara" src="assets/imgs/theme/icons/icon-cart.svg">
//                                         <span class="pro-count blue">2</span>
//                                     </a>

//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//         <div class="header-bottom header-bottom-bg-color sticky-bar">
//             <div class="container">
//                 <div class="header-wrap header-space-between position-relative">
//                     <div class="logo logo-width-1 d-block d-lg-none">
//                         <a href="/home"><img src="assets/imgs/theme/jaeger.png" alt="logo"></a>
//                     </div>
//                     <div class="header-nav d-none d-lg-flex">
        
//                         <div class="main-menu main-menu-padding-1 main-menu-lh-2 d-none d-lg-block">
//                             <nav>
//                                 <ul>
//                                     <li><a href="/home">Home</a>
                                        
//                                     </li>
//                                     <li>
//                                         <a href="#">About</a>
//                                     </li>
//                                     <li><a class="active"  href="/shop">Shop</a>
                                       
//                                     </li>
//                                     <li class="position-static"><a href="#">Deals</a>
//                                         <ul class="mega-menu">
                                            
//                                         </ul>
//                                     </li>
                                    
                            
//                                     <li>
//                                         <a href="page-contact.html">Contact</a>
//                                     </li>
//                                 </ul>
//                             </nav>
//                         </div>
//                     </div>
//                     <div class="hotline d-none d-lg-block">
//                         <p><i class="fi-rs-headset"></i><span>Hotline</span> 1900 - 888 </p>
//                     </div>   
//                 </div>
//             </div>
//         </div>
//     </header>


//     <!-- border -->

//     <main class="main">
//         <div class="page-header breadcrumb-wrap">
//             <div class="container">
//                 <div class="breadcrumb">
//                     <a href="index.html" rel="nofollow">Home</a>
//                     <span></span> Fashion
//                     <span></span> Abstract Print Patchwork Dress
//                 </div>
//             </div>
//         </div>
//         <section class="mt-50 mb-50">
//             <div class="container">
//                 <div class="row">
//                     <div class="col-lg-12">
//                         <div class="product-detail accordion-detail">
//                             <div class="row mb-50">
//                                 <!-- Gallery Section -->
//                                 <div class="col-md-6 col-sm-12 col-xs-12">
//                                     <div class="detail-gallery">
//                                         <span class="zoom-icon"><i class="fi-rs-search"></i></span>
//                                         <!-- MAIN SLIDES -->
//                                         <div class="product-image-slider">
//                                             <% product.productImage.forEach((img, index) => { %>
//                                                 <div class="zoom-container" style="position: relative;">
//                                                     <img src="<%= product.images[0] %>" alt="product image <%= index+1 %>" class="zoom-image" style="width: 100%; height: auto;">
                                                    
//                                                 </div>
//                                             <% }); %>
//                                         </div>
                                        
                                        
//                                         <!-- THUMBNAILS -->
//                                         <div class="slider-nav-thumbnails pl-15 pr-15">
//                                             <% product.productImage.forEach((img, index) => { %>
//                                                 <div>
//                                                     <img src="<%= product.images[1] %>" alt="product image <%= index+1 %>" <%= index+1 %>" style="width: 100%; object-fit: cover;">
//                                                 </div>
//                                             <% }); %>
//                                         </div>
//                                     </div>
//                                 </div>
//                                 <!-- Detail Info Section -->
//                                 <div class="col-md-6 col-sm-12 col-xs-12">
//                                     <div class="detail-info">
//                                         <h2 class="title-detail"><%= product.productName %></h2>
//                                         <div class="product-detail-rating">
//                                             <span>Category: <a href="#"><%= product.category.name %></a></span>
//                                         </div>
//                                         <!-- Short Description -->
                                        
//                                         <div class="short-desc mb-30">
//                                             <h4><%= product.shortDescription %></h4>
//                                         </div>
//                                         <div class="product-price primary-color">
//                                             <ins><span class="text-brand">₹<%= product.salePrice %></span></ins>
//                                             <% if (product.salePrice < product.regularPrice) { %>
//                                                 <ins><span class="old-price font-md ml-15">₹<%= product.regularPrice %></span></ins>
//                                                 <span class="save-price font-md color3 ml-15">
//                                                     <%= Math.round(((product.regularPrice - product.salePrice) / product.regularPrice) * 100) %>% Off
//                                                 </span>
//                                             <% } %>
//                                         </div>
                                        
                                         
//                                         <!-- Size & Stock Availability -->
//                                         <div class="attr-detail attr-size">
//                                             <strong class="mr-10">Size</strong>
//                                             <ul class="list-filter size-filter font-small" id="size-options">
//                                                 <% Object.keys(product.variant.size).forEach(size => { %>
//                                                     <li>
//                                                         <a href="#" class="size-option" data-size="<%= size %>" data-stock="<%= product.variant.size[size] %>">
//                                                             <%= size.toUpperCase() %>
//                                                         </a>
//                                                     </li>
//                                                 <% }); %>
//                                             </ul>
//                                         </div>
//                                         <div class="stock-status mt-10">
//                                             Availability: <span id="stock-count">Select a size</span>
//                                         </div>
//                                         <div class="bt-1 border-color-1 mt-30 mb-30"></div>
//                                         <div class="product-extra-link2">
//                                             <button type="submit" class="button button-add-to-cart">Add to cart</button>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                             <!-- Description & Specifications Section -->
//                             <div class="row">
//                                 <div class="col-lg-10 m-auto entry-main-content">
//                                     <h2 class="section-title style-1 mb-30">Description</h2>
//                                     <div class="description mb-50">
//                                         <!-- Long Description -->
//                                         <p><%= product.longDescription %></p>
//                                         <!-- Specifications, rendered line by line (split by newline) -->
//                                         <h4 class="mt-30">Specifications</h4>
//                                         <ul class="product-more-infor mt-30">
//                                             <% product.specifications.split(/\r?\n/).forEach(spec => { %>
//                                                 <li><%= spec.trim() %></li>
//                                             <% }); %>
//                                         </ul>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
                        
//                         <script>
//                             $(document).ready(function() {
//                                 // Initialize the image slider first
//                                 $('.product-image-slider').slick({
//                                     slidesToShow: 1,
//                                     slidesToScroll: 1,
//                                     arrows: false,
//                                     fade: true,
//                                     asNavFor: '.slider-nav-thumbnails'
//                                 });
    
//                                 // Initialize the thumbnail slider
//                                 $('.slider-nav-thumbnails').slick({
//                                     slidesToShow: 4,
//                                     slidesToScroll: 1,
//                                     asNavFor: '.product-image-slider',
//                                     dots: false,
//                                     focusOnSelect: true
//                                 });
//                             });
//                         </script>
                            
                        
                        
                                    
//                                     <div class="social-icons single-share">
//                                         <ul class="text-grey-5 d-inline-block">
//                                             <li><strong class="mr-10">Share this:</strong></li>
//                                             <li class="social-facebook"><a href="#"><img src="assets/imgs/theme/icons/icon-facebook.svg" alt=""></a></li>
//                                             <li class="social-twitter"> <a href="#"><img src="assets/imgs/theme/icons/icon-twitter.svg" alt=""></a></li>
//                                             <li class="social-instagram"><a href="#"><img src="assets/imgs/theme/icons/icon-instagram.svg" alt=""></a></li>
//                                             <li class="social-linkedin"><a href="#"><img src="assets/imgs/theme/icons/icon-pinterest.svg" alt=""></a></li>
//                                         </ul>
//                                     </div>
//                                     <h3 class="section-title style-1 mb-30 mt-30">Reviews (3)</h3>
//                                     <!--Comments-->
//                                     <div class="comments-area style-2">
//                                         <div class="row">
//                                             <div class="col-lg-8">
//                                                 <h4 class="mb-30">Customer questions & answers</h4>
//                                                 <div class="comment-list">
//                                                     <div class="single-comment justify-content-between d-flex">
//                                                         <div class="user justify-content-between d-flex">
//                                                             <div class="thumb text-center">
//                                                                 <img src="assets/imgs/page/avatar-6.jpg" alt="">
//                                                                 <h6><a href="#">Jacky Chan</a></h6>
//                                                                 <p class="font-xxs">Since 2012</p>
//                                                             </div>
//                                                             <div class="desc">
//                                                                 <div class="product-rate d-inline-block">
//                                                                     <div class="product-rating" style="width:90%">
//                                                                     </div>
//                                                                 </div>
//                                                                 <p>Thank you very fast shipping from Poland only 3days.</p>
//                                                                 <div class="d-flex justify-content-between">
//                                                                     <div class="d-flex align-items-center">
//                                                                         <p class="font-xs mr-30">December 4, 2020 at 3:12 pm </p>
//                                                                         <a href="#" class="text-brand btn-reply">Reply <i class="fi-rs-arrow-right"></i> </a>
//                                                                     </div>
//                                                                 </div>
//                                                             </div>
//                                                         </div>
//                                                     </div>
//                                                     <!--single-comment -->
//                                                     <div class="single-comment justify-content-between d-flex">
//                                                         <div class="user justify-content-between d-flex">
//                                                             <div class="thumb text-center">
//                                                                 <img src="assets/imgs/page/avatar-7.jpg" alt="">
//                                                                 <h6><a href="#">Ana Rosie</a></h6>
//                                                                 <p class="font-xxs">Since 2008</p>
//                                                             </div>
//                                                             <div class="desc">
//                                                                 <div class="product-rate d-inline-block">
//                                                                     <div class="product-rating" style="width:90%">
//                                                                     </div>
//                                                                 </div>
//                                                                 <p>Great low price and works well.</p>
//                                                                 <div class="d-flex justify-content-between">
//                                                                     <div class="d-flex align-items-center">
//                                                                         <p class="font-xs mr-30">December 4, 2020 at 3:12 pm </p>
//                                                                         <a href="#" class="text-brand btn-reply">Reply <i class="fi-rs-arrow-right"></i> </a>
//                                                                     </div>
//                                                                 </div>
//                                                             </div>
//                                                         </div>
//                                                     </div>
//                                                     <!--single-comment -->
//                                                     <div class="single-comment justify-content-between d-flex">
//                                                         <div class="user justify-content-between d-flex">
//                                                             <div class="thumb text-center">
//                                                                 <img src="assets/imgs/page/avatar-8.jpg" alt="">
//                                                                 <h6><a href="#">Steven Keny</a></h6>
//                                                                 <p class="font-xxs">Since 2010</p>
//                                                             </div>
//                                                             <div class="desc">
//                                                                 <div class="product-rate d-inline-block">
//                                                                     <div class="product-rating" style="width:90%">
//                                                                     </div>
//                                                                 </div>
//                                                                 <p>Authentic and Beautiful, Love these way more than ever expected They are Great earphones</p>
//                                                                 <div class="d-flex justify-content-between">
//                                                                     <div class="d-flex align-items-center">
//                                                                         <p class="font-xs mr-30">December 4, 2020 at 3:12 pm </p>
//                                                                         <a href="#" class="text-brand btn-reply">Reply <i class="fi-rs-arrow-right"></i> </a>
//                                                                     </div>
//                                                                 </div>
//                                                             </div>
//                                                         </div>
//                                                     </div>
//                                                     <!--single-comment -->
//                                                 </div>
//                                             </div>
//                                             <div class="col-lg-4">
//                                                 <h4 class="mb-30">Customer reviews</h4>
//                                                 <div class="d-flex mb-30">
//                                                     <div class="product-rate d-inline-block mr-15">
//                                                         <div class="product-rating" style="width:90%">
//                                                         </div>
//                                                     </div>
//                                                     <h6>4.8 out of 5</h6>
//                                                 </div>
//                                                 <div class="progress">
//                                                     <span>5 star</span>
//                                                     <div class="progress-bar" role="progressbar" style="width: 50%;" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100">50%</div>
//                                                 </div>
//                                                 <div class="progress">
//                                                     <span>4 star</span>
//                                                     <div class="progress-bar" role="progressbar" style="width: 25%;" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">25%</div>
//                                                 </div>
//                                                 <div class="progress">
//                                                     <span>3 star</span>
//                                                     <div class="progress-bar" role="progressbar" style="width: 45%;" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100">45%</div>
//                                                 </div>
//                                                 <div class="progress">
//                                                     <span>2 star</span>
//                                                     <div class="progress-bar" role="progressbar" style="width: 65%;" aria-valuenow="65" aria-valuemin="0" aria-valuemax="100">65%</div>
//                                                 </div>
//                                                 <div class="progress mb-30">
//                                                     <span>1 star</span>
//                                                     <div class="progress-bar" role="progressbar" style="width: 85%;" aria-valuenow="85" aria-valuemin="0" aria-valuemax="100">85%</div>
//                                                 </div>
//                                                 <a href="#" class="font-xs text-muted">How are ratings calculated?</a>
//                                             </div>
//                                         </div>
//                                     </div>
//                                     <!--comment form-->
//                                     <div class="comment-form">
//                                         <h4 class="mb-15">Add a review</h4>
//                                         <div class="product-rate d-inline-block mb-30">
//                                         </div>
//                                         <div class="row">
//                                             <div class="col-lg-8 col-md-12">
//                                                 <form class="form-contact comment_form" action="#" id="commentForm">
//                                                     <div class="row">
//                                                         <div class="col-12">
//                                                             <div class="form-group">
//                                                                 <textarea class="form-control w-100" name="comment" id="comment" cols="30" rows="9" placeholder="Write Comment"></textarea>
//                                                             </div>
//                                                         </div>
//                                                         <div class="col-sm-6">
//                                                             <div class="form-group">
//                                                                 <input class="form-control" name="name" id="name" type="text" placeholder="Name">
//                                                             </div>
//                                                         </div>
//                                                         <div class="col-sm-6">
//                                                             <div class="form-group">
//                                                                 <input class="form-control" name="email" id="email" type="email" placeholder="Email">
//                                                             </div>
//                                                         </div>
//                                                         <div class="col-12">
//                                                             <div class="form-group">
//                                                                 <input class="form-control" name="website" id="website" type="text" placeholder="Website">
//                                                             </div>
//                                                         </div>
//                                                     </div>
//                                                     <div class="form-group">
//                                                         <button type="submit" class="button button-contactForm">Submit
//                                                             Review</button>
//                                                     </div>
//                                                 </form>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                             <div class="row mt-60">
//                                 <div class="col-12">
//                                     <h3 class="section-title style-1 mb-30">Related products</h3>
//                                 </div>
//                                 <div class="col-12">
//                                     <div class="row related-products">
//                                         <div class="col-lg-3 col-md-4 col-12 col-sm-6">
//                                             <div class="product-cart-wrap small hover-up">
//                                                 <div class="product-img-action-wrap">
//                                                     <div class="product-img product-img-zoom">
//                                                         <a href="shop-product-right.html" tabindex="0">
//                                                             <img class="default-img" src="assets/imgs/shop/product-2-1.jpg" alt="">
//                                                             <!-- <img class="hover-img" src="assets/imgs/shop/product-2-2.jpg" alt=""> -->
//                                                         </a>
//                                                     </div>
//                                                     <div class="product-action-1">
//                                                         <!-- <a aria-label="Quick view" class="action-btn small hover-up" data-bs-toggle="modal" data-bs-target="#quickViewModal
// "><i class="fi-rs-search"></i></a> -->
//                                                         <a aria-label="Add To Wishlist" class="action-btn small hover-up" href="shop-wishlist.html" tabindex="0"><i class="fi-rs-heart"></i></a>
//                                                         <a aria-label="Compare" class="action-btn small hover-up" href="shop-compare.html" tabindex="0"><i class="fi-rs-shuffle"></i></a>
//                                                     </div>
//                                                     <div class="product-badges product-badges-position product-badges-mrg">
//                                                         <span class="hot">Hot</span>
//                                                     </div>
//                                                 </div>
//                                                 <div class="product-content-wrap">
//                                                     <h2><a href="shop-product-right.html" tabindex="0">Ulstra Bass Headphone</a></h2>
//                                                     <div class="rating-result" title="90%">
//                                                         <span>
//                                                         </span>
//                                                     </div>
//                                                     <div class="product-price">
//                                                         <span>$238.85 </span>
//                                                         <span class="old-price">₹245.8</span>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                         <div class="col-lg-3 col-md-4 col-12 col-sm-6">
//                                             <div class="product-cart-wrap small hover-up">
//                                                 <div class="product-img-action-wrap">
//                                                     <div class="product-img product-img-zoom">
//                                                         <a href="shop-product-right.html" tabindex="0">
//                                                             <img class="default-img" src="assets/imgs/shop/product-3-1.jpg" alt="">
//                                                             <img class="hover-img" src="assets/imgs/shop/product-4-2.jpg" alt="">
//                                                         </a>
//                                                     </div>
//                                                     <div class="product-action-1">
//                                                         <a aria-label="Quick view" class="action-btn small hover-up" data-bs-toggle="modal" data-bs-target="#quickViewModal
// "><i class="fi-rs-search"></i></a>
//                                                         <a aria-label="Add To Wishlist" class="action-btn small hover-up" href="shop-wishlist.html" tabindex="0"><i class="fi-rs-heart"></i></a>
//                                                         <a aria-label="Compare" class="action-btn small hover-up" href="shop-compare.html" tabindex="0"><i class="fi-rs-shuffle"></i></a>
//                                                     </div>
//                                                     <div class="product-badges product-badges-position product-badges-mrg">
//                                                         <span class="sale">-12%</span>
//                                                     </div>
//                                                 </div>
//                                                 <div class="product-content-wrap">
//                                                     <h2><a href="shop-product-right.html" tabindex="0">Smart Bluetooth Speaker</a></h2>
//                                                     <div class="rating-result" title="90%">
//                                                         <span>
//                                                         </span>
//                                                     </div>
//                                                     <div class="product-price">
//                                                         <span>₹138.85 </span>
//                                                         <span class="old-price">₹145.8</span>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                         <div class="col-lg-3 col-md-4 col-12 col-sm-6">
//                                             <div class="product-cart-wrap small hover-up">
//                                                 <div class="product-img-action-wrap">
//                                                     <div class="product-img product-img-zoom">
//                                                         <a href="shop-product-right.html" tabindex="0">
//                                                             <img class="default-img" src="assets/imgs/shop/product-4-1.jpg" alt="">
//                                                             <img class="hover-img" src="assets/imgs/shop/product-4-2.jpg" alt="">
//                                                         </a>
//                                                     </div>
//                                                     <div class="product-action-1">
//                                                         <a aria-label="Quick view" class="action-btn small hover-up" data-bs-toggle="modal" data-bs-target="#quickViewModal
// "><i class="fi-rs-search"></i></a>
//                                                         <a aria-label="Add To Wishlist" class="action-btn small hover-up" href="shop-wishlist.html" tabindex="0"><i class="fi-rs-heart"></i></a>
//                                                         <a aria-label="Compare" class="action-btn small hover-up" href="shop-compare.html" tabindex="0"><i class="fi-rs-shuffle"></i></a>
//                                                     </div>
//                                                     <div class="product-badges product-badges-position product-badges-mrg">
//                                                         <span class="new">New</span>
//                                                     </div>
//                                                 </div>
//                                                 <div class="product-content-wrap">
//                                                     <h2><a href="shop-product-right.html" tabindex="0">HomeSpeak 12UEA Goole</a></h2>
//                                                     <div class="rating-result" title="90%">
//                                                         <span>
//                                                         </span>
//                                                     </div>
//                                                     <div class="product-price">
//                                                         <span>₹738.85 </span>
//                                                         <span class="old-price">₹1245.8</span>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                         <div class="col-lg-3 col-md-4 col-12 col-sm-6">
//                                             <div class="product-cart-wrap small hover-up mb-0">
//                                                 <div class="product-img-action-wrap">
//                                                     <div class="product-img product-img-zoom">
//                                                         <a href="shop-product-right.html" tabindex="0">
//                                                             <img class="default-img" src="assets/imgs/shop/product-5-1.jpg" alt="">
//                                                             <img class="hover-img" src="assets/imgs/shop/product-3-2.jpg" alt="">
//                                                         </a>
//                                                     </div>
//                                                     <div class="product-action-1">
//                                                         <a aria-label="Quick view" class="action-btn small hover-up" data-bs-toggle="modal" data-bs-target="#quickViewModal
// "><i class="fi-rs-search"></i></a>
//                                                         <a aria-label="Add To Wishlist" class="action-btn small hover-up" href="shop-wishlist.html" tabindex="0"><i class="fi-rs-heart"></i></a>
//                                                         <a aria-label="Compare" class="action-btn small hover-up" href="shop-compare.html" tabindex="0"><i class="fi-rs-shuffle"></i></a>
//                                                     </div>
//                                                     <div class="product-badges product-badges-position product-badges-mrg">
//                                                         <span class="hot">Hot</span>
//                                                     </div>
//                                                 </div>
//                                                 <div class="product-content-wrap">
//                                                     <h2><a href="shop-product-right.html" tabindex="0">Dadua Camera 4K 2022EF</a></h2>
//                                                     <div class="rating-result" title="90%">
//                                                         <span>
//                                                         </span>
//                                                     </div>
//                                                     <div class="product-price">
//                                                         <span>₹89.8 </span>
//                                                         <span class="old-price">₹98.8</span>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                             <div class="banner-img banner-big wow fadeIn f-none animated mt-50">
//                                 <img src="assets/imgs/banner/LUFFY.jpg" alt="">
//                                 <div class="banner-text d-md-block d-none">
//                                     <h4 class="mb-15 mt-40 text-brand">Anime-Inspired Apparel</h4>
//                                     <h1 class="fw-600 mb-20">Explore jaegerKulture! <br>Anime fashion for True fans.</h1>
//                                     <a href="shop-grid-right.html" class="btn">Learn More <i class="fi-rs-arrow-right"></i></a>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </section>
//     </main>

//     <footer class="main">
//         <section class="newsletter p-30 text-white wow fadeIn animated">
//             <div class="container">
//                 <div class="row align-items-center">
//                     <div class="col-lg-7 mb-md-3 mb-lg-0">
//                         <div class="row align-items-center">
//                             <div class="col flex-horizontal-center">
//                                 <img class="icon-email" src="assets/imgs/theme/icons/icon-email.svg" alt="">
//                                 <h4 class="font-size-20 mb-0 ml-3">Sign up to Newsletter</h4>
//                             </div>
//                             <div class="col my-4 my-md-0 des">
//                                 <h5 class="font-size-15 ml-4 mb-0">...and receive <strong>$25 coupon for first shopping.</strong></h5>
//                             </div>
//                         </div>
//                     </div>
//                     <div class="col-lg-5">
//                         <!-- Subscribe Form -->
//                         <form class="form-subcriber d-flex wow fadeIn animated">
//                             <input type="email" class="form-control bg-white font-small" placeholder="Enter your email">
//                             <button class="btn bg-dark text-white" type="submit">Subscribe</button>
//                         </form>
//                         <!-- End Subscribe Form -->
//                     </div>
//                 </div>
//             </div>
//         </section>
//         <section class="section-padding footer-mid">
//             <div class="container pt-15 pb-20">
//                 <div class="row">
//                     <div class="col-lg-4 col-md-6">
//                         <div class="widget-about font-md mb-md-5 mb-lg-0">
//                             <div class="logo logo-width-1 wow fadeIn animated">
//                                 <img src="assets/imgs/theme/jaeger.png" alt="logo">
//                             </div>
//                             <h5 class="mt-20 mb-10 fw-600 text-grey-4 wow fadeIn animated">Contact</h5>
//                             <p class="wow fadeIn animated">
//                                 <strong>Address: </strong>562 Wellington Road, Street 32, San Francisco
//                             </p>
//                             <p class="wow fadeIn animated">
//                                 <strong>Phone: </strong>+01 2222 365 /(+91) 01 2345 6789
//                             </p>
//                             <p class="wow fadeIn animated">
//                                 <strong>Hours: </strong>10:00 - 18:00, Mon - Sat
//                             </p>
//                             <h5 class="mb-10 mt-30 fw-600 text-grey-4 wow fadeIn animated">Follow Us</h5>
//                             <div class="mobile-social-icon wow fadeIn animated mb-sm-5 mb-md-0">
//                                 <a href="#"><img src="assets/imgs/theme/icons/icon-facebook.svg" alt=""></a>
//                                 <a href="#"><img src="assets/imgs/theme/icons/icon-twitter.svg" alt=""></a>
//                                 <a href="#"><img src="assets/imgs/theme/icons/icon-instagram.svg" alt=""></a>
//                                 <a href="#"><img src="assets/imgs/theme/icons/icon-pinterest.svg" alt=""></a>
//                                 <a href="#"><img src="assets/imgs/theme/icons/icon-youtube.svg" alt=""></a>
//                             </div>
//                         </div>
//                     </div>
//                     <div class="col-lg-2 col-md-3">
//                         <h5 class="widget-title wow fadeIn animated">About</h5>
//                         <ul class="footer-list wow fadeIn animated mb-sm-5 mb-md-0">
//                             <li><a href="#">About Us</a></li>
//                             <li><a href="#">Delivery Information</a></li>
//                             <li><a href="#">Privacy Policy</a></li>
//                             <li><a href="#">Terms &amp; Conditions</a></li>
//                             <li><a href="#">Contact Us</a></li>
//                             <li><a href="#">Support Center</a></li>
//                         </ul>
//                     </div>
//                     <div class="col-lg-2  col-md-3">
//                         <h5 class="widget-title wow fadeIn animated">My Account</h5>
//                         <ul class="footer-list wow fadeIn animated">
//                             <li><a href="#">Sign In</a></li>
//                             <li><a href="#">View Cart</a></li>
//                             <li><a href="#">My Wishlist</a></li>
//                             <li><a href="#">Track My Order</a></li>
//                             <li><a href="#">Help</a></li>
//                             <li><a href="#">Order</a></li>
//                         </ul>
//                     </div>
//                     <div class="col-lg-4">
//                         <h5 class="widget-title wow fadeIn animated">Install App</h5>
//                         <div class="row">
//                             <div class="col-md-8 col-lg-12">
//                                 <p class="wow fadeIn animated">From App Store or Google Play</p>
//                                 <div class="download-app wow fadeIn animated">
//                                     <a href="#" class="hover-up mb-sm-4 mb-lg-0"><img class="active" src="assets/imgs/theme/app-store.jpg" alt=""></a>
//                                     <a href="#" class="hover-up"><img src="assets/imgs/theme/google-play.jpg" alt=""></a>
//                                 </div>
//                             </div>
//                             <div class="col-md-4 col-lg-12 mt-md-3 mt-lg-0">
//                                 <p class="mb-20 wow fadeIn animated">Secured Payment Gateways</p>
//                                 <img class="wow fadeIn animated" src="assets/imgs/theme/payment-method.png" alt="">
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </section>
//         <div class="container pb-20 wow fadeIn animated">
//             <div class="row">
//                 <div class="col-12 mb-20">
//                     <div class="footer-bottom"></div>
//                 </div>
//                 <div class="col-lg-6">
//                     <p class="float-md-left font-sm text-muted mb-0">&copy; 2022, <strong class="text-brand">Evara</strong> - HTML Ecommerce Template </p>
//                 </div>
//                 <div class="col-lg-6">
//                     <p class="text-lg-end text-start font-sm text-muted mb-0">
//                         Designed by <a href="http://alithemes.com" target="_blank">Alithemes.com</a>. All rights reserved
//                     </p>
//                 </div>
//             </div>
//         </div>
//     </footer>
//     <!-- Preloader Start -->
//     <div id="preloader-active">
//         <div class="preloader d-flex align-items-center justify-content-center">
//             <div class="preloader-inner position-relative">
//                 <div class="text-center">
//                     <h5 class="mb-5">Now Loading</h5>
//                     <div class="loader">
//                         <div class="bar bar1"></div>
//                         <div class="bar bar2"></div>
//                         <div class="bar bar3"></div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     </div>
//     <!-- Vendor JS-->
//     <script src="assets/js/vendor/modernizr-3.6.0.min.js"></script>
//     <script src="assets/js/vendor/jquery-3.6.0.min.js"></script>
//     <script src="assets/js/vendor/jquery-migrate-3.3.0.min.js"></script>
//     <script src="assets/js/vendor/bootstrap.bundle.min.js"></script>
//     <script src="assets/js/plugins/slick.js"></script>
//     <script src="assets/js/plugins/jquery.syotimer.min.js"></script>
//     <script src="assets/js/plugins/wow.js"></script>
//     <script src="assets/js/plugins/jquery-ui.js"></script>
//     <script src="assets/js/plugins/perfect-scrollbar.js"></script>
//     <script src="assets/js/plugins/magnific-popup.js"></script>
//     <script src="assets/js/plugins/select2.min.js"></script>
//     <script src="assets/js/plugins/waypoints.js"></script>
//     <script src="assets/js/plugins/counterup.js"></script>
//     <script src="assets/js/plugins/jquery.countdown.min.js"></script>
//     <script src="assets/js/plugins/images-loaded.js"></script>
//     <script src="assets/js/plugins/isotope.js"></script>
//     <script src="assets/js/plugins/scrollup.js"></script>
//     <script src="assets/js/plugins/jquery.vticker-min.js"></script>
//     <script src="assets/js/plugins/jquery.theia.sticky.js"></script>
//     <script src="assets/js/plugins/jquery.elevatezoom.js"></script>
//     <!-- Template  JS -->
//     <script src="./assets/js/main.js?v=3.4"></script>
//     <script src="./assets/js/shop.js?v=3.4"></script>
//     <script>
//         // Dynamic stock update based on selected size
//         document.addEventListener("DOMContentLoaded", function () {
//             const sizeOptions = document.querySelectorAll('.size-option');
//             const stockCount = document.getElementById('stock-count');

//             sizeOptions.forEach(option => {
//                 option.addEventListener('click', function(e) {
//                     e.preventDefault();
//                     const stock = this.getAttribute('data-stock');
//                     stockCount.textContent = stock + ' Items in Stock';
//                 });
//             });
//         });
//     </script>
    

// </body>

// </html>




