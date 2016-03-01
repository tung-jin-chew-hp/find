define([
    'backbone',
    'jquery',
    'underscore',
    'i18n!find/nls/bundle',
    'text!find/templates/app/page/search/cluster/cluster2d.html'
], function(Backbone, $, _, i18n, template) {

    var JOB_NAME = 'CAT_SCITECH_HOT'

    var html = _.template(template)({
        i18n: i18n,
        jobName: JOB_NAME
    });

    var collection = new (Backbone.Collection.extend({
        url: '../api/public/cluster/clusters'
    }))

    collection.fetch({
        data: {
            sourceName: JOB_NAME
        }
    })

    return Backbone.View.extend({
        className: 'full-height cluster2d-container',

        initialize: function(options){
            this.searchModel = options.searchModel;
            collection.on('update change reset', this.redrawMarkers, this)
        },

        render: function() {
            this.$el.html(html)
            this.redrawMarkers()

            this.$el.on('click', '.cluster-marker', _.bind(function(evt){
                var marker = $(evt.currentTarget);
                this.searchModel.set('inputText', marker.data('terms'))
            }, this))
        },

        redrawMarkers: function(){
            var $clusterEl = this.$('.cluster2d');
            $clusterEl.find('.cluster-marker').remove()

            collection.each(function(cluster){
                $('<div class="cluster-marker" data-toggle="tooltip" data-placement="top" title="'+ cluster.escape('title') + ' (' + cluster.escape('score')+ ')'+'" data-terms="'+cluster.escape('title')+'"></div>').css({
                    left: cluster.get('x')+'px',
                    top: cluster.get('y')+'px'
                }).appendTo($clusterEl)
            }, this)

            $clusterEl.find('[data-toggle="tooltip"]').tooltip();
        }
    })
})

