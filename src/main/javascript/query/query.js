/*
 * ************************************************************************
 * Copyright (c), 2013 Next Century Corporation. All Rights Reserved.
 *
 * This software code is the exclusive property of Next Century Corporation and is
 * protected by United States and International laws relating to the protection
 * of intellectual property.  Distribution of this software code by or to an
 * unauthorized party, or removal of any of these notices, is strictly
 * prohibited and punishable by law.
 *
 * UNLESS PROVIDED OTHERWISE IN A LICENSE AGREEMENT GOVERNING THE USE OF THIS
 * SOFTWARE, TO WHICH YOU ARE AN AUTHORIZED PARTY, THIS SOFTWARE CODE HAS BEEN
 * ACQUIRED BY YOU "AS IS" AND WITHOUT WARRANTY OF ANY KIND.  ANY USE BY YOU OF
 * THIS SOFTWARE CODE IS AT YOUR OWN RISK.  ALL WARRANTIES OF ANY KIND, EITHER
 * EXPRESSED OR IMPLIED, INCLUDING, WITHOUT LIMITATION, IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE, ARE HEREBY EXPRESSLY
 * DISCLAIMED.
 *
 * PROPRIETARY AND CONFIDENTIAL TRADE SECRET MATERIAL NOT FOR DISCLOSURE OUTSIDE
 * OF NEXT CENTURY CORPORATION EXCEPT BY PRIOR WRITTEN PERMISSION AND WHEN
 * RECIPIENT IS UNDER OBLIGATION TO MAINTAIN SECRECY.
 */
neon.namespace('neon.query');


/**
 * The url of the query server. Defaults to localhost:8080/neon.
 * @property SERVER_URL
 * @type {String}
 */
neon.query.SERVER_URL = 'http://localhost:8080/neon';

/**
 * Represents a query to be constructed against some data source. This class is built so query
 * clauses can be chained together to create an entire query, as shown below
 * @example
     var where = neon.query.where;
     var and = neon.query.and;
     var query = new neon.query.Query(where(and(where('someProperty','=',5), where('someOtherProperty','<',10))));
     neon.query.executeQuery(query);
 * @namespace neon.query
 * @class Query
 * @constructor
 */
neon.query.Query = function() {


    this.filter = new neon.query.Filter();

    // includeFiltered_ is used privately on the javascript side but is not mapped to a field on the server
    this.includeFiltered_ = false;

    /*jshint expr: true */
    this.groupByClause;
    this.distinctClause;
    this.aggregates = [];

};

/**
 * The aggregation operation to count items
 * @property COUNT
 * @type {String}
 */
neon.query.COUNT = 'count';

/**
 * The aggregation operation to sum items
 * @property SUM
 * @type {String}
 */
neon.query.SUM = 'sum';

/**
 * The sort parameter for distinct clauses to sort ascending
 * @property ASC
 * @type {String}
 */
neon.query.ASC = 'asc';

/**
 * The sort parameter for distinct clauses to sort descending
 * @property DESC
 * @type {String}
 */
neon.query.DESC = 'desc';


// these ids are used for providing json args to the callback functions
neon.query.DATASET_ID_IDENTIFIER = 'datasetId';
neon.query.DATASOURCE_NAME_IDENTIFIER = 'dataSourceName';

/**
 * Sets the *select* clause of the query to select data from the specified dataset
 * @method selectFrom
 * @param {String} dataSourceName The name of the data source that contains the data
 * @param {String} datasetId The dataset to select from
 * @return {neon.query.Query} This query object
 */
neon.query.Query.prototype.selectFrom = function(dataSourceName, datasetId) {
    this.filter.selectFrom.apply(this.filter, arguments);
    return this;
};

/**
 * Sets the *where* clause of the query to determine how to select the data
 * @method where
 * @param {Object} arguments The arguments can be in either two formats<br>
 * <ol>
 *    <li>A 3 argument array as follows:
 *      <ul>
 *          <li>arguments[0] - The property to filter on in the database</li>
 *          <li>arguments[1] - The filter operator</li>
 *          <li>arguments[2] - The value to filter against</li>
 *      </ul>
 *    </li>
 *    <li>A boolean operator (and/or)</li>
 * </ol>
 * @example
     where('someProperty','=',5)

     where(neon.Query.and(where('someProperty','=',5), where('someOtherProperty','<',10)))
 * @return {neon.query.Query} This query object
 */
