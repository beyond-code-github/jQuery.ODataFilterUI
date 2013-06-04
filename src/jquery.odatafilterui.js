(function($) {

    $.fn.oDataFilterUI = function (options)
    {
        var settings = $.extend({
            Fields: []  
        }, options );

        // Convert input to hidden
        this.attr("type", "hidden");

        // Append container
        var container = this.wrap($('<div>')).parent();
        
        var noFilterMessage = $("<span>").html("There are currently no filters applied").prependTo(container);
        noFilterMessage.before("<!-- ko if: !FilterRows() || FilterRows().length == 0 -->")
        noFilterMessage.after("<!-- /ko -->")
     
        var rowContainer = $('<div>', { "data-bind": "foreach: FilterRows" }).insertAfter(this);
        var row = $('<ol>').appendTo(rowContainer);
        
        // Append input elements
        var filterField = $('<select>', { class: "filterField", "data-bind": "value: Field, options: $parent.Fields, optionsText: 'text'" })
            .appendTo(row).wrap($("<li>"));
        var operatorField = $('<select>', { class: "filterOperator", "data-bind": "value: Operator, options: OperatorsList, optionsText: 'text', optionsValue: 'value'" })
            .appendTo(row).wrap($("<li>"));
        
        var filterFieldLi = $('<input>', { class: "filterValue", type: "text", "data-bind": "value: Value" })
            .appendTo(row).wrap($("<li>")).parent();
        filterFieldLi.before("<!-- ko if: (Field() && Field().type == 'string') || !Field() -->")
        filterFieldLi.after("<!-- /ko -->")

        var filterFieldNumberLi = $('<input>', { class: "filterValue", type: "number", "data-bind": "value: Value" })
            .appendTo(row).wrap($("<li>")).parent();
        filterFieldNumberLi.before("<!-- ko if: Field() && Field().type == 'int' -->")
        filterFieldNumberLi.after("<!-- /ko -->")

        var filterFieldBoolLi = $('<input>', { class: "filterValue", type: "checkbox", "data-bind": "checked: Value" })
            .appendTo(row).wrap($("<li>")).parent();
        filterFieldBoolLi.before("<!-- ko if: Field() && Field().type == 'bool' -->")
        filterFieldBoolLi.after("<!-- /ko -->")

        var removeButton = $('<a>', { class: "filterRemove", href: "#", "data-bind": "click: $parent.removeFilter" })
            .html("remove")
            .appendTo(row).wrap($("<li>"));

        var addAnother = $('<a>', { class: "addAnother", href: "#", "data-bind": "click: addAnother"  }).html("add").appendTo(container);

        // Row model constructor
        var createRow = function () {
            var field = ko.observable();
            var operator = ko.observable();
            var value = ko.observable();
            var fieldName = ko.computed(function () {
                return field().value;
            }, null, { deferEvaluation: true});

            var operatorsList = ko.computed(function() {
                var result = [
                    { text: "Equals", value: "eq" },
                    { text: "Not equals", value: "ne" }
                ];

                var fieldType = field() ? field().type : "string";
                switch (fieldType) {
                    case "int":
                        result.push({ text: "Greater than", value: "gt" });
                        result.push({ text: "Greater than or equals", value: "ge" });
                        result.push({ text: "Less than", value: "lt" });
                        result.push({ text: "Less than or equals", value: "le" });
                        break;
                    case "string":
                        result.push({ text: "Starts With", value: "startswith" });
                        result.push({ text: "Ends With", value: "endswith" });
                        result.push({ text: "Contains", value: "contains" });
                        break;
                }                
                
                return result;
            }, null, { deferEvaluation: true });

            var row = {};
            row.Field = field;
            row.FieldName = fieldName;
            row.Operator = operator;
            row.Value = value;
            row.OperatorsList = operatorsList;

            return row;
        };

        // Model constructor
        var filterRows = ko.observableArray([createRow()]);
        var fields = ko.observableArray(settings.Fields);

        var removeFilter = function (filter) {
            if (filterRows().length > 0)
            {
                filterRows.remove(filter);
            }
        };

        var addAnother = function () {
            filterRows.push(createRow());
        };

        var getODataFilter = ko.computed(function() {
            var filters = [];
            for (var index in filterRows())
            {
                var row = filterRows()[index];
                var part = row.FieldName() + " " + row.Operator() + " ";
                switch(row.Field().type)
                {
                    case "string":
                        var stringValue = "'" + (row.Value() ? row.Value() : "") + "'";
                        switch (row.Operator())
                        {
                            case "startswith":
                                part = "startswith(" + row.FieldName() + "," + stringValue + ")";
                                break;
                            case "endswith":
                                part = "endswith(" + row.FieldName() + "," + stringValue + ")";
                                break;
                            case "contains":
                                part = "substringof(" + stringValue + "," + row.FieldName() + ")";
                                break;
                            default:
                                part = part + "'" + (row.Value() ? row.Value() : "") + "'";
                        }
                        filters.push(part);
                        break;
                    case "int":
                        part = part + (row.Value() ? row.Value() : 0);
                        filters.push(part);
                        break;
                    case "bool":
                        part = part + (row.Value() ? row.Value() : false);
                        filters.push(part);
                        break;
                }
            }

            return "$filter=" + filters.join(" and ");
        }, null, { deferEvaluation : true });

        if (settings.Model)
        {
            this.Model = settings.Model;
        }
        else
        {
            this.Model = {};
            this.Model.FilterRows = filterRows;
            this.Model.Fields = fields;
            this.Model.removeFilter = removeFilter;
            this.Model.addAnother = addAnother;
            this.Model.getODataFilter = getODataFilter;
        }

        ko.applyBindings(this.Model, container.get(0));

        return this;
    }

}(jQuery));