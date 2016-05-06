/* global window, document, $, jQuery, Modernizr, define, require, google, _, Handlebars, Backbone */


define(['jquery', 'googleMaps', 'markerclusterer', 'markerwithlabel', 'logger', 'handlebars', 'backbone'],
    function ($, googleMaps, MarkerClusterer, MarkerWithLabel, Logger, Handlebars) {
    'use strict';

    var defaults = {
            dealerDetailContainerSelect : '.map-results',
            detailsLoadingClass : 'is-loading',
            isGeolocated : $.noop,
            listViewTriggerSelector : '.btn-view-list',
            activeClass : 'is-active',
            autoSelectFirstDealerInCollection: true,
            buttonSelect: '.btn-select',
            buttonPrev: '.js-btn-prev',
            buttonNext: '.js-btn-next',
            inactiveClass: 'inactive',
            backToMyAccountWrapper: '.back-to-my-account-wrapper',
            backToMyAccountCloseButton: '.back-to-my-account-wrapper i.close'
        },

        mapDefaults = {
            streetViewControl : false,
            maxZoom : 17, //17 zoom in
            minZoom : 1, //2 zoom out
            zoom: 8,
            draggable : true,
            scrollwheel: true,
            zoomControl: true,
            panControl: true
        },

        mapIdPrefix = 'helios-map',
        mapInstanceAttr = 'map-instance',
        Map,
        log,
        idCounter = 0,
        dealerDetailTemplateSelect = '.lb_template_c-40-3_list',
        mapInstances = {},
        clusterStyles,
        clusterMaxZoom = 12, //8 the level at which clusters become active.
        isShowingDetailClass = 'is-showing-detail';


    /**
    * Check input for contents
    */
    Handlebars.registerHelper('pageCount', function(object, options) {
        var pattern = options.hash.pattern,
            html;
        if (pattern && pattern !== '') {
            html = pattern.replace('%num%', object.position).replace('%total%', object.resultsTotal);
        }
        else {
            html = object.position + ' / ' + object.resultsTotal;
        }
        return '<span class="page-count">' + html + '</span>';
    });




    /**
     * Wrapped Map object
     *
     * @param jquery.object
     * @param json
     * @param backbone.collection
     * @return Map
     */
    Map = function (el, optionsParam, collectionInstance) {
        var instance = this;

        googleMaps.done(function () {
            instance.init(el, optionsParam, collectionInstance);
        });

        return this;
    };


    /**
     * Map Class
     */
    Map.prototype = {

        instanceId : null,
        $el : null,
        settings : null,
        mapSettings : null,
        map : null,
        dealerTemplate : null,
        collectionInstance : false,
        resultsList : [],
        geoMarkerInstance : null,
        activeDealer : false,

        icons : {
            inactive : null,
            active : null,
            brand : null,
            brandActive : null,
            geo : null
        },

        clusterStyles : null,
        labelanchorLeft : null,
        labelanchorTop : null,
        markerCluster : null,


        /**
         * Expose the promise this instance is waiting for
         *
         * @return promise
         */
        promise : function () {
            return googleMaps.promise();
        },


        /**
         * Init Map
         * @param jquery.object
         * @param json
         * @param backbone.collection
         */
        init : function (el, options, collectionInstance) {
            var componentOptions = getComponentOptionsFromHelios(),
                map,
                isInitializedClass, instanceId,
                instance = this,
                $el = $(el),
                markerList, templateSrc;

            log = new Logger({
                prefix: 'C22'
            });

            log.info('init');

            this.$el = $el;

            //extend component options
            this.settings = $.extend({}, defaults, options);

            // extend gmap options
            this.mapSettings = $.extend({}, this.getGMapSettings($el, componentOptions), options);

            // apply marker settings
            this.setMarkerSettings(componentOptions);

            //create a new ID for this instance
            instanceId =  mapIdPrefix + (idCounter += 1) + '';
            mapInstances[instanceId] = this;

            // add instance index id to element data attr
            $el.attr(mapInstanceAttr, instanceId);

            //create map
            map = new google.maps.Map(el, this.mapSettings);

            if (options.idle) {
                google.maps.event.addListenerOnce(map, 'idle', function() {
                    options.idle();
                });
            }

            this.instanceId = instanceId;
            this.map = map;

            if (collectionInstance && collectionInstance.length) {
                this.collectionInstance = collectionInstance;
                this.collectionInstance
                    .bind('change:visible', $.proxy(this.filterMarkers, instance))
                    .bind('change:position', this.updateMarker, this)
                    .bind('change:all', $.proxy(this.updateResults, instance));
            }

            //watch for pagination clicks
            $(this.settings.dealerDetailContainerSelect)
                .on('click', defaults.buttonSelect, $.proxy(this.dealerSelection, this))
                .on('click', defaults.buttonPrev, defaults.buttonNext, $.proxy(this.dealerPagination, this));

            if (this.collectionInstance) {
                this.initMarkers($el, options);
            }

            //compile the template for dealer detail
            templateSrc = $(dealerDetailTemplateSelect);
            if (templateSrc.length) {
                this.dealerTemplate = Handlebars.compile(templateSrc.html());
            }
        },


        /**
         * Zooms map
         *
         * @param zoom
         */
        zoom : function (zoom) {
            if (this.map) {
                this.map.setZoom(zoom);
            }
        },


        /**
         * Refresh map
         */
        refresh : function () {
            log.info('refresh');
            google.maps.event.trigger(this.map, 'resize');
        },


        /**
         * Collate all the map settings for use in the gmap init
         * Must not contain properties that gmaps does not understand/use.
         *
         * @param jquery.object
         * @param json
         * @return json
         */
        getGMapSettings : function ($el, options) {
            var mapSettings = $.extend({}, mapDefaults, {
                styles : options.styles
            });

            // Use element options
            this.getElemOptions($el, mapSettings);

            return mapSettings;
        },


        /**
         * Returns settings for creating a google marker
         *
         * @param string
         * @param string
         * @param json
         * @return this
         */
        createIcon : function (pathParam, markerExt, componentOptions) {
            var iconWidth = componentOptions.width,
                iconHeight = componentOptions.height,
                labelanchorLeft = this.labelanchorLeft,
                labelanchorTop = this.labelanchorTop,
                path = null,
                anchorPoint;

            if (pathParam && pathParam !== '') {
                path = pathParam + markerExt;
            }

            if (markerExt !== '') {
                anchorPoint = new google.maps.Point(labelanchorLeft, labelanchorTop);
            }
            //geolocation
            else {
                anchorPoint = new google.maps.Point(labelanchorLeft, Math.floor(iconHeight / 2));
            }
            return {
                "url": path,
                "origin": new google.maps.Point(0,0),
                "anchor": anchorPoint,
                "scaledSize": new google.maps.Size(iconWidth, iconHeight),
                "size": new google.maps.Size(iconWidth, iconHeight)
            };
        },


        /**
         * Use the component options to create the icons for use in the map
         *
         * @param json
         * @return this
         */
        setMarkerSettings : function (componentOptions) {
            var markerExt = '.png'; //workaround for IE11 issue PH-4031

            this.clusterStyles = componentOptions.clusters;
            this.labelanchorLeft = Math.floor(componentOptions.width / 2);
            this.labelanchorTop = componentOptions.height;

            //create custom markers
            this.icons = {
                inactive : this.createIcon(componentOptions.markers, markerExt, componentOptions),
                active : this.createIcon(componentOptions.markersActive, markerExt, componentOptions),
                brand : this.createIcon(componentOptions.brand, markerExt, componentOptions),
                brandActive : this.createIcon(componentOptions.brandActive, markerExt, componentOptions),
                geo : this.createIcon(componentOptions.geoMarker, '', componentOptions)
            };

            //icons to use behind clustered pins
            this.clusterStyles[0].height = componentOptions.height;
            this.clusterStyles[0].width = componentOptions.width;
            this.clusterStyles[0].anchorIcon = [componentOptions.height, componentOptions.width/2];
            
            if (componentOptions.cluster) {
                this.clusterStyles[0].url = componentOptions.cluster + markerExt; //this.icons.active;
            }

            return this;
        },


        /**
         * Fetch options from data-attribs and apply them to class options
         *
         * @param jquery.object
         * @param json
         * @return this
         */
        getElemOptions : function ($el, options) {
            //get the options set on the element
            var dataLat = $el.data('lat'),
                dataLon = $el.data('lon'),
                dataDraggable = $el.data('draggable'),
                datascrollwheel = $el.data('scrollwheel'),
                datazoomControl = $el.data('zoomcontrol'),
                datapanControl = $el.data('pancontrol'),
                dataZoom = $el.data('zoom');

            if (dataLat !== undefined && dataLon !== undefined ) {
                options.center = new google.maps.LatLng(dataLat, dataLon);
            }

            if (dataDraggable === false) {
                options.draggable = dataDraggable;
            }

            if (datascrollwheel === false) {
                options.scrollwheel = datascrollwheel;
            }

            if (datazoomControl === false) {
                options.zoomControl = datazoomControl;
            }

            if (datapanControl === false) {
                options.panControl = datapanControl;
            }

            if (dataZoom) {
                options.zoom = dataZoom;
            }

            return this;

        },


        /**
         * On Show Handler
         * Refresh default level, refresh results
         */
        onShow : function () {
            log.info('onShow');
            google.maps.event.trigger(this.map, 'resize');

            //if the map is at a high zoom level
            // Why level 2? If we assume that the US is the largest region zoom level 3 will likely be the default state.
            if (this.map.getZoom() <= 2) {

                //attempt to correct by setting the bounds again
                this.updateResults();

            }

        },

        /**
         * Sean Thompson:
         * Enable and disable preselection of closest dealer when the dealer result set is shown on the map
         *
         * Implemented to disable preselection of dealers for c_056 Book a Test Drive.
         *
         * @param bool
         */
        setAutoSelectFirstDealerInCollection : function (autoselect) {
            defaults.autoSelectFirstDealerInCollection = autoselect;
        },

        getAutoSelectFirstDealerInCollection : function () {
            return defaults.autoSelectFirstDealerInCollection;
        },

        /**
         * Apply markers to the map and cluster them if required.
         *
         * @param jquery.object
         * @param json
         * @return this
         */

        initMarkers : function ($el, options) {
            var markerList = this.addDealerMarkers($el, options);

            log.info('initMarkers');

            this.clusterMarkers($el, this.clusterStyles, markerList);

            return this;
        },


        /**
         * Marker click handler
         * Load details before zooming/centering on the screen
         *
         * @param MarkerWithLabel
         * @param integer
         * @return this
         */
        viewMarker : function (marker, testZoomLevel) {
            var map = this.map,
                dealerId,
                model;

            log.info('viewMarker');

            dealerId = (marker) ? marker.dealerId : null;

            if (dealerId) {
                model = this.collectionInstance.get(dealerId);

                //mark the pin as the active one
                this.loadingDealerDetail().setActiveMarker(model, true);

                //request the extra info then show info (calls setActiveMarker again)
                this.settings.dealerCallback(dealerId).then($.proxy(this.showDealerDetail, this));

                //if we're allowed, check that the zoom level is appropriate
                if (testZoomLevel === true) {
                    if (map.getZoom() <= clusterMaxZoom) {
                        map.setZoom(clusterMaxZoom+1);
                        //re-apply center
                        map.setCenter(marker.getPosition());
                    }
                }
            }

            //signal that a dealer was selected to c_056 PH-20374
            $(this.settings.dealerDetailContainerSelect).trigger('dealerWasSelected');

            return this;

        },

        /**
        * Respond to filtered results (change:visible)
        */
        filterMarkers : function () {
            var instance = this,
                markerList = [],
                activeCollection = this.settings.ActiveDealersCallback('visible'),
                scope = this; //promises

            log.info('filterMarkers');

            // clear markers from map
            this.markerCluster.clearMarkers();

            instance.resultsList = _.pluck(activeCollection, 'id');

            //fit the boundary to all pins
            _.each(activeCollection, function (model, index) {
                markerList.push(model.get('marker'));
            });

            //create a promise to ensure that extendBounds fires only after clusterMarkers has run
            $.when( scope.clusterMarkers(this.$el, scope.clusterStyles, markerList) ).done(function() {
                scope.extendBounds(markerList);
            });
        },

        /*clear the map of markers*/
        clearMarkers : function() {
            this.markerCluster.clearMarkers();
        },

        /**
        * Respond to a updated search result set (change:all)
        */
        updateResults : function () {
            var instance = this,
                markerList = [],
                activeCollection = this.settings.ActiveDealersCallback();

            log.info('updateResults');

            instance.resultsList = _.pluck(activeCollection, 'id');


            instance.center(activeCollection);

        },


        /**
         * Center and zoom in on the map
         *
         * @param backbone.collection
         * @return this
         */
        center : function (activeCollection) {
            var instance = this,
                firstMarker;

            log.info('center');

            if (activeCollection[0]) {

                google.maps.event.trigger(this.map, 'resize');

                firstMarker = activeCollection[0].get('marker');

                // set center to the first pin
                instance.map.setCenter(firstMarker.getPosition());

                // Experimental alternative to setCenter - RM
                // instance.centerOnLatLng(firstMarker.getPosition());

                if (defaults.autoSelectFirstDealerInCollection) {
                    // zoom in on pin
                    instance.map.setZoom(10);

                    // show the details for this marker
                    instance.viewMarker(firstMarker);
                }
            }

            return this;
        },

        /**
         * Center the map on a lat/long while maintaining its boundaries
         * Experimental
         *
         * @param gf (marker.getPosition)
         */
        centerOnLatLng : function (center) {
            var map = this.map,
                bounds = map.getBounds(),
                ne = 0, //bounds.getNorthEast(),
                sw = 0, //bounds.getSouthWest(),
                neLatDif, swLatDif,
                neLonDif, swLonDif,
                newBoundary = new google.maps.LatLngBounds();

            log.info('centerOnLatLng');

            if (typeof bounds !== 'undefined') {
                ne = bounds.getNorthEast();
                sw = bounds.getSouthWest();

                //Lat
                neLatDif = center.lat() - ne.lat();
                swLatDif = center.lat() - sw.lat();

                //if the sw is closer than ne
                if (Math.abs(swLatDif) < Math.abs(neLatDif)) {
                    //extend the sw lat by the diference
                    sw = new google.maps.LatLng(sw.lat() + (neLatDif + swLatDif), sw.lng());
                }
                else {
                    //extend the ne lat by the diference
                    ne = new google.maps.LatLng(ne.lat() + (swLatDif + neLatDif), ne.lng());
                }

                //Lng
                neLonDif = center.lng() - ne.lng();
                swLonDif = center.lng() - sw.lng();

                //if the sw is closer than ne
                if (Math.abs(swLonDif) < Math.abs(neLonDif)) {
                    //extend the sw lng by the diference
                    sw = new google.maps.LatLng(sw.lat(), sw.lng() + (neLonDif + swLonDif));
                }
                else {
                    //extend the ne lng by the diference
                    ne = new google.maps.LatLng(ne.lat(), ne.lng() + (swLonDif + neLonDif));
                }

                //extend to these new boundaries
                newBoundary.extend(sw);
                newBoundary.extend(ne);


            } else {
                log.debug('map.getBounds() returned undefined in centerOnLatLng c_022.js');
            }

            map.fitBounds(newBoundary);

            return this;
        },


        /**
         * When we expand the bounds to show all the pins the resulting zoom may cause the clusters to kick-in
         * Attempt to work around that here.
         *
         * @param Map
         * @param MarkerClusterer
         * @return this
         */
        checkClusterLevel : function (map, markerCluster) {
            var mapZoomLevel;

            log.info('checkClusterLevel');

            if ($(defaults.listViewTriggerSelector).hasClass(defaults.activeClass)) {
                mapZoomLevel = markerCluster.getMaxZoom();
            } else {
                mapZoomLevel = map.getZoom();
            }

            //check the new zoom is not equal to the level of the result set
            if (mapZoomLevel <= markerCluster.getMaxZoom()) {
                markerCluster.setMaxZoom(mapZoomLevel - 1);
            }

            //if the zoom level is now greater than the default, reset to default
            else if (mapZoomLevel > clusterMaxZoom) {
                //reset to the default
                markerCluster.setMaxZoom(clusterMaxZoom);
            }

            return this;
        },


        /**
         * Set a marker as active or reset it to inactive
         * Calls itself to remove active from the previous item
         * Changes the marker (activeMarker) and class on the label ('is-active-marker')
         *
         * @param backbone.model
         * @param bool
         * @return this
         */
        setActiveMarker : function (model, isActive) {
            var activeMarkerID = this.activeDealer,
                activeMarker,
                hasPosition = model.get('position'),
                isActiveMarkerClass = 'is-active-marker',
                icon, labelClass;

            log.info('setActiveMarker('+ isActive +')');

            //disable the active marker
            if (activeMarkerID) {
                activeMarker = this.collectionInstance.get(activeMarkerID);
                this.activeDealer = false;
                this.setActiveMarker(activeMarker, false);
            }

            activeMarker = model.get('marker');

            labelClass = activeMarker.get('labelClass');

            //remove active class
            labelClass = labelClass.replace(isActiveMarkerClass, '');

            //activate this marker
            if (isActive === true) {
                labelClass = labelClass + ' ' + isActiveMarkerClass;

                icon = this.icons.brandActive;

                setMarkerIcon(activeMarker, icon);
                setMarkerZIndex(activeMarker, 'active');

                this.activeDealer = model.get('id');
            }
            //deactivate this marker
            else {
                if (hasPosition) {
                    icon = this.icons.brand;
                }
                else {
                    icon = this.icons.brand;
                }

                setMarkerIcon(activeMarker, icon);
                setMarkerZIndex(activeMarker, false);
            }

            activeMarker.set('labelClass', labelClass);

            return this;
        },

        disableActiveMarker : function() {
            log.info('disableActiveMarker');
            var activeMarkerID = this.activeDealer,
                activeMarker;

            if (activeMarkerID) {
                activeMarker = this.collectionInstance.get(activeMarkerID);
                this.setActiveMarker(activeMarker, false);
            }
            this.activeDealer = false;
        },

        /**
         * Respond to a change in model position on the collection (change:position)
         *
         * @param backbone.model
         * @param integer
         * @param json
         * @return this
         */
        updateMarker : function (model, modelPosition, options) {
            var forceDraw = false,
                isSingleDigitClass = 'single-digit',
                marker = model.get('marker');

            //reset item
            if (modelPosition === undefined) {

                //reset marker
                marker.set('labelContent', '');
                marker.set('labelClass', '');
                setMarkerIcon(marker, this.icons.brand);
                setMarkerZIndex(marker, false);

            //item is in the search results
            } else {
                setMarkerZIndex(marker, 'result', modelPosition);
            }

            if (forceDraw === true) {
                try {
                    marker.label.draw();
                }
                catch (exception) {
                    log.error('updateMarker - ' + exception.message);
                }
            }
        },

        /**
         * Removes dealer detail
         */
        removeDealerDetail : function () {
            log.info('removeDealerDetail');

            $(this.settings.dealerDetailContainerSelect)
                .empty()
                .parentsUntil('map-wrapper')
                .removeClass(isShowingDetailClass);

            this.refresh();
        },


        /**
         * Set the dealer detail loading
         *
         * @return this
         */
        loadingDealerDetail : function () {
            $(this.settings.dealerDetailContainerSelect).addClass(this.settings.detailsLoadingClass);
            return this;
        },


        /**
         * Show the dealer detail information
         *
         * @param backbone.model
         * @param integer
         * @return jquery.object
         */
        showDealerDetail : function (model, panTo) {
            var dealerContent, html,
                thisLocation,
                dealerPosition, dealerGeo, dealerLatLng,
                isSingleDigitClass = 'single-digit',
                $parent,
                $elem,
                e;

            log.info('showDealerDetail');

            if (this.dealerTemplate) {
                dealerContent = model.toJSON();

                //if this dealer is in the list of results
                if (_.contains(this.resultsList, dealerContent.id) === true) {
                    dealerContent.hasPagination = true;
                }

                //get geolocation details and add to content object
                thisLocation = this.settings.isGeolocated();

                dealerPosition = model.get('position');
                if (dealerPosition >= 9 || model.get('position') === undefined) {
                    isSingleDigitClass = '';
                }

                $.extend(dealerContent, {
                    "isSingleDigit" : isSingleDigitClass,
                    "mygeolocation" : thisLocation,
                    "resultsTotal" : this.resultsList.length
                });

                e = $.Event('dealerSelected', dealerContent);

                $(this.settings.dealerDetailContainerSelect).trigger(e);

                html = this.dealerTemplate(dealerContent);
                $elem = $(this.settings.dealerDetailContainerSelect);

                $elem.removeClass(this.settings.detailsLoadingClass)
                    .html(html);

                //add a class to the map so it can resize if needed
                $parent = this.$el.parent().parent();

                if ($parent.hasClass(isShowingDetailClass) === false) {
                    $parent.addClass(isShowingDetailClass);

                    google.maps.event.trigger(this.map, 'resize');

                    //re-apply center
                    this.map.setCenter(model.get('marker').getPosition());
                }

                $(this.settings.backToMyAccountCloseButton, $elem).on('click', function(){
                    $(this).parents(this.settings.backToMyAccountWrapper).addClass(this.settings.inactiveClass);
                });
            }

            //mark the pin as the active one
            this.setActiveMarker(model, true);

            //ensure the marker is visible
            dealerGeo = model.get('geolocation');
            dealerLatLng = new google.maps.LatLng(dealerGeo.latitude, dealerGeo.longitude);

            if (this.map.getBounds().contains(dealerLatLng) === false) {
                this.map.panTo(dealerLatLng);
            }

            if (this.settings.onShowDealerDetail) {
                this.settings.onShowDealerDetail();
            }

            return $elem;
        },


        /**
         * Watch for the selection of a dealer
         *
         * @param jquery.event
         */
        dealerSelection : function(event) {
            var link = $(event.target),
                idVal = link.attr('data-id');

            log.info('dealerSelection');

            event.preventDefault();
            event.stopImmediatePropagation();

            //trigger an event so other modules can handle it
            link.trigger('dealer-selected', [idVal]);
        },


        /**
         * Create markers
         * DOCS MarkerWithLabel : http://google-maps-utility-library-v3.googlecode.com/svn/tags/markerwithlabel/1.1.9/docs/reference.html
         *
         * @param json
         * @param object
         * @param string
         * @return MarkerWithLabel|false
         */
        addMarker : function (markerOptions, location, iconKey) {
            var instance = this,
                markerDefaults = {
                    draggable: false,
                    raiseOnDrag: false,
                    map: instance.map,
                    icon: instance.icons.brand,
                    labelContent: '',
                    labelAnchor: new google.maps.Point(this.labelanchorLeft, this.labelanchorTop),
                    labelClass: ''
                },
                markerSettings;

            if (location) {
                markerSettings = $.extend({}, markerDefaults, markerOptions);
                markerSettings.position = new google.maps.LatLng(location.latitude, location.longitude);

                if (iconKey && instance.icons[iconKey]) {
                    markerSettings.icon = instance.icons[iconKey];
                }

                return new window.MarkerWithLabel(markerSettings);
            }

            return false;
        },


        /**
         * For each item in collection, create a marker with an action
         *
         * @param jquery.object
         * @param json
         * @return array
         */
        addDealerMarkers : function ($el, options) {
            var instance = this,
                collectionInstance = instance.collectionInstance,
                markerList = [],
                //action for each marker
                fViewMarker = function () {
                    instance.viewMarker(this);
                };

            log.info('addDealerMarkers');

            //for all items in the collection
            collectionInstance.each(function (model, index) {
                var dealerGeo = model.get('geolocation'),
                    dealerOptions,
                    marker;

                dealerOptions = {
                    "dealerId": model.get('id'),
                    "title": model.get('tradingName')
                };

                //create the marker and add to map
                marker = instance.addMarker(dealerOptions, dealerGeo);

                //watch for clicks
                google.maps.event.addListener(marker, 'click', fViewMarker);

                //keep a reference to the marker in the model
                model.set('marker', marker);

                // add marker to list
                markerList.push(marker);

            });

            //set the map boundary to include all markers
            instance.extendBounds(markerList);

            return markerList;
        },


        /**
         * Apply the MarkerClusterer to a list of pins
         * DOCS: http://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclustererplus/docs/reference.html
         *
         * @param jquery.object
         * @param json
         * @param array
         * @return MarkerClusterer
         */
        clusterMarkers : function ($el, clusterStyles, markerList) {
            var markerCluster = new MarkerClusterer( this.map, markerList, {
                "gridSize": 60,
                "maxZoom": clusterMaxZoom,
                "minimumClusterSize": 2,
                "styles": clusterStyles,
                "ignoreHidden": true
            });

            log.info('clusterMarkers');

            this.markerCluster = markerCluster;

            $(this).trigger("mapFinishedLoading"); //using this to know when to run the prefilter

            return markerCluster;
        },


        /**
         * Extend the boundaries of the map to contain the list of markers
         *
         * @param array
         * @return this
         */
        extendBounds : function (newMarkers) {
            var instance = this,
                newBoundary = new google.maps.LatLngBounds();

            log.info('extendBounds');

            if (newMarkers.length > 0) {
                $.each(newMarkers, function (index, marker) {
                    newBoundary.extend(marker.getPosition());
                });
                instance.map.fitBounds(newBoundary);
            }

            return this;
        },


        /**
         * Set / unset the location / geolocation pin on the map
         *
         * @param float
         * @param float
         * @param string
         * @return this
         */
        setLocation : function (latitude, longitude, displayText) {
            var latLng;

            log.info('setLocation');

            //set location pin
            if (latitude && longitude) {
                latLng = new google.maps.LatLng(latitude, longitude);
                this.geoMarkerInstance = new window.MarkerWithLabel({
                    "position": latLng,
                    "clickable": false,
                    "draggable": false,
                    "raiseOnDrag": false,
                    "map": this.map,
                    "icon": this.icons.geo,
                    "labelContent": '',
                    "title": displayText
                });
            }

            //remove location pin
            else if (this.geoMarkerInstance) {
                this.geoMarkerInstance.setMap(null);
                this.geoMarkerInstance = null;
            }
            return this;
        },


        /**
         * Destroy instance
         */
        destroy : function () {
            this.$el = null;

            //remove the reference to this object
            return delete mapInstances[this.instanceId];
        }
    };


    /**
     * Set marker icon
     *
     * @param MarkerWithLabel
     * @param string
     * @return MarkerWithLabel
     */
    function setMarkerIcon(marker, icon) {
        return marker.set("icon", icon);
    }

    /**
     * Set the z-index of a marker based upon its state
     * The z-index values are complex due to the labels so they have to be high values and reset to their originals
     *
     * @return MarkerWithLabel
     */
    function setMarkerZIndex(marker, type, positionParam) {
        var activeZ = 1000,
            resultZ = 900,
            position = positionParam || 0,
            oldZ = marker.get('oldZIndex'),
            currentZ = marker.getZIndex(),
            newZ;

        //if old z is not set then this is the first time we've seen this pin
        if (oldZ === undefined) {
            oldZ = currentZ;
            marker.set('oldZIndex', currentZ);
        }

        if (type === 'active') {
            newZ = activeZ;
        }
        else if (type === 'result') {
            newZ = resultZ - position;
        }
        else {
            newZ = oldZ;
        }

        marker.setZIndex(newZ);

        return marker;
    }

    /**
     * Init map instance
     *
     * @param jquery.object
     * @param json
     * @param json
     * @return Map
     */
    function initInstance(el, options, data) {
        if (typeof googleMaps !== 'undefined') {
            return new Map(el, options, data);
        }
    }


    /**
     * Get instance of Map for $el
     *
     * @param jquery.object
     * @return Map
     */
    function getInstance($el) {
        var instanceId = $el.attr(mapInstanceAttr);
        return mapInstances[instanceId];
    }


    /**
     * Destroy instance of Map for $el
     *
     * @param jquery.object
     * @return Map.destroy|false
     */
    function destroy($el) {
        var mapInstance = getInstance($el);

        if (mapInstance) {
            return mapInstance.destroy();
        }
        return false;
    }


    /**
     * Public
     */
    return {
        initInstance : initInstance
    };
});