neon.query.Query.prototype.where = function () {
    this.filter.where.apply(this.filter, arguments);
    return this;
};

/**
 * Groups the results by the specified field(s)
 * @method groupBy
 * @param {String|Array} fields A field or fields to group the results by
 * @return {neon.query.Query} This query object
 */
neon.query.Query.prototype.groupBy = function(fields) {
    this.groupByClause = new neon.query.GroupByClause(fields);
    return this;
};

/**
 * Creates a new field with the specified name that aggregates the field with the given operatio
 * @param {String} aggregationOperation The operation to aggregate by. See the constants in this
 * class for operators (e.g. SUM, COUNT)
 * @param {String} aggregationField The field to perform the aggregation on
 * @param {String} name The name of the new field generated by this operation
 * @return {neon.query.Query} This query object
 */
neon.query.Query.prototype.aggregate = function(aggregationOperation, aggregationField, name) {
    this.aggregates.push(new neon.query.AggregateClause(aggregationOperation,aggregationField,name));
    return this;
};

/**
 * Creates a new DISTINCT clause that returns only the distinct values of the specified field
 * @method distinct
 * @param {String} field The name of the field to return distinct values for
 * @param {String} sortOrder (optional) The sort order (see the constants in this class)
 * @return {neon.query.Query} This query object
 */
neon.query.Query.prototype.distinct = function(field, sortOrder) {
    this.distinctClause = new neon.query.DistinctClause(field, sortOrder);
    return this;
};

/**
 * Indicates whether or not even data outside of the current filters should be returned
 * @method includeFiltered
 * @param {Boolean} includeFiltered true to include data outside of the current filters, false to just return
 * the data matched by the current filters (defaults to false)
 * @return {neon.query.Query} This query object
 */
neon.query.Query.prototype.includeFiltered = function(includeFiltered) {
    this.includeFiltered_ = includeFiltered;
    return this;
};

/**
 * Creates a simple *where* clause for the query
 * @method where
 * @param {String} fieldName The field name to group on
 * @param {String} op The operation to perform
 * @param {Object}  value The value to compare the field values against
 * @example
     where('x','=',10)
 * @return {Object}
 */
neon.query.where = function(fieldName,op,value) {
    return new this.WhereClause(fieldName,op,value);
};

/**
 * Creates an *and* boolean clause for the query
 * @method and
 * @param  {Object} clauses A variable number of *where* clauses to apply
 * @example
     and(where('x','=',10),where('y','=',1))
 * @return {Object}
 */
neon.query.and = function(clauses) {
    return new this.BooleanClause('and', neon.util.ArrayUtils.argumentsToArray(arguments));
};

/**
 * Creates an *or* boolean clause for the query
 * @method or
 * @param {Object} clauses A variable number of *where* clauses to apply
 * @example
     or(where('x','=',10),where('y','=',1))
 * @return {Object}
 */
neon.query.or = function(clauses) {
    return new this.BooleanClause('or', neon.util.ArrayUtils.argumentsToArray(arguments));
};

/**
 * Executes a query that returns the field names from the data set. This method executes synchronously.
 * @method getFieldNames
 * @param {String} dataSourceName The name of the data source that holds this data
 * @param {String} datasetId The id of the dataset whose fields are being returned
 * @param {String} successCallback The callback to call when the field names are successfully retrieved
 */
neon.query.getFieldNames = function(dataSourceName, datasetId, successCallback) {
    neon.util.AjaxUtils.doGet(neon.query.queryUrl_('/services/queryservice/fieldnames?datasourcename='+ dataSourceName + '&datasetid=' + datasetId), neon.query.wrapCallback_(successCallback,neon.query.wrapperArgsForDataset_(dataSourceName,datasetId)));
};

/**
 * Executes the specified query and fires the callback when complete
 * @method executeQuery
 * @param {neon.query.Query} query the query to execute
 * @param {Function} successCallback The callback to fire when the query successfully completes
 */
