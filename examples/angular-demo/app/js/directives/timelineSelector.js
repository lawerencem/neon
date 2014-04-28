'use strict';
/*
 * Copyright 2014 Next Century Corporation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

/**
 * This Angular JS directive adds a timeline selector to a page.  The timeline selector uses the Neon
 * API to query the currently selected data source the number of records matched by current Neon filters.
 * These records are binned by hour to display the number of records available temporally.  Additionally,
 * the timeline includes a brushing tool that allows a user to select a time range.  The time range is
 * set as a Neon selection filter which will limit the records displayed by any visualization that
 * filters their datasets with the active selection.
 * 
 * @example
 *    &lt;timeline-selector&gt;&lt;/timeline-selector&gt;<br>
 *    &lt;div timeline-selector&gt;&lt;/div&gt;
 * 
 * @class neonDemo.directives.timelineSelector
 * @constructor
 */
angular.module('timelineSelectorDirective', []).directive('timelineSelector', ['ConnectionService',
	function(connectionService) {

	return {
		templateUrl: 'partials/timelineSelector.html',
		restrict: 'EA',
		scope: {

		},
		controller: function($scope) {

		},
		link: function($scope, element, attr) {

            // Cache the number of milliseconds in an hour for processing.
            var MILLIS_IN_HOUR = 1000 * 60 * 60;
            var MILLIS_IN_DAY = MILLIS_IN_HOUR * 24;
            var HOUR = "hour";
            var DAY = "day";

			element.addClass('timeline-selector');

			/** 
			 * Initializes the name of the date field used to query the current dataset
			 * and the Neon Messenger used to monitor data change events.
			 * @method initialize
			 */
			$scope.initialize = function() {
				// Defaulting the expected date field to 'date'.
				$scope.dateField = 'date';

				// Default our time data to an empty array.
				$scope.data = [];
				$scope.brush = [];
				$scope.startDate = undefined;
				$scope.endDate = undefined;
				$scope.referenceDate = undefined;
				$scope.granularity = DAY;
				$scope.millisMultiplier = MILLIS_IN_DAY;
				$scope.recordCount = 0;
				$scope.filterKey = neon.widget.getInstanceId("timlineFilter");
				$scope.messenger = new neon.eventing.Messenger();

				$scope.messenger.events({
					activeDatasetChanged: onDatasetChanged,
					filtersChanged: onFiltersChanged
				});
			};

			/**
			 * Event handler for filter changed events issued over Neon's messaging channels.
			 * @param {Object} message A Neon filter changed message.
			 * @method onFiltersChanged
			 * @private
			 */ 
			var onFiltersChanged = function(message) {
				// Clear our filters against the last table and filter before requesting data.
				$scope.messenger.clearSelection();
				$scope.queryForChartData();
			};

			/**
			 * Event handler for dataset changed events issued over Neon's messaging channels.
			 * @param {Object} message A Neon dataset changed message.
			 * @param {String} message.database The database that was selected.
			 * @param {String} message.table The table within the database that was selected.
			 * @method onDatasetChanged
			 * @private
			 */ 
			var onDatasetChanged = function(message) {
				// Clear our filters against the last table before requesting data.
				// Commented out for now.  As the filter builder clears filters after
				// a new dataset is selected, our filter change handler will clear the selection.
				// Doing it here was well results in multiple selection events triggering redundant 
				// queries.
				//$scope.messenger.clearSelection($scope.filterKey);

				$scope.databaseName = message.database;
				$scope.tableName = message.table;
			};

			/**
			 * Triggers a Neon query that will aggregate the time data for the currently selected dataset.
			 * @method queryForChartData
			 */
			$scope.queryForChartData = function() {
				$scope.dateField = connectionService.getFieldMapping($scope.database, $scope.tableName, "date");
				$scope.dateField = $scope.dateField.mapping || 'date';

				var yearGroupClause = new neon.query.GroupByFunctionClause(neon.query.YEAR, $scope.dateField, 'year');
				var monthGroupClause = new neon.query.GroupByFunctionClause(neon.query.MONTH, $scope.dateField, 'month');
				var dayGroupClause = new neon.query.GroupByFunctionClause(neon.query.DAY, $scope.dateField, 'day');
				var hourGroupClause = new neon.query.GroupByFunctionClause(neon.query.HOUR, $scope.dateField, 'hour');

				var query = new neon.query.Query()
				    .selectFrom($scope.databaseName, $scope.tableName)
				    .where($scope.dateField, '!=', null)

				// Group by the appropriate granularity.
				if ($scope.granularity === DAY) {
				    query.groupBy(yearGroupClause, monthGroupClause, dayGroupClause);
				}
				else if ($scope.granularity === HOUR) {
					query.groupBy(yearGroupClause, monthGroupClause, dayGroupClause, hourGroupClause);
				}

				query.aggregate(neon.query.COUNT, '*', 'count');
				query.aggregate(neon.query.MIN, $scope.dateField, 'date');
				query.sortBy('date', neon.query.ASCENDING);

				connectionService.getActiveConnection().executeQuery(query, function(queryResults) {
					$scope.$apply(function(){
						$scope.brush = [];
						$scope.updateChartData(queryResults);
					});
				});

			};

			/**
             * Updates the chart header with the record count and dates from the given start index to the end index
             * of the data array.
             * @param {Number} startIdx The first bucket in the time data to use.
             * @param {Number} endIdx The last bucket in the time data to use.
             * @method updateChartHeader
             */
            $scope.updateChartHeader = function(startDate, endDate) {
        		// Handle bound conditions.
				var startIdx = Math.floor(Math.abs($scope.referenceDate - startDate) / $scope.millisMultiplier);
				var endIdx = Math.floor(Math.abs($scope.referenceDate - endDate) / $scope.millisMultiplier);

				// Update the header information.
				var total = 0;
				for (var i = startIdx; i <= endIdx; i++) {
					total += $scope.data[i].value;
				}

				if ($scope.granularity === HOUR) {
					$scope.startDate = $scope.data[startIdx].date;
					$scope.startDate = new Date($scope.startDate.getUTCFullYear(),
						$scope.startDate.getUTCMonth(),
						$scope.startDate.getUTCDate(),
						$scope.startDate.getUTCHours() );
					$scope.endDate = new Date($scope.data[endIdx].date.getTime() + MILLIS_IN_HOUR);
					$scope.endDate = new Date($scope.endDate.getUTCFullYear(),
						$scope.endDate.getUTCMonth(),
						$scope.endDate.getUTCDate(),
						$scope.endDate.getUTCHours() );
				}
				else if ($scope.granularity === DAY) {
					$scope.startDate = $scope.data[startIdx].date;
					$scope.startDate = new Date($scope.startDate.getUTCFullYear(),
						$scope.startDate.getUTCMonth(),
						$scope.startDate.getUTCDate());
					$scope.endDate = new Date($scope.data[endIdx].date.getTime() + MILLIS_IN_DAY);
					$scope.endDate = new Date($scope.endDate.getUTCFullYear(),
						$scope.endDate.getUTCMonth(),
						$scope.endDate.getUTCDate());
				}


				$scope.recordCount = total;
            }

			/**
			 * Updates the data bound to the chart managed by this directive.  This will trigger a change in 
			 * the chart's visualization.
			 * @param {Object} queryResults Results returned from a Neon query.
			 * @param {Array} queryResults.data The aggregate numbers for the heat chart cells.
			 * @method updateChartData
			 */
			$scope.updateChartData = function(queryResults) {

				if (queryResults.data.length > 0) {
				    $scope.data = $scope.createTimelineData(queryResults);	
					$scope.updateChartHeader($scope.data[0].date, $scope.data[$scope.data.length - 1].date);
				}
				else {
					$scope.data = $scope.createTimelineData(queryResults);
					$scope.startDate = undefined;
					$scope.endDate = undefined;
					$scope.recordCount = 0;
				}
			};

			/**
			 * Creates a new data array used to populate our contained timeline.  This function is used
			 * as or by Neon query handlers.
			 * @param {Object} queryResults Results returned from a Neon query.
			 * @param {Array} queryResults.data The aggregate numbers for the heat chart cells.
			 * @method createTimelineData
			 */
			$scope.createTimelineData = function(queryResults){
				var rawData = queryResults.data;
				var data = [];
				var i = 0;
				var rawLength = rawData.length;

				// If we have no values, use our dates if they existed or now.
				if (rawLength === 0) {
					rawData[0] = {
						date: new Date(),
						count: 0
					}
				}

				// If we have only 1 value, create a range for it.
				if (rawLength === 1) {
					rawData[1] = rawData[0]; 
				}

				rawLength = rawData.length;
                // Setup the data buckets for them.
				// Determine the number of hour buckets along with the start and end dates for our buckets.
				// var startDate = new Date(Date.UTC(rawData[0].year, rawData[0].month - 1, rawData[0].day, rawData[0].hour));
				// var endDate = new Date(Date.UTC(rawData[rawLength - 1].year, rawData[rawLength - 1].month - 1, 
				// 	rawData[rawLength - 1].day, rawData[rawLength - 1].hour));
				var startDate = new Date(rawData[0].date);
				var endDate = new Date(rawData[rawLength - 1].date);
				startDate.setUTCMinutes(0);
				startDate.setUTCSeconds(0);
				startDate.setUTCMilliseconds(0);
				endDate.setUTCMinutes(0);
				endDate.setUTCSeconds(0);
				endDate.setUTCMilliseconds(0);

				if ($scope.granularity === DAY) {
					startDate.setUTCHours(0);
					endDate.setUTCHours(0);
				}

				var numBuckets = Math.ceil(Math.abs(endDate - startDate) / $scope.millisMultiplier) + 1;
				var startTime = startDate.getTime();

				// Cache the start date of the first bucket for later calculations.
				$scope.referenceDate = startDate;

				// Initialize our time buckets.
				for (i = 0; i < numBuckets; i++) {
					data[i] = {
						date: new Date(startTime + ($scope.millisMultiplier * i)),
						value: 0 
					}
				}

				// Fill our rawData into the appropriate hour buckets.
				var diff = 0;
				var resultDate;
				for (i = 0; i < rawLength; i++) {
					resultDate = new Date(rawData[i].date);
					data[Math.floor(Math.abs(resultDate - startDate) / $scope.millisMultiplier)].value = rawData[i].count;
				}
				return data;
			};

			// Update the millis multipler when the granularity is changed.
			$scope.$watch('granularity', function(newVal, oldVal) {
				if (newVal && newVal !== oldVal) {
					if (newVal === DAY) {
						$scope.millisMultiplier = MILLIS_IN_DAY;
					}
					else if (newVal === HOUR) {
						$scope.millisMultiplier = MILLIS_IN_HOUR;
					}
					// Clear our filters against the last table and filter before requesting data.
					$scope.messenger.clearSelection();
					$scope.queryForChartData();
				}
			});

			// Watch for brush changes and set the appropriate neon filter.
			$scope.$watch('brush', function(newVal) {
				// If we have a new value and a messenger is ready, set the new filter.
				if (newVal && $scope.messenger && connectionService.getActiveConnection()) {

					if (newVal === undefined || (newVal.length < 2) || (newVal[0].getTime() === newVal[1].getTime())) {
						$scope.updateChartHeader($scope.data[0].date, $scope.data[$scope.data.length - 1].date);
						$scope.messenger.clearSelection($scope.filterKey);
					} else {
						// Update the chart header
						$scope.updateChartHeader(newVal[0], newVal[1]);

						// Since we created our time buckets with times representing the start of an hour, we need to add an hour
						// to the time representing our last selected hour bucket to get all the records that occur in that hour.
						var startFilterClause = neon.query.where($scope.dateField, '>=', newVal[0]);
			            var endFilterClause = neon.query.where($scope.dateField, '<', new Date(newVal[1].getTime() + $scope.millisMultiplier));
			            var clauses = [startFilterClause, endFilterClause];
			            var filterClause = neon.query.and.apply(this, clauses);
			            var filter = new neon.query.Filter().selectFrom($scope.databaseName, $scope.tableName).where(filterClause);

			            $scope.messenger.replaceSelection($scope.filterKey, filter);
					}
				}
			}, true);

			// Wait for neon to be ready, the create our messenger and intialize the view and data.
			neon.ready(function () {
				$scope.initialize();
			});

		}
	};
}]);
