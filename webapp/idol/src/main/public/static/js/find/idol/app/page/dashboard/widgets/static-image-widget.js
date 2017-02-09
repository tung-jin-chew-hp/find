/*
 * Copyright 2014-2017 Hewlett-Packard Development Company, L.P.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License.
 */

define([
    './widget'
], function(Widget) {
    'use strict';

    return Widget.extend({

        initialize: function(options) {
            Widget.prototype.initialize.apply(this, arguments);

            this.url = options.widgetSettings.url;
        },

        render: function() {
            Widget.prototype.render.apply(this, arguments);
            //noinspection CssUnknownTarget
            const html = $('<div class="static-image" style=\'background-image: url("' + this.url + '")\'></div>');

            this.$content.html(html);
        }
    });

});