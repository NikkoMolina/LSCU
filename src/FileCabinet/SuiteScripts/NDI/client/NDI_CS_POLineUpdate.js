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
    },
    ACCOUNT : {
        GBD : 868
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
    
    function setPurchOrderLineItem(paramCurrentRecord, paramArrObjPurchOrderItem)
    {
        var processName = 'setPurchOrderLineItem';
        var currentRecord = paramCurrentRecord;

        try
        {
            var arrObjPurchOrderItems = (!isNullOrEmpty(paramArrObjPurchOrderItem)) ? paramArrObjPurchOrderItem : [];
            var arrObjPurchOrderItemsTotal = (!isNullOrEmpty(arrObjPurchOrderItems)) ? arrObjPurchOrderItems.length : 0;
            var arrObjPurchOrderItemsTotal = (!isNullOrEmpty(arrObjPurchOrderItems)) ? arrObjPurchOrderItems.length : 0;
            var hasArrObjPurchOrderItems = (arrObjPurchOrderItemsTotal != 0) ? true : false;

            if (hasArrObjPurchOrderItems)
            {
                for (var dx = 0; dx < arrObjPurchOrderItemsTotal; dx++)
                {
                    currentRecord.selectNewLine({sublistId: 'expense'})

                    for (var xj in arrObjPurchOrderItems[dx])
                    {
                        currentRecord.setCurrentSublistValue({sublistId: 'expense', fieldId: xj, value: arrObjPurchOrderItems[dx][xj], forceSyncSourcing: true,  ignoreFieldChange: false});
                    }

                    currentRecord.commitLine({sublistId: 'expense'});
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
            var jsonSoItems = currentRecord.getValue({fieldId: 'custbody_ndi_json_container_purchorder'});
            var arrObjPurchOrderItems = (!isNullOrEmpty(jsonSoItems)) ? JSON.parse(jsonSoItems) : [];
            setPurchOrderLineItem(currentRecord, arrObjPurchOrderItems);

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
        var lineNum = scriptContext.lineNum;

        if (sublistId == 'expense' && fieldId == 'projecttask' && !isSkipProcess){

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
            var memo = projTaskRec.getValue({
                fieldId: 'title'
            });
            var subsidiaryVal = currRec.getValue({
                fieldId: 'subsidiary'
            });
            var location = currRec.getValue({
                fieldId: 'location'
            });

            var dept = '';
            //If subsidiary is GBD Growth By Design
            if (subsidiaryVal == _CONFIG.SUBSIDIARY.GBD){
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

            const lineObj = {
                ACCOUNT: _CONFIG.ACCOUNT.GBD,
                MEMO: memo,
                CLASS: itemClass,
                DEPT: dept,
                LOCATION: location
            };
            console.log('JSON lineObj '+JSON.stringify(lineObj))
            currRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'account',
                value: lineObj.ACCOUNT,
            });
            currRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'memo',
                value: lineObj.MEMO,
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
            currRec.setCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'location',
                value: lineObj.LOCATION
            });
        }
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
    };

    function isEmpty(value) {
        return value === null || value === undefined || value === '' || (typeof value === 'object' && Object.keys(value).length === 0);
    }
});
