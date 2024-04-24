/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record'],
    /**
 * @param{record} record
 */
    (record) => {
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
            var recObj = scriptContext.newRecord;
            var mode = scriptContext.type;
            if(mode == scriptContext.UserEventType.CREATE){
                var projTaskId = recObj.getValue('casetaskevent');
                if(isEmpty(projTaskId)) return;
                var projTaskObj = record.load({
                    type: record.Type.PROJECT_TASK,
                    id: projTaskId
                }) || '';
                if(!isEmpty(projTaskObj)){
                    var status = projTaskObj.getValue('status');
                    if(status == "NOTSTART"){
                        record.submitFields({
                            type: record.Type.PROJECT_TASK,
                            id: projTaskId,
                            values: {
                                'status' : 'PROGRESS'
                            },
                        });
                    }
                }
            }
        }

        return {afterSubmit}

        function isEmpty(value) {
            return value === null || value === undefined || value === '' || (typeof value === 'object' && Object.keys(value).length === 0);
        }

    });
