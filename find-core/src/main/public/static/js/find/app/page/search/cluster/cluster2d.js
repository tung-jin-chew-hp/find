define([
    'backbone',
    'jquery',
    'underscore',
    'i18n!find/nls/bundle',
    'text!find/templates/app/page/search/cluster/cluster2d.html'
], function(Backbone, $, _, i18n, template) {
    var html = _.template(template)({i18n: i18n});

    return Backbone.View.extend({
        className: 'full-height cluster2d',

        render: function() {
            this.$el.html(html)
        }
    })
})

