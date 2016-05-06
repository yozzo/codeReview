(function () {
    'use strict';

    // Sticky nav
    $(document).ready(function(){
        var $buyContainer = $('#homepage_buy');
        setTimeout(function(){
            $buyContainer.waypoint(function(direction){
                switch(direction){
                    case 'down':
                        $buyContainer.addClass('tab-fixed');
                    break;

                    case 'up':
                        $buyContainer.removeClass('tab-fixed');
                    break;
                }
            },{
                offset: 55
            });
        },300);
    });

    var productSelector = angular.module('productSelector', ['ui.router', 'ngSanitize']);

    angular.module('productSelector')
    .config(
                ['$stateProvider', '$urlRouterProvider',
        function( $stateProvider,   $urlRouterProvider  ){

            $stateProvider
                .state('connect', {
                    url: "/connect/{device_type}",
                    abstract: true,
                    template: "<ui-view/>"
                })
                .state('connect.choose-device', {
                    url: "/choose-device",
                    templateUrl: "assets/views/homepage-devices.html",
                    controller: 'deviceController'
                })
                .state('connect.choose-plan', {
                    url: "/choose-plan",
                    templateUrl: "assets/views/homepage-plans.html",
                    controller: 'plansController'
                })
                .state('connect.sign-up', {
                    url: "/sign-up",
                    templateUrl: "assets/views/homepage-signup.html",
                    controller: 'signupController'
                });
        }
    ])

    .run(
            ['$rootScope', '$state', '$stateParams', 
    function( $rootScope,   $state,   $stateParams ){
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;

        $state.matches = function(string){
            if( $state.current.name.indexOf(string) !== -1 ){
                return true;
            } else {
                return false;
            }
        };
    }])

    .factory('Products',
            ['$http',
    function( $http ){
        var serviceFactory = {};

        serviceFactory.getSmartphoneDevices = function(){
            return $http.get('assets/json/devices.smartphone.json', {cache: true});
        };  

        serviceFactory.getWifiDevices = function(){
            return $http.get('assets/json/devices.wifi.json', {cache: true});
        };  

        serviceFactory.getSmartphonePlans = function(){
            return $http.get('assets/json/plans.smartphone.json', { cache: true});
        };

        serviceFactory.getWifiPlans = function(){
            return $http.get('assets/json/plans.wifi.json', { cache: true});
        };

        return serviceFactory;
    }])

    .factory('Cart',
            ['$http',
    function( $http ){

        var cart = {
            items: [],
            totals: {
                subtotal: 0,
                vat: 0,
                grandtotal: 0
            }
        };
        var serviceFactory = {};

        serviceFactory.addToCart = function(product){
            cart.items.push(product);
            console.log(cart.items);
            serviceFactory.updateTotals();
        };

        serviceFactory.getCart = function(){
            return cart;
        };

        serviceFactory.deleteItem = function(item){
            angular.forEach(cart.items, function(cartItem, index){
                if( cartItem.$$hashKey == item.$$hashKey ){
                    cart.items.splice(index, 1);
                }
            });
            serviceFactory.updateTotals();
        };

        serviceFactory.hasDevice = function(){
            var hasDevice = false;
            angular.forEach(cart.items, function(cartItem, index){
                if(!hasDevice && cartItem.product_type === 'device'){
                    hasDevice = true;
                }
            });

            return hasDevice;
        }

        serviceFactory.hasPlan = function(){
            var hasPlan = false;
            angular.forEach(cart.items, function(cartItem, index){
                if(!hasPlan && cartItem.product_type === 'plan'){
                    hasPlan = true;
                }
            });

            return hasPlan;
        }

        serviceFactory.updateTotals = function(){
            cart.totals.subtotal = 0;
            cart.totals.vat = 0;
            cart.totals.grandtotal = 0;
            
            // Sub total
            angular.forEach(cart.items, function(cartItem, index){

                if( cartItem.price !== undefined ){
                    cart.totals.subtotal += parseInt(cartItem.price);
                } else if (cartItem.selectedStorage.price){
                    cart.totals.subtotal += parseInt(cartItem.selectedStorage.price);
                }
            });

            // VAT
            cart.totals.vat = (cart.totals.subtotal / 100) * 20;
            cart.totals.grandtotal = cart.totals.subtotal + cart.totals.vat;

        };

        return serviceFactory;
    }])

    .controller('mainController', 
                ['$scope', '$q', '$state', 'Products', 'Cart',
        function( $scope,   $q,   $state,   Products,   Cart ){
    }])

    .controller('deviceController', 
                ['$scope', '$q', '$state', '$stateParams', 'Products', 'Cart', 
        function( $scope,   $q,   $state,   $stateParams,   Products,   Cart ){

            $scope.dataLoaded = false;

            var init = function(){

                if( $stateParams.device_type ){
                    switch( $stateParams.device_type ){
                        case "smartphone":
                            $q.when( Products.getSmartphoneDevices() ).then(function(response){
                                $scope.devices = response.data;
                                
                                angular.forEach($scope.devices, function(device){
                                    if( device.options.storage.length ){
                                        device.selectedStorage = device.options.storage[0];
                                    }

                                    if( device.options.color.length ){
                                        device.selectedColor = device.options.color[0];
                                    }
                                });

                                $scope.dataLoaded = true;
                            });
                        break;
                        
                        case "wifi":
                            $q.when( Products.getWifiDevices() ).then(function(response){
                                $scope.devices = response.data;

                                angular.forEach($scope.devices, function(device){
                                    // if( device.options.storage.length ){
                                    //  device.selectedStorage = device.options.storage[0];
                                    // }

                                    if( device.options.color.length ){
                                        device.selectedColor = device.options.color[0];
                                    }
                                });
                                $scope.dataLoaded = true;
                            });
                        break;
                    }
                } 
            };

            $scope.addToCart = function(product){
                Cart.addToCart(product);
                $state.go('connect.choose-plan');
            };

            init();
    }])

    .controller('plansController', 
                ['$scope', '$q', '$state', '$stateParams', 'Products', 'Cart',
        function( $scope,   $q,   $state,   $stateParams,   Products,   Cart ){

            $scope.dataLoaded = false;

            var init = function(){
                switch($stateParams.device_type){
                    case 'smartphone':
                        $q.when( Products.getSmartphonePlans() ).then(function(response){
                            $scope.plans = response.data;
                            $scope.dataLoaded = true;
                        });
                    break;

                    case 'wifi':
                        $q.when( Products.getWifiPlans() ).then(function(response){
                            $scope.plans = response.data;
                            $scope.dataLoaded = true;
                        });
                    break;
                }
                
            };

            $scope.addToCart = function(product){
                Cart.addToCart(product);
                $state.go('connect.sign-up');
            };

            init();
    }])

    .controller('signupController',
                ['$scope', '$q', '$state', '$stateParams', 'Cart',
        function( $scope,   $q,   $state,   $stateParams,   Cart ){

            $scope.dataLoaded = false;
            $scope.cartStatus = 'no-device';

            $scope.getCart = function(){
                $q.when( Cart.getCart() ).then(function(response){
                    $scope.cart = response;
                    $scope.checkStatus();
                    $scope.dataLoaded = true;
                });
            };

            $scope.checkStatus = function(){
                if( Cart.hasDevice() && Cart.hasPlan() ){
                    $scope.cartStatus = 'ready';
                } else

                if( !Cart.hasPlan() && Cart.hasDevice() ){
                    $scope.cartStatus = 'no-plan';
                } else 

                if( !Cart.hasDevice() && Cart.hasPlan() ){
                    $scope.cartStatus = 'no-device';
                } else 

                if( !Cart.hasDevice() && !Cart.hasPlan() ){
                    $scope.cartStatus = 'no-device-no-plan';
                }

            };

            $scope.deleteItem = function(item){
                Cart.deleteItem(item);
                $scope.getCart();
            };

            $scope.getCart();
    }])

    .directive('deviceSlider', ['$timeout', 
        function($timeout){
            return {
                link: function(scope, element){

                    scope.$carousel = $(element);
                    scope.$slides = scope.$carousel.find('.slide');
                    
                    scope.init = function(){
                        // Subscribe to window resize (debounced) event
                        $.subscribe('window_resize', function(){
                            scope.onResize();
                        });
                        scope.onResize();

                        scope.productCarousel();
                    };

                    scope.onResize = function(){
                        scope.carouselWidth = scope.$carousel.width();

                        if(scope.slick){    
                            if( jio.viewport.width > 960 ){
                                scope.setItemWidth(scope.slick);
                            } else {
                                scope.resetWidth(scope.slick);
                            }
                        }
                    };

                    scope.productCarousel = function(){
                        scope.$carousel.on('init afterChange setPosition', function(event, slick, currentSlide, nextSlide){
                            scope.slick = slick;

                            scope.carouselWidth = scope.$carousel.width();
                            if( jio.viewport.width > 960 ){
                                scope.setItemWidth(slick, nextSlide);
                            } else {
                                scope.resetWidth(slick);
                            }
                            
                        });

                        var carouselOptions = {
                            slidesToShow: 3,
                            initialSlide: 1,
                            centerMode: true,
                            speed: 500,
                            centerPadding: 0,
                            variableWidth: false,
                            infinite: false,
                            draggable: false,
                            cssEase: 'cubic-bezier(0.7, 0, 0.07, 1)',
                            waitForAnimate: false,
                            adaptiveHeight: true,
                            responsive: [
                                {
                                    breakpoint: 960,
                                    settings: {
                                        slidesToShow: 2,
                                        initialSlide: 0
                                    }
                                },
                                {
                                    breakpoint: 800,
                                    settings: {
                                        slidesToShow: 1,
                                        initialSlide: 0
                                    }
                                }
                            ]
                        }

                        if(scope.$carousel.hasClass('homepage__devices')){
                            // Disable last slide on desktop (no expanded view)
                            scope.$carousel.on('beforeChange', function(event, slick, currentSlide, nextSlide){
                                if( jio.viewport.width > 960 && nextSlide === slick.slideCount - 1){
                                    setTimeout(function(){
                                        scope.$carousel.slick('slickPrev');//, currentSlide, false);
                                    });
                                }
                            });
                        }

                        if(scope.$carousel.hasClass('homepage__plans')){
                            // Disable first and last slide
                            scope.$carousel.on('beforeChange', function(event, slick, currentSlide, nextSlide){

                                if( nextSlide === 0 ){
                                    setTimeout(function(){
                                        scope.$carousel.slick('slickNext');//, currentSlide, false);
                                    });
                                }

                                if( nextSlide === slick.slideCount - 1){
                                    setTimeout(function(){
                                        scope.$carousel.slick('slickPrev');//, currentSlide, false);
                                    });
                                }
                            });     

                            carouselOptions.arrows = false;
                            carouselOptions.responsive = [
                                {
                                    breakpoint: 960,
                                    settings: {
                                        slidesToShow: 1,
                                        initialSlide: 1
                                    }
                                }
                            ];
                        }

                        scope.$carousel.slick(carouselOptions);

                        scope.$slides.each(function(item, index){
                            var $item = $(item);

                            $item.find('.homepage__product__thumb').on()
                        });
                    };

                    scope.setItemWidth = function(slick, nextSlide){

                        scope.resetDone = false;

                        var theSlide = (nextSlide) ? nextSlide : slick.currentSlide;
                        var $prevSlides, $nextSlides;
                        $prevSlides = $nextSlides = $([]);

                        slick.$slides.each(function(i, slide){
                            if( i < theSlide ){
                                $prevSlides = $prevSlides.add($(slide));
                            }

                            if( i > theSlide ){
                                $nextSlides = $nextSlides.add($(slide));
                            }
                        });
                        
                        var $activeSlide = scope.$carousel.find('.slick-slide[data-slick-index="'+theSlide+'"]');
                        var $otherSlides = scope.$carousel.find('.slick-slide').not('[data-slick-index="'+theSlide+'"]');
                        
                        var largeWidth = (scope.carouselWidth / 24) * 14;
                        var smallWidth = (scope.carouselWidth / 24) * 5;

                        var largeItemTransformX = '-'+ ((largeWidth/2) - (slick.slideWidth/2))+'px';
                        var smallItemTransformX = (slick.slideWidth) - (smallWidth) +'px';

                        $activeSlide.find('.homepage__product').css({
                            width: largeWidth,
                            zIndex: 1,
                            'webkit-transform': 'translate3d('+largeItemTransformX+', 0, 0) scale(1)',
                            'moz-transform': 'translate3d('+largeItemTransformX+', 0, 0) scale(1)',
                            'ms-transform': 'translate3d('+largeItemTransformX+', 0, 0) scale(1)',
                            'transform': 'translate3d('+largeItemTransformX+', 0, 0) scale(1)'
                        });

                        $prevSlides.find('.homepage__product').css({
                            width: smallWidth,
                            zIndex: 0,
                            'webkit-transform': 'translate3d(0, 0, 0) scale(0.95)',
                            'moz-transform': 'translate3d(0, 0, 0) scale(0.95)',
                            'ms-transform': 'translate3d(0, 0, 0) scale(0.95)',
                            'transform': 'translate3d(0, 0, 0) scale(0.95)'
                        });

                        $nextSlides.find('.homepage__product').css({
                            width: smallWidth,
                            zIndex: 0,
                            'webkit-transform': 'translate3d('+smallItemTransformX+', 0, 0) scale(0.95)',
                            'moz-transform': 'translate3d('+smallItemTransformX+', 0, 0) scale(0.95)',
                            'ms-transform': 'translate3d('+smallItemTransformX+', 0, 0) scale(0.95)',
                            'transform': 'translate3d('+smallItemTransformX+', 0, 0) scale(0.95)'
                        });

                        var $prevSlide = $otherSlides.filter('.active');
                        $activeSlide.addClass('active');
                        $otherSlides.removeClass('active');

                        $activeSlide.find('.homepage__product__thumb').hide();
                        $prevSlide.find('.homepage__product__main').hide();
                        setTimeout(function(){
                            $activeSlide.find('.homepage__product__main').fadeIn();
                            $prevSlide.find('.homepage__product__thumb').fadeIn();
                        },400);
                        
                    };

                    scope.resetWidth = function(slick){
                        if( !scope.resetDone ){
                            slick.$slides.each(function(){
                                var $slide = $(this);

                                $slide.addClass('acitve');
                                
                                $slide.find('.homepage__product').css({
                                    width: '100%',
                                    'webkit-transform': 'translate3d(0, 0, 0) scale(1)'
                                });

                                $slide.find('.homepage__product__thumb').hide();
                                $slide.find('.homepage__product__main').fadeIn();
                            });

                            scope.resetDone = true;
                        }
                    };

                    scope.thumbClick = function(e){
                        console.log(e);
                        var $slide = $(e.currentTarget).parents('.slide');
                        console.log($slide.index());

                        scope.$carousel.slick('slickGoTo', $slide.index());
                    };

                    $timeout(function(){
                        scope.init();       
                    });
                }
            }
        }
    ])
    
    .directive('planSlider', ['$timeout', 
        function($timeout){
            return {
                link: function(scope, element){

                    scope.$carousel = $(element);
                    scope.$slides = scope.$carousel.find('.slide');
                    
                    scope.init = function(){
                        // Subscribe to window resize (debounced) event
                        $.subscribe('window_resize', function(){
                            scope.onResize();
                        });
                        scope.onResize();

                        scope.planCarousel();

                    };

                    scope.onResize = function(){
                        scope.carouselWidth = scope.$carousel.width();
                    };

                    scope.planCarousel = function(){
    

                        //this.$slides.width(this.carouselWidth / 4);
                        scope.$carousel.slick({
                            slidesToShow: (function(){

                                if (scope.$carousel.find('.slide').length <= 2) {
                                    return 2;
                                } else {
                                    return 4;
                                }
                            })(),
                            //initialSlide: 1,
                            centerMode: false,
                            speed: 500,
                            // centerPadding: 0,
                            variableWidth: false,
                            infinite: false,
                            draggable: false,
                            cssEase: 'cubic-bezier(0.7, 0, 0.07, 1)',
                            responsive: [
                                {
                                    breakpoint: 1000,
                                    settings: {
                                        slidesToShow: 3
                                    }
                                },
                                {
                                    breakpoint: 700,
                                    settings: {
                                        slidesToShow: 2
                                    }
                                },
                                {
                                    breakpoint: 480,
                                    settings: {
                                        slidesToShow: 1
                                    }
                                }
                            ]
                        });
                    };

                    $timeout(function(){
                        scope.init();       
                    });
                    
                }
            }
        }
    ])
    
    .directive('connectPanel', ['$timeout', '$state',
        function($timeout, $state){
            return {
                link: function(scope, element){
                    var breakpoint = 768;
                    var currentState = ( Modernizr.mq('(min-width: 768px)') ) ? 'desktop' : 'mobile';

                    scope.$el = $(element);
                    scope.$list = scope.$el.find('.homepage-connect__options > ul');
                    scope.$items = scope.$el.find('.homepage-connect__options a');
                    scope.$images = scope.$el.find('.homepage-connect__bg-image');

                    scope.init = function(){

                        if( currentState === 'desktop' ){
                            scope.hoverStates();

                            // scope.$el.on('click', function(){
                            //  if( scope.hoversUnbound ){
                            //      scope.hoverStates();
                            //      scope.$items.removeClass('inactive active');
                            //  }
                            // });
                        } else {
                            scope.mobileCarousel();
                        }

                        $.subscribe('window_resize', function(){
                            scope.onResize();
                        });
                        scope.onResize();
                    };

                    scope.onResize = function(){
                        if( Modernizr.mq('(max-width: 767px)') && currentState === 'desktop' ){
                            currentState = 'mobile';
                            scope.$items.removeClass('inactive active');
                            scope.$images.removeClass('active');
                            scope.unbindHover();
                            scope.mobileCarousel();
                        }

                        if( Modernizr.mq('(min-width: 768px)') && currentState === 'mobile' ){
                            currentState = 'desktop';
                            scope.$list.slick('unslick');
                            scope.hoverStates();
                        }
                    };
                    scope.mobileCarousel = function(){
                        scope.$list.slick({
                            itemsToShow: 1
                        });

                        scope.$images.first().addClass('active');

                        scope.$list.on('beforeChange', function(event, slick, currentSlide, nextSlide){
                            scope.$images.removeClass('active');
                            scope.$images.eq(nextSlide).addClass('active');
                        });
                    };
                    scope.hoverStates = function(){

                        scope.$el.find('.homepage-connect__options a').hover( 
                            function(){
                                var $item = $(this);
                                scope.$items.not($item).addClass('inactive');
                                $item.addClass('active');
                                var bgClass = $item.data('bg');
                                scope.$images.filter('.'+bgClass).addClass('active');
                            }, 
                            function(){
                                var $item = $(this);
                                scope.$items.not($item).removeClass('inactive');
                                $item.removeClass('active');
                                scope.$images.removeClass('active');
                            }
                        );

                        scope.hoversUnbound = false;
                    };

                    scope.unbindHover = function(){
                        scope.$el.find('.homepage-connect__options a').unbind('mouseenter mouseleave');
                        scope.hoversUnbound = true;
                    };

                    scope.itemClick = function(e){
                        e.stopPropagation();
                        
                        var $item = $(e.currentTarget);
                        
                        scope.$items.removeClass('selected unselected');
                        scope.$items.not($item).addClass('unselected');
                        $item.addClass('selected');
                        
                        var bgClass = $item.data('bg');
                        scope.$images.removeClass('selected');
                        scope.$images.filter('.'+bgClass).addClass('selected');

                        // scope.unbindHover();

                        $timeout(function(){
                            $('html, body').animate({
                                scrollTop: $("#homepage_buy").offset().top - 55
                            }, 500);
                        }, 200);
                    };

                    scope.init();
                }
            }
        }
    ]);

})();
