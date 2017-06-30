define([
    'backbone',
    'underscore',
    'fieldtext/js/field-text-parser',
    'find/app/configuration'
], function(Backbone, _, parser, configuration) {

    function MapLatLonFields(id, name, latLonFieldPairs, cfg) {
        this.id = id;
        this.displayName = name;
        this.fields = latLonFieldPairs;
        this.iconName = cfg.iconName;
        this.iconColor = cfg.iconColor;
        this.markerColor = cfg.markerColor;
    }

    const config = configuration();

    const locationFields = [];
    const locationFieldsById = {};

    if (config && config.map && config.map.locationFields && config.fieldsInfo) {
        const fieldsInfo = config.fieldsInfo;

        function getFieldName(fieldName) {
            const fieldMeta = fieldsInfo[fieldName];
            if (fieldMeta && fieldMeta.names && fieldMeta.names.length) {
                return fieldMeta.names;
            }
        }

        _.each(config.map.locationFields, function(field){
            const latField = field.latitudeField;
            const lonField = field.longitudeField;

            const latFields = getFieldName(latField);
            const lonFields = getFieldName(lonField);

            if (latFields && lonFields) {
                const latLonFields = [];

                for (let ii = 0, max = Math.min(latFields.length, lonFields.length); ii < max; ++ii) {
                    latLonFields.push([latFields[ii], lonFields[ii]])
                }

                if (latLonFields.length) {
                    const name = field.displayName;
                    const id = field.id || name;
                    const newField = new MapLatLonFields(id, name, latLonFields, field);

                    // We avoid having any two fields with the same id.
                    if (!locationFieldsById.hasOwnProperty(id)) {
                        locationFields.push(newField);
                        locationFieldsById[id] = newField;
                    }
                }
            }
        })
    }

    return Backbone.Model.extend({
        /**
         * @typedef {Object} GeographyModelAttributes
         * This is a attribute-value map of location field IDs to shape lists.
         */
        /**
         * @type GeographyModelAttributes
         */
        defaults: _.mapObject(locationFieldsById, function(){ return [] }),

        appendFieldText: function(existingFieldText){
            return parser.AND(existingFieldText, this.toFieldText());
        },

        /**
         * Convert this model to fieldtext queries
         */
        toFieldText: function() {
            const allLocationFields = _.compact(_.map(locationFieldsById, function(locationField) {
                const shapes = this.get(locationField.id);
                if (!shapes || !shapes.length) {
                    return null;
                }

                const latLonFields = locationField.fields;
                const fieldNodes = [];
                const negatedFieldNodes = [];

                _.each(shapes, function (shape) {
                    const toAdd = shape.NOT ? negatedFieldNodes : fieldNodes;
                    if (shape.type === 'circle') {
                        // IDOL uses kilometers, while leaflet uses meters.
                        const km = Math.round(shape.radius / 1000);

                        _.each(latLonFields, function(fieldPair) {
                            toAdd.push(new parser.ExpressionNode('DISTSPHERICAL', fieldPair, [
                                shape.center[0],
                                shape.center[1],
                                km
                            ]));
                        })
                    }
                    else if (shape.type === 'polygon') {
                        const points = _.flatten(shape.points);
                        _.each(latLonFields, function(fieldPair) {
                            toAdd.push(new parser.ExpressionNode('POLYGON', fieldPair, points));
                        });
                    }
                });

                function coalesceOR(nodes) {
                    return nodes.length ? _.reduce(nodes, parser.OR) : null;
                }

                const fieldText = coalesceOR(fieldNodes);
                const negateFieldText = coalesceOR(negatedFieldNodes);

                return parser.AND(fieldText, negateFieldText && negateFieldText.NOT());
            }, this));

            return allLocationFields.length ? _.reduce(allLocationFields, parser.AND) : null;
        }
    }, {
        LocationFields: locationFields,
        LocationFieldsById: locationFieldsById
    });

});