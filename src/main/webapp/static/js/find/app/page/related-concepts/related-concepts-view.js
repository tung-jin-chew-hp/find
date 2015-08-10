define([
    'backbone',
    'i18n!find/nls/bundle',
    'find/app/model/documents-collection',
    'text!find/templates/app/page/related-concepts/related-concepts-view.html',
    'text!find/templates/app/page/top-results-popover-contents.html',
    'text!find/templates/app/page/loading-spinner.html'
], function(Backbone, i18n, DocumentsCollection, template, topResultsPopoverContents, loadingSpinnerTemplate) {

    return Backbone.View.extend({

        className: 'suggestions-content',

        template: _.template(template),
        messageTemplate: _.template('<div><%-message%> </div>'),
        topResultsPopoverContents: _.template(topResultsPopoverContents),
        loadingSpinnerTemplate: _.template(loadingSpinnerTemplate)({i18n: i18n}),

        events: {
            'mouseover a': _.debounce(function(e) {
                this.$(' .popover-content').append(this.loadingTemplate);

                this.topResultsCollection.fetch({
                    data: {
                        text: $(e.currentTarget).html(),
                        max_results: 3,
                        summary: 'context',
                        index: this.queryModel.get('indexes')
                    }
                });
            }, 800),
            'click .query-text' : function(e) {
                var $target = $(e.target);
                var queryText = $target.attr('data-title');
                this.queryModel.set('queryText', queryText);
            }
        },

        initialize: function(options) {
            this.queryModel = options.queryModel;
            this.entityCollection = options.entityCollection;

            this.topResultsCollection = new DocumentsCollection([], {
                indexesCollection: options.indexesCollection
            });
        },

        render: function() {
            this.listenTo(this.entityCollection, 'reset', function() {
                this.$el.empty();

                if (this.entityCollection.isEmpty()) {
                    this.$el.addClass('hide')
                }
                else {
                    var clusters = this.entityCollection.groupBy('cluster');

                    _.each(clusters, function(entities) {
                        this.$el.append(this.template({
                            entities: entities
                        }));

                        this.$('li a').popover({
                            html: true,
                            placement: 'bottom',
                            trigger: 'hover'
                        })
                    }, this);
                }
            });

            /*top 3 results popover*/
            this.listenTo(this.topResultsCollection, 'add', function(model){
                this.$('.popover-content .loading-spinner').remove();

                this.$('.popover-content').append(this.topResultsPopoverContents({
                    title: model.get('title'),
                    summary: model.get('summary').trim().substring(0, 100) + "..."
                }));
            });

            /*suggested links*/
            this.listenTo(this.entityCollection, 'request', function() {
                this.$el.empty();

                this.$el.append(this.loadingSpinnerTemplate);

                this.$el.removeClass('hide');
            });

            this.listenTo(this.entityCollection, 'error', function() {
                this.$el.empty();

                this.$el.append(this.messageTemplate({message: i18n['search.error.relatedConcepts']}));

                this.$el.removeClass('hide');
            });
        }

    })

});
