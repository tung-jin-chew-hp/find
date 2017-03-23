/*
 * Copyright 2017 Hewlett Packard Enterprise Development Company, L.P.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License.
 */

define([
    'underscore',
    'jquery',
    'd3',
    'sunburst/js/sunburst',
    './saved-search-widget',
    'find/idol/app/page/dashboard/legend-color-collection',
    'text!find/idol/templates/page/dashboards/widgets/sunburst-widget-legend.html',
    'text!find/idol/templates/page/dashboards/widgets/sunburst-widget-legend-entry.html',
    'text!find/idol/templates/page/dashboards/widgets/sunburst-legend-other-entry.html',
    'i18n!find/nls/bundle'
], function(_, $, d3, Sunburst, SavedSearchWidget, LegendColorCollection, legendTemplate,
            legendEntryTemplate, legendOtherEntryTemplate, i18n) {
    'use strict';

    const otherHtml = _.template(legendOtherEntryTemplate)({i18n: i18n});
    const legendEntryTemplateFn = _.template(legendEntryTemplate);
    const noResultsMessage = '<span class="sunburst-widget-no-results-text hide">' +
        _.escape(i18n['dashboards.widget.sunburst.noResults']) +
        '</span>';
    const HIDDEN_COLOR = '#ffffff';

    function composeLegendHtml(datum) {
        return legendEntryTemplateFn({
            text: datum.text,
            color: datum.color
        });
    }

    /**
     * @desc If there are too many values to display in the Sunburst or in the legend, the
     * legend's first entry should say there are too many entries. This function appends
     * the requisite entry to the legend's HTML.
     *
     * @param {String[]} legendHtmlArray HTML strings representing the legend entries
     * @param tooMany {Boolean} flag setting whether an 'Other' entry should be prepended
     * @returns {String}
     */
    function buildLegendHtml(legendHtmlArray, tooMany) {
        return legendHtmlArray.join('') +
            (legendHtmlArray.length > 0 && tooMany
                ? otherHtml
                : '');
    }

    return SavedSearchWidget.extend({
        viewType: 'sunburst',
        legendTemplate: _.template(legendTemplate),

        initialize: function(options) {
            SavedSearchWidget.prototype.initialize.apply(this, arguments);

            this.firstField = this.widgetSettings.firstField;
            this.secondField = this.widgetSettings.secondField;
            this.maxLegendEntries = this.widgetSettings.maxLegendEntries || 5;

            this.legendColorCollection = new LegendColorCollection(null, {
                hiddenColor: HIDDEN_COLOR,
                maxLegendEntries: this.maxLegendEntries
            });

            this.listenTo(this.legendColorCollection, 'update reset', this.updateSunburstAndLegend);
        },

        render: function() {
            SavedSearchWidget.prototype.render.apply(this);

            this.$legendContainer = $('<div class="sunburst-legend"></div>');
            this.$visualizerContainer = $('<div class="sunburst-visualizer-container"></div>');
            this.$emptyMessage = $(noResultsMessage);

            this.$content.append(this.$emptyMessage.add(this.$visualizerContainer.add(this.$legendContainer)));
            this.updateLayout();
        },

        // Decide if legend is placed underneath the visualizer, or to the side.
        updateLayout: function() {
            if(this.$legendContainer && this.$content) {
                // Prefer side-by-side layout: widget must be slightly narrower than a square
                // for legend to be placed underneath Sunburst
                const narrowWidget = this.contentWidth() * 0.9 < this.contentHeight();

                this.$legendContainer.toggleClass('legend-one-entry-per-line', !narrowWidget);
                this.$content.toggleClass('narrow-widget', narrowWidget);
            }
        },

        onResize: function() {
            this.updateLayout();

            if(this.sunburst) {
                this.sunburst.resize();
                this.sunburst.redraw();
            }
        },

        getData: function() {
            return this.legendColorCollection
                .fetchDependentFields(this.queryModel, this.firstField.id, this.secondField ? this.secondField.id : null);
        },

        drawSunburst: function(data) {
            return this.$content && this.$visualizerContainer
                ? new Sunburst(this.$visualizerContainer, {
                    animate: true,
                    sizeAttr: 'count',
                    nameAttr: 'text',
                    comparator: function(datumA, datumB) {
                        return d3.ascending(datumA.text, datumB.text);
                    },
                    data: data,
                    fillColorFn: function(datum) {
                        if(!datum.parent) {
                            return 'none';
                        }

                        // All data should have colors by this point
                        return datum.color
                            ? datum.color
                            : HIDDEN_COLOR;
                    },
                    labelFormatter: null// no labels on hover
                })
                : null;
        },

        updateSunburstAndLegend: function(collection) {
            if(this.$visualizerContainer && this.$legendContainer && this.$emptyMessage) {
                const empty = collection.isEmpty();
                this.$visualizerContainer.toggleClass('hide', empty);
                this.$legendContainer.toggleClass('hide', empty);
                this.$emptyMessage.toggleClass('hide', !empty);
                if(empty) {
                    // Next time we have data, the initialisation animation will run again
                    this.sunburst = null;
                    this.$visualizerContainer.empty();
                } else {
                    const rootData = {children: collection.toJSON()};

                    this.updateLayout();
                    if(this.sunburst) {
                        this.sunburst.resize();
                        this.sunburst.redraw(rootData);
                    } else {
                        this.sunburst = this.drawSunburst(rootData);
                    }
                }
            }

            this.populateLegend();
        },

        populateLegend: function() {
            if(this.$content && this.$legendContainer) {
                this.$legendContainer
                    .html(this.legendTemplate({
                        innerRingHeader: this.firstField.displayName,
                        outerRingHeader: this.secondField ? this.secondField.displayName : null
                    }));

                this.$innerLegend = this.$legendContainer
                    .find('.inner-ring-legend .sunburst-legend-field-values');
                this.$outerLegend = this.$legendContainer
                    .find('.outer-ring-legend .sunburst-legend-field-values');

                const tier1Hash = this.legendColorCollection.tier1;
                const tier2Hash = this.legendColorCollection.tier2;
                const tier1 = {
                    legendData: tier1Hash ? tier1Hash.legendData : null,
                    hidden: tier1Hash ? tier1Hash.hidden : null,
                    $el: this.$innerLegend
                };
                const tier2 = {
                    legendData: tier2Hash ? tier2Hash.legendData : null,
                    hidden: tier2Hash ? tier2Hash.hidden : null,
                    $el: this.$outerLegend
                };

                _.each([tier1, tier2], function(tier) {
                    if(!tier || (tier && tier.legendData === null)) {
                        tier.$el.text(i18n['dashboards.widget.sunburst.legend.noValues']);
                    } else {
                        const htmlArray = [];

                        _.each(tier.legendData, function(legendDatum) {
                            htmlArray.push(composeLegendHtml(legendDatum));
                        });

                        if(htmlArray.length > 0) {
                            tier.$el.html(buildLegendHtml(htmlArray, tier.hidden));
                        } else {
                            tier.$el.text(i18n['dashboards.widget.sunburst.legend.noValues']);
                        }
                    }
                });
            }
        }
    });
});
