/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/search', 'N/url'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{search} search
 * @param{url} url
 */
    (log, record, search, url) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            //Check status all project tasks under the project record, diff function
            var newRecord = scriptContext.newRecord;
            var type = scriptContext.type;
            if(type == scriptContext.UserEventType.EDIT){
                var projectId = newRecord.getValue({
                    fieldId: 'company'
                });
                var projectTaskSearch = search.create({
                    type: search.Type.PROJECT_TASK,
                    filters: [
                        ['project', 'anyof', projectId]
                    ],
                    columns: [
                        search.createColumn({
                            name: 'title',
                            label: 'Name'
                        }),
                        search.createColumn({
                            name: 'status',
                            label: 'Progress'
                        })
                        // Add more columns as needed
                    ]
                });
                // Run the search and retrieve the results
                var searchResults = projectTaskSearch.run().getRange({
                    start: 0,
                    end: 1000 // Adjust the range as needed
                });
                var progressFlag = true;
                for (var i = 0; i < searchResults.length; i++){
                    var progressCheck = searchResults[i].getValue({
                        name: 'status'
                    });
                    if (progressCheck != 'COMPLETE'){
                        progressFlag = false
                    }
                }
                if (progressFlag){
                    record.submitFields({
                        type: record.Type.JOB,
                        id: projectId,
                        values: {
                            'entitystatus' : 17
                        },
                    });
                }
            }
        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
