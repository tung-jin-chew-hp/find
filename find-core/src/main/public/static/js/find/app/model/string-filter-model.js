define([
    'backbone',
    'fieldtext/js/field-text-parser'
], function(Backbone, parser) {

    /**
     * @enum {String}
     * @readonly
     */
    var Filters = {
        CustomerId: ''
    };

    return Backbone.Model.extend({
        /**
         * @typedef {Object} StringFilterModelAttributes
         * @property {?Filters} dateRange
         */
        /**
         * @type StringFilterModelAttributes
         */
        defaults: Filters,

        /**
         * Convert this model to attributes for the QueryModel.
         * @return {Object}
         */
        toQueryModelAttributes: function() {
            var filtered = {};
            var all = this.toJSON()

            _.each(all, function(val, key){
                if (val) {
                    filtered[key] = val
                }
            })

            return filtered;
        },

        toFieldTextNode: function(){
            var nodes = []

            var attrs = this.toQueryModelAttributes();

            _.each(attrs, function(val, field) {
                nodes.push(new parser.ExpressionNode('MATCH', [field], [val]))
            })

            return nodes.length ? _.reduce(nodes, parser.AND) : null;
        }
    }, {});

});