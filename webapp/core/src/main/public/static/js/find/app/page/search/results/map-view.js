define([
    'backbone',
    'underscore',
    'jquery',
    'find/app/configuration',
    'find/app/vent',
    'leaflet',
    'Leaflet.awesome-markers',
    'leaflet.markercluster',
    'html2canvas'
], function (Backbone, _, $, configuration, vent, leaflet) {

    'use strict';
    var INITIAL_ZOOM = 3;

    return Backbone.View.extend({
        initialize: function (options) {
            this.addControl = options.addControl || false;

            this.clusterMarkers = leaflet.markerClusterGroup();
            this.markerLayerGroup = leaflet.featureGroup();
            this.markers = [];

            this.listenTo(vent, 'vent:resize', function () {
                if (this.map) {
                    this.map.invalidateSize();
                }
            });            
        },

        render: function () {
            this.removeMap();
            var map = this.map = leaflet.map(this.$el.get(0), {
                attributionControl: false,
                minZoom: 1, // Furthest you can zoom out (smaller is further)
                maxZoom: 18,// Map does not display tiles above zoom level 18 (2016-07-06)
                worldCopyJump: true
            });

            leaflet
                .tileLayer(configuration().map.tileUrlTemplate)
                .addTo(map);

            var attributionText = configuration().map.attribution;

            if (this.addControl) {
                this.control = leaflet.control.layers().addTo(map);
            }

            if (attributionText) {
                leaflet.control.attribution({prefix: false})
                    .addAttribution(attributionText)
                    .addTo(map);
            }
            
            var initialLatitude = configuration().map.initialLocation.latitude;
            var initialLongitude = configuration().map.initialLocation.longitude;

            map.setView([initialLatitude, initialLongitude], INITIAL_ZOOM);
        },

        addMarkers: function(markers, cluster) {
            this.markers = markers;
            if (cluster) {
                this.clusterMarkers.addLayers(markers);
                this.map.addLayer(this.clusterMarkers)
            }
            else {
                this.markerLayerGroup = new leaflet.featureGroup(markers);
                this.map.addLayer(this.markerLayerGroup);
            }
        },

        createLayer: function(options) {
            // This can be changed in the future to create a cluster or normal group if needed.
            return new leaflet.markerClusterGroup(options);
        },
        
        addLayer: function(layer, name) {
            this.map.addLayer(layer);
            if (this.control) {
                this.control.addOverlay(layer, name);
            }
        },        
        
        loaded: function(markers) {
            this.map.fitBounds(new leaflet.featureGroup(_.isEmpty(markers) ? this.markers : markers))
        },
        
        getMarker: function(latitude, longitude, icon, title, popover) {
            return leaflet.marker([latitude, longitude], {icon: icon, title: title})
                .bindPopup(popover);            
        },
        
        getIcon: function (iconName, iconColor, markerColor) {
            return leaflet.AwesomeMarkers.icon({
                icon: iconName || 'compass',
                iconColor: iconColor || 'white',
                markerColor: markerColor || 'blue',
                prefix: 'hp',
                extraClasses: 'hp-icon'
            });
        },

        getDivIconCreateFunction: function(className) {
            return function (cluster) {
                return new leaflet.DivIcon({
                    html: '<div><span>' + cluster.getChildCount() + '</span></div>',
                    className: 'marker-cluster ' + className,
                    iconSize: new leaflet.Point(40, 40)
                });
            }
        },

        clearMarkers: function (cluster) {
            if (cluster) {
                this.clusterMarkers.clearLayers();
            } else {
                this.markerLayerGroup.clearLayers();
            }
            this.markers = [];
        },

        remove: function () {
            this.removeMap();
            Backbone.View.prototype.remove.call(this);
        },

        removeMap: function () {
            if (this.map) {
                this.map.remove();
            }
        },

        exportPPT: function(title) {
            var map = this.map,
                mapSize = map.getSize(),
                $mapEl = $(map.getContainer()),
                markers = [];

            function lPad(str) {
                return str.length < 2 ? '0' + str : str
            }

            function hexColor(str){
                var match;
                if (match = /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/.exec(str)) {
                    return '#' + lPad(Number(match[1]).toString(16))
                        + lPad(Number(match[2]).toString(16))
                        + lPad(Number(match[3]).toString(16))
                }
                else if (match = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(str)) {
                    return '#' + lPad(Number(match[1]).toString(16))
                        + lPad(Number(match[2]).toString(16))
                        + lPad(Number(match[3]).toString(16))
                }
                return str
            }

            map.eachLayer(function(layer){
                if (layer instanceof leaflet.Marker) {
                    var pos = map.latLngToContainerPoint(layer.getLatLng())

                    var isCluster = layer.getChildCount

                    var xFraction = pos.x / mapSize.x;
                    var yFraction = pos.y / mapSize.y;
                    var tolerance = 0.001;

                    if (xFraction > -tolerance && xFraction < 1 + tolerance && yFraction > -tolerance && yFraction < 1 + tolerance) {
                        markers.push({
                            x: xFraction,
                            y: yFraction,
                            text: isCluster ? layer.getChildCount() :  $(layer.getPopup()._content).find('.map-popup-title').text(),
                            cluster: !!isCluster,
                            color: isCluster ? hexColor($(layer._icon).css('background-color')) : hexColor('rgba(55, 168, 218, 1)')
                        })
                    }
                }
            })

            var $objs = $mapEl.find('.leaflet-objects-pane').addClass('hide')

            html2canvas($mapEl, {
                logging: true,
                // This seems to avoid issues with IE11 only rendering a small portion of the map the size of the window
                // If width and height are undefined, Firefox sometimes renders black areas.
                // If width and height are equal to the $mapEl.width()/height(), then Chrome has the same problem as IE11.
                width: mapSize.x * 2,
                height: mapSize.y * 2,
                proxy: '../api/public/map/proxy',
                onrendered: function(canvas) {
                    $objs.removeClass('hide')

                    var $form = $('<form class="hide" method="post" target="_blank" action="../api/bi/export/ppt/map"><input name="title"><input name="image"><input name="markers"><input type="submit"></form>');
                    $form[0].title.value = title
                    $form[0].image.value = canvas.toDataURL('image/jpeg')
                    $form[0].markers.value = JSON.stringify(markers)
                    $form.appendTo(document.body).submit().remove()
                }
            });
        }
    });
});
