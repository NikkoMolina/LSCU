/**
 * Project: PROJ89 The League of Southeastern Credit Unions & Affiliates
 * Date: January 25, 2024   
 * 
 * Date Modified  Modified By    Reference    Notes 
 * Jan 25, 2024   Felix Moreno 
 * 
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
const _CONFIG = {
    SUBSIDIARY : {
        GBD : 10
    },
    DEPT : {
        MARKETING : 28
    },
    FUNC_EXP : {
        F_MNGMNT : 105
    }
}
define(['N/currentRecord', 'N/log', 'N/record', 'N/search', 'N/url'],

/**
 * @param{currentRecord} currentRecord
 * @param{log} log
 * @param{record} record
 * @param{search} search
 * @param{url} url
 */
function(currentRecord, log, record, search, url) {
    

    function isNullOrEmpty(valueStr)
    {
        return(valueStr == null || valueStr == "" || valueStr == undefined); 
    }
    
    function setSalesOrderLineItem(paramCurrentRecord, paramArrObjSalesOrderItem)
    {
        var processName = 'setSalesOrderLineItem';
        var currentRecord = paramCurrentRecord;

        try
        {
            var arrObjSalesOrderItems = (!isNullOrEmpty(paramArrObjSalesOrderItem)) ? paramArrObjSalesOrderItem : [];
            var arrObjSalesOrderItemsTotal = (!isNullOrEmpty(arrObjSalesOrderItems)) ? arrObjSalesOrderItems.length : 0;
            var arrObjSalesOrderItemsTotal = (!isNullOrEmpty(arrObjSalesOrderItems)) ? arrObjSalesOrderItems.length : 0;
            var hasArrObjSalesOrderItems = (arrObjSalesOrderItemsTotal != 0) ? true : false;

            if (hasArrObjSalesOrderItems)
            {
                for (var dx = 0; dx < arrObjSalesOrderItemsTotal; dx++)
                {
                    currentRecord.selectNewLine({sublistId: 'item'})

                    for (var xj in arrObjSalesOrderItems[dx])
                    {
                        currentRecord.setCurrentSublistValue({sublistId: 'item', fieldId: xj, value: arrObjSalesOrderItems[dx][xj], forceSyncSourcing: true,  ignoreFieldChange: false});
                    }

                    currentRecord.commitLine({sublistId: 'item'});
                }

                currentRecord.setValue({fieldId: 'custpage_ndi_hidden_fld_skip_flag', value: 'F'});
            }
        }
            catch(ex)
        {
            console.log('Error in ' + processName + ': ' + ex.toString())
            currentRecord.setValue({fieldId: 'custpage_ndi_hidden_fld_skip_flag', value: 'F'});
        }
    }

    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */

    function pageInit(scriptContext) 
    {
        var processName = 'pageInit';
        var processStr = '';

        var currentRecord = scriptContext.currentRecord;
        
        try
        {
            var jsonSoItems = currentRecord.getValue({fieldId: 'custbody_ndi_json_container_salesorder'});
            var arrObjSalesOrderItems = (!isNullOrEmpty(jsonSoItems)) ? JSON.parse(jsonSoItems) : [];
            setSalesOrderLineItem(currentRecord, arrObjSalesOrderItems);

        }
            catch(ex)
        {
            console.log('Error in ' + processName + ': ' + ex.toString());
        }

    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) 
    {
        var currRec = scriptContext.currentRecord;
        
        var skipFlagValue = currRec.getValue({fieldId: 'custpage_ndi_hidden_fld_skip_flag'});
        var isSkipProcess = (skipFlagValue == 'T') ? true : false;
        
        var fieldId = scriptContext.fieldId;
        var sublistId = scriptContext.sublistId;

        if (sublistId == 'item' && fieldId == 'custcol_ndi_projecttask' && !isSkipProcess){
            
            //var currRec = scriptContext.currentRecord;

            var projTaskRecId = currRec.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: fieldId,
            });

            if (isEmpty(projTaskRecId)){
                return false;
            }

            var projTaskRec = record.load({
                type: record.Type.PROJECT_TASK,
                id: projTaskRecId 
            });
            var itemVal = projTaskRec.getValue({
                fieldId: 'custevent_lscu_gbdservice'
            });
            var subsidiaryVal = currRec.getValue({
                fieldId: 'subsidiary'
            });
            
            var custId = currRec.getValue({
                fieldId: 'entity'
            });
            var custRec = record.load({
                type: record.Type.CUSTOMER,
                id: custId 
            });
            var location = custRec.getSublistValue({
                sublistId: 'addressbook',
                fieldId: 'displaystate_initialvalue',
                line: 0
            });

            var dept = '', funcExp = ''
            //If subsidiary is GBD Growth By Design
            if (subsidiaryVal == _CONFIG.SUBSIDIARY.GBD){
                funcExp = _CONFIG.FUNC_EXP.F_MNGMNT;
                dept = _CONFIG.DEPT.MARKETING;
            }
            var itemClass = ''
            var itemLook = search.lookupFields({
                type: search.Type.ITEM,
                id: itemVal,
                columns: ['class']
            });
            if(!isEmpty(itemLook.class)){
                itemClass = itemLook.class[0].value;
            }
            var priceNegVal = projTaskRec.getValue({
                fieldId: 'custevent_negotiated_price'
            });

            var prcLvl = '-1';
            //Get the base price instead of negotiated price
            if (isEmpty(priceNegVal) || priceNegVal == 0){
                prcLvl = '1';
            }

            const lineObj = {
                ITEM: itemVal,
                PRCLVL: prcLvl,
                QUANTITY: 1,
                RATE: priceNegVal,
                FUNC_EXP: funcExp,
                CLASS: itemClass,
                DEPT: dept,
                LOCATION: location
            };

            currRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'item',
                value: lineObj.ITEM,
                forceSyncSourcing: true
            });
            currRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'quantity',
                value: lineObj.QUANTITY,
            });
            currRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'price',
                value: lineObj.PRCLVL,
            });
            //Only adjust if its negotiated price
            if (prcLvl == '-1'){
                currRec.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'rate',
                    value: lineObj.RATE,
                });
            }
            currRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'cseg_npo_exp_type',
                value: lineObj.FUNC_EXP
            });
            currRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'class',
                value: lineObj.CLASS
            });
            currRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'department',
                value: lineObj.DEPT
            });
            // currRec.setCurrentSublistValue({
            //     sublistId: sublistId,
            //     fieldId: 'location',
            //     value: lineObj.LOCATION
            // });
            currRec.setCurrentSublistText({
                sublistId: sublistId,
                fieldId: 'location',
                text: lineObj.LOCATION
            });
        }
    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {

        var currRec = scriptContext.currentRecord;

        var skipFlagValue = currRec.getValue({fieldId: 'custpage_ndi_hidden_fld_skip_flag'});
        var isSkipProcess = (skipFlagValue == 'T') ? true : false;
        
        var fieldId = scriptContext.fieldId;
        var sublistId = scriptContext.sublistId
        
        if (sublistId == 'item' && fieldId == 'custcol_ndi_projecttask' && !isSkipProcess)
        {
            //var currRec = scriptContext.currentRecord;
            var projTaskRecId = currRec.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: fieldId,
            });

            if (!isEmpty(projTaskRecId)){
                var projTaskRec = record.load({
                    type: record.Type.PROJECT_TASK,
                    id: projTaskRecId 
                });
                
                //Check if theres a SO connected to current Project Task
                var linkedSO = projTaskRec.getValue({
                    fieldId: 'custevent_ndi_sotransaction'
                });

                if (!isEmpty(linkedSO)){
                    window.alert("You have selected a Project Task with an existing Sales Order");
                    return false;
                }

                var itemVal = projTaskRec.getValue({
                    fieldId: 'custevent_lscu_gbdservice'
                });
                if (isEmpty(itemVal)){
                    window.alert("You have selected a Project Task with no Item");
                    return false;
                }

                var priceNegVal = projTaskRec.getValue({
                    fieldId: 'custevent_negotiated_price'
                });
                
                if(isEmpty(priceNegVal))
                {
                    //Condition for missing base price
                    var projecttaskSearchObj = search.create({
                        type: "projecttask",
                        filters:
                        [
                            ["internalid","anyof",projTaskRecId]
                        ],
                        columns:
                        [
                            search.createColumn({
                                name: "baseprice",
                                join: "CUSTEVENT_LSCU_GBDSERVICE",
                                label: "Base Price"
                            })
                        ]
                    });
                    
                    var searchResults = projecttaskSearchObj.run().getRange({ start: 0, end: 1000});
                    var basePrice = searchResults[0].getValue  ({ name: "baseprice", join: "CUSTEVENT_LSCU_GBDSERVICE"});
                    
                    if (isEmpty(basePrice))
                    {
                        window.alert("You have selected a Project Task with an item with no Base Price");
                        return false;
                    }
                }
            }
        }
        return true;
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        validateField: validateField,
    };

    function isEmpty(value) {
        return value === null || value === undefined || value === '' || (typeof value === 'object' && Object.keys(value).length === 0);
    }
});