neon.query.executeQuery = function(query, successCallback) {
    neon.util.AjaxUtils.doPostJSON(query, neon.query.queryUrl_('/services/queryservice/query?includefiltered=' + query.includeFiltered_), neon.query.wrapCallback_(successCallback,neon.query.wrapperArgsForQuery_(query)));
};


/**
 * Adds a filter to the data and fires the callback when complete
 * @method addFilter
 * @param {neon.query.Filter} filter The filter to add
 * @param {Function} successCallback The callback to fire when the filter is added
 */
neon.query.addFilter = function(filter, successCallback) {
    neon.util.AjaxUtils.doPostJSON(filter, neon.query.queryUrl_('/services/queryservice/addfilter'), neon.query.wrapCallback_(successCallback, neon.query.wrapperArgsForFilter_(filter)));
};

/**
 * Removes a filter from the data and fires the callback when complete
 * @method removeFilter
 * @param {String} filterId The id of the filter to remove
 * @param {Function} successCallback The callback to fire when the filter is removed
 */
neon.query.removeFilter = function(filterId, successCallback) {
    neon.util.AjaxUtils.doPost(null, 'text/plain', 'json', neon.query.queryUrl_('/services/queryservice/removefilter/' + filterId), successCallback);
};

/**
 * Replaces a filter and fires the callback when complete
 * @method replaceFilter
 * @param {String} filterId The id of the filter to replace
 * @param {neon.query.Filter} filter The filter to replace the filter with
 * @param {Function} successCallback The callback to fire when the replacement is complete
 */
neon.query.replaceFilter = function(filterId, filter, successCallback) {
    neon.util.AjaxUtils.doPostJSON(filter, neon.query.queryUrl_('/services/queryservice/replacefilter/' + filterId), neon.query.wrapCallback_(successCallback, neon.query.wrapperArgsForFilter_(filter)));
};

/**
 * Removes all filters from the data
 * @method clearFilters
 * @param {Function} successCallback The callback to fire when the filters are cleared
 */
neon.query.clearFilters = function(successCallback) {
    neon.util.AjaxUtils.doPostJSON(null, neon.query.queryUrl_('/services/queryservice/clearfilters'), successCallback);
};

/**
 * Sets the items that match the specified query to be selected
 * @method setSelectionWhere
 * @param {neon.query.Filter} filter The filter to match the items
 * @param {Function} successCallback The callback to execute when selection is completed
 */
neon.query.setSelectionWhere = function(filter, successCallback) {
neon.util.AjaxUtils.doPostJSON(filter, neon.query.queryUrl_('/services/queryservice/setselectionwhere'), neon.query.wrapCallback_(successCallback,neon.query.wrapperArgsForFilter_(filter)));
};

/**
 * Gets the items that are selected and match this query
 * @method getSelectionWhere
 * @param {neon.query.Filter} filter The filter to match items
 * @param {Function} successCallback The callback to execute when the selected items have been retrieved
 */
neon.query.getSelectionWhere = function(filter, successCallback) {
    neon.util.AjaxUtils.doPostJSON(filter, neon.query.queryUrl_('/services/queryservice/getselectionwhere'), neon.query.wrapCallback_(successCallback,neon.query.wrapperArgsForFilter_(filter)));
};


/**
 * Sets the items with the specified ids to be selected
 * @method setSelectedIds
 * @param {Array} ids An array of ids of items to select
 * @param {Function} successCallback The callback to execute when selection is completed
 */
neon.query.setSelectedIds = function(ids, successCallback) {
    neon.util.AjaxUtils.doPostJSON(ids, neon.query.queryUrl_('/services/queryservice/setselectedids'), successCallback);
};

/**
 * Adds the items with the specified ids to the current selection
 * @method addSelectedIds
 * @param {Array} ids An array of ids of items to add to the selection
 * @param {Function} successCallback The callback to execute when selection is completed
 */
neon.query.addSelectedIds = function(ids, successCallback) {
    neon.util.AjaxUtils.doPostJSON(ids, neon.query.queryUrl_('/services/queryservice/addselectedids'), successCallback);
};

/**
 * Adds the items with the specified ids to the current selection
 * @method addSelectedIds
 * @param {Array} ids An array of ids of items to add to the selection
 * @param {Function} successCallback The callback to execute when selection is completed
 */
neon.query.removeSelectedIds = function(ids, successCallback) {
    neon.util.AjaxUtils.doPostJSON(ids, neon.query.queryUrl_('/services/queryservice/removeselectedids'), successCallback);
};

/**
 * Clears the current selection
 * @method clearSelection
 * @param {Function} successCallback The callback to execute when the selection is cleared
 */
neon.query.clearSelection = function(successCallback) {
    neon.util.AjaxUtils.doPostJSON(null, neon.query.queryUrl_('/services/queryservice/clearselection'), successCallback);
};


neon.query.wrapperArgsForQuery_= function(query) {
    return neon.query.wrapperArgsForDataset_(query.filter.dataSourceName,query.filter.datasetId);
};

neon.query.wrapperArgsForFilter_= function(filter) {
    return neon.query.wrapperArgsForDataset_(filter.dataSourceName,filter.datasetId);
};

neon.query.wrapperArgsForDataset_= function(dataSourceName,datasetId) {
    var args = {};
    args[this.DATASOURCE_NAME_IDENTIFIER] = dataSourceName;
    args[this.DATASET_ID_IDENTIFIER] = datasetId;
    return args;
};


/**
 * Wraps the specified callback function so it is invoked with the data source and any additional arguments
 * @param {Function} callback
 * @param {Object} additionalArgs An associative array of any additional arguments to add to the result
 *
 * @private
 */
neon.query.wrapCallback_ = function(callback, additionalArgs) {

    return function() {
        var newArgs = {};
        // element 0 is the json array of args to the original callback (if any)
        var args = neon.util.ArrayUtils.argumentsToArray(arguments)[0];
        if ( args ) {
            _.extend(newArgs,args);
        }
        _.extend(newArgs,additionalArgs);
        callback.call(null,newArgs);
    };

};

neon.query.queryUrl_ = function(path) {
    return neon.query.SERVER_URL + path;
};

/**
 * Creates a filter that can be applied to a dataset
 * @namespace neon.query
 * @class Filter
 * @param {String} dataSourceName The data source containing the data being filtered
 * @param {String} datasetId The dataset to which the filter will be applied
 * @constructor
 */
neon.query.Filter = function(dataSourceName, datasetId) {

    /*jshint expr: true */
    this.whereClause;
};

/**
 * Sets the *select* clause of the filter to select data from the specified dataset
 * @method selectFrom
 * @param {String} dataSourceName The name of the data source that contains the data
 * @param {String} datasetId The dataset to select from
 * @return {neon.query.Filter} This filter object
 */
neon.query.Filter.prototype.selectFrom = function(dataSourceName, datasetId) {
    this.dataSourceName = dataSourceName;
    this.datasetId = datasetId;
    return this;
};


/**
 * Adds a *where* clause to the filter.
 * See {{#crossLink "neon.query.Query/where"}}{{/crossLink}} for documentation on how to structure the parameters
 * @method where
 * @return {this}
 */
neon.query.Filter.prototype.where = function() {
    if ( arguments.length === 3 ) {
        this.whereClause = new neon.query.WhereClause(arguments[0], arguments[1], arguments[2]);
    }
    else {
        // must be a boolean operator
        this.whereClause = arguments[0];
    }
    return this;
};

// These query clauses are not meant to be instantiated directly but rather by helper methods


neon.query.BooleanClause = function(type, clauses) {
    this.type = type;
    this.clauses = clauses;
};

neon.query.WhereClause = function(lhs, op, rhs) {
    this.type = 'where';
    this.lhs = lhs;
    this.op = op;
    this.rhs = rhs;

};

neon.query.GroupByClause = function(fields) {
    this.type = 'groupBy';
    this.fields = fields instanceof Array ? fields : [fields];
};

neon.query.AggregateClause = function(aggregationOperation, aggregationField, name) {
    this.type = 'aggregate';
    this.aggregationOperation = aggregationOperation;
    this.aggregationField = aggregationField;
    this.name = name;
};

neon.query.DistinctClause = function(field, sortOrder) {
    this.type = 'distinct';
    this.field = field;
    this.sortOrder = sortOrder;
};