/**
 * Project: PROJ89 The League of Southeastern Credit Unions & Affiliates
 * Date: January 25, 2024   
 * 
 * Date Modified  Modified By    Reference    Notes 
 * Jan 25, 2024   Felix Moreno 
 * 
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

//List of items to not set its proj task to complete
const _ITEMFLAG = {
    LIST : [1446, 1447, 1448, 1449, 1440, 1450, 1451]
}

const _CONFIG = {
    POFORM : {
        GBD : 116
    },
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

define(['N/currentRecord', 'N/log', 'N/record', 'N/search', 'N/ui/serverWidget', 'N/file', 'N/redirect'],
    /**
 * @param{currentRecord} currentRecord
 * @param{log} log
 * @param{record} record
 * @param{search} search
 */
    (currentRecord, log, record, search, serverWidget, file, redirect) => {

        const isNullOrEmpty = (valueStr) => 
        {
            return (valueStr == null || valueStr == "" || valueStr == undefined)
        }
    
        const getArrProjectTaskIdsFromUrlParam = (paramArrTaskIds) =>
        {
            let processName = `getArrProjectTaskIdsFromUrlParam`;
            let processStr = ``;
            let arrReturn = [];

            try
            {
                arrReturn = (!isNullOrEmpty(paramArrTaskIds)) ? JSON.parse(paramArrTaskIds) : [];
            }
                catch(ex)
            {
                arrReturn = [];
                let errorStr = (ex.getCode != null) ? `${ex.getCode()} <br> ${ex.getDetails()} <br> ${ex.getStackTrace().join('<br>')}` : ex.toString();
                log.debug(processName, `A problem occurred whilst ${processStr}: <br> ${errorStr}`);
            }
            return arrReturn;
        }

        const getArrObjProjectTaskToPurchOrder = (paramFilterArrProjectTasks, arrProjectTaskAmts, paramSubsidiary, paramLocation) =>
        {
            let processName = 'getArrObjProjectTaskToPurchOrder';
            let processStr = '';
            let arrObjReturn = [];
    
            try
            {
                let subsidiary = (!isNullOrEmpty(paramSubsidiary)) ? paramSubsidiary : '';
                let hasSubsidiary = (!isNullOrEmpty(subsidiary)) ? true : false;

                let location = (!isNullOrEmpty(paramLocation)) ? paramLocation : '';

                let department = (hasSubsidiary && subsidiary == _CONFIG.SUBSIDIARY.GBD) ? _CONFIG.DEPT.MARKETING : '';
    
                let arrProjectTaskIds = (!isNullOrEmpty(paramFilterArrProjectTasks)) ? paramFilterArrProjectTasks : [];
                let arrProjectTaskIdsTotal = (!isNullOrEmpty(arrProjectTaskIds)) ? arrProjectTaskIds.length : 0;
                let hasArrProjectTaskIds = (arrProjectTaskIdsTotal != 0) ? true : false;
    
                if (hasArrProjectTaskIds)
                {
                    
                    let arrFilters = [  { name: 'internalid', operator: 'anyof', values: arrProjectTaskIds }
                                     ];
    
                    let arrColumns = [  { name: 'id' }
                                      , { name: 'internalid', sort: search.Sort.ASC }
                                      , { name: 'title' } 
                                      , { name: 'company' } 
                                      , { name: 'custevent_lscu_gbdservice' } 
                                      , { name: 'custevent_negotiated_price' }
                                      , { name: 'class', join: 'CUSTEVENT_LSCU_GBDSERVICE' }
                                    ];
    
                    let searchRef = search.create({ type: 'projecttask', columns: arrColumns, filters: arrFilters, title: 'DA | Project Task Search' });
                    let searchResultsTotal = searchRef.runPaged().count;
                    let hasSearchResults = (searchResultsTotal > 0) ? true : false;
        
                    if (hasSearchResults)
                    {
                        let pagedData = searchRef.runPaged();
        
                        for ( let dx = 0; dx < pagedData.pageRanges.length; dx++ )
                        {
                            let currentPage = pagedData.fetch(dx);
        
                            currentPage.data.forEach( function(result) 
                            {                                
                                let objRef = {};
                                objRef['account'] = _CONFIG.ACCOUNT.GBD;
                                objRef['amount'] = parseFloat(arrProjectTaskAmts[arrProjectTaskIds.indexOf(result.id)]);
                                objRef['billableenabled'] = true;
                                objRef['customer'] = result.getValue({ name: 'company' });
                                objRef['memo'] = result.getValue({ name: 'title' });
                                objRef['department'] = department;
                                objRef['class'] = result.getValue({ name: 'class', join: 'CUSTEVENT_LSCU_GBDSERVICE' });
                                objRef['location'] = location;
                                objRef['projecttask'] = result.id;
                                arrObjReturn.push(objRef);
    
                            });     
                        }
                    }
                }
    
            }
                catch(ex)
            {
                arrObjReturn = [];
                let errorStr = (ex.getCode != null) ? `${ex.getCode()} <br> ${ex.getDetails()} <br> ${ex.getStackTrace().join('<br>')}` : ex.toString();
                log.debug(processName, `A problem occurred whilst ${processStr}: <br> ${errorStr}`);
            }
            return arrObjReturn;
        }
            
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

            let processName = `beforeLoad`;
            let processStr = '';

            let isCreateMode = (scriptContext.type === scriptContext.UserEventType.CREATE) ? true : false;
            let isViewMode = (scriptContext.type === scriptContext.UserEventType.VIEW) ? true : false;
            let newRecord = scriptContext.newRecord;
            let form = scriptContext.form;

            try
            {
                let urlParams = scriptContext.request.parameters;
                let urlParamSubsidiary =  urlParams[`subsidiary`];
                let urlParamEntity =  urlParams[`entity`];
                let urlParamCreatedFromButt = urlParams[`createdFromButt`];
                let urlParamLocation =  !(isNullOrEmpty(urlParams[`record.location`])) ? urlParams[`record.location`] : '';
                let isCreatedFromButt = (!isNullOrEmpty(urlParamCreatedFromButt) && urlParamCreatedFromButt == 'T') ? true : false;
                
                if (isCreateMode && isCreatedFromButt)
                {
                    let urlParamArrProjectTaskIds = scriptContext.request.parameters.projectTaskIds;
                    let arrProjectTaskIds = getArrProjectTaskIdsFromUrlParam(urlParamArrProjectTaskIds);
                    let arrProjectTaskIdsTotal = (!isNullOrEmpty(arrProjectTaskIds)) ? arrProjectTaskIds.length : 0;
                    let hasArrProjectTaskIds = (arrProjectTaskIdsTotal != 0) ? true : false;

                    let urlParamArrProjectTaskAmts = scriptContext.request.parameters.projectTaskAmts;
                    let arrProjectTaskAmts = getArrProjectTaskIdsFromUrlParam(urlParamArrProjectTaskAmts);


                    if (hasArrProjectTaskIds)
                    {
                        let arrObjPurchOrderItems = getArrObjProjectTaskToPurchOrder(arrProjectTaskIds, arrProjectTaskAmts, urlParamSubsidiary, urlParamLocation);
                        let arrObjPurchOrderItemsTotal = (!isNullOrEmpty(arrObjPurchOrderItems)) ? arrObjPurchOrderItems.length : 0;
                        let hasArrObjPurchOrderItems = (arrObjPurchOrderItemsTotal != 0) ? true : false;


                        if (hasArrObjPurchOrderItems)
                        {

                            let fldSkipFlag = form.addField({ type: 'LONGTEXT', id: 'custpage_ndi_hidden_fld_skip_flag', label: 'Hidden Field - SKIP FLAG'}).updateDisplayType({displayType:serverWidget.FieldDisplayType.HIDDEN});
                            fldSkipFlag.defaultValue = 'T';

                            let fldCreatedFromButt = form.addField({ type: 'LONGTEXT', id: 'custpage_ndi_hidden_fld_created_from_butt', label: 'Hidden Field - CREATED FROM BUTT'}).updateDisplayType({displayType:serverWidget.FieldDisplayType.HIDDEN});
                            fldCreatedFromButt.defaultValue = 'T';

                            log.debug(processName, `arrObjPurchOrderItems: ${JSON.stringify(arrObjPurchOrderItems, 'key', '\t')}`);
                            newRecord.setValue({ fieldId: 'entity', value: urlParamEntity, forceSyncSourcing: true, ignoreFieldChange: false });
                            newRecord.setValue({ fieldId: 'subsidiary', value: urlParamSubsidiary, forceSyncSourcing: true, ignoreFieldChange: false });
                            newRecord.setValue({ fieldId: 'custbody_ndi_json_container_purchorder', value: JSON.stringify(arrObjPurchOrderItems), ignoreFieldChange: true });
                        }
                    }
                }

                if (isViewMode && isCreatedFromButt)
                {
                    let fldJqueryWindowReload = form.addField({ id: 'custpage_ndi_embed_jquery_window_reload', type: serverWidget.FieldType.INLINEHTML, label: ' '});
                    let scriptTagWriter = `<script>jQuery(function() { window.opener.nlapiChangeCall({'custparam_customer_id':'20', 'custparam_vendor_id':'18'}); window.opener.location.reload(); });</script>`;
                    fldJqueryWindowReload.defaultValue = scriptTagWriter;
                }

            }
                catch(ex)
            {
                let errorStr = (ex.getCode != null) ? `${ex.getCode()} <br> ${ex.getDetails()} <br> ${ex.getStackTrace().join('<br>')}` : ex.toString();
                log.debug(processName, `A problem occurred whilst ${processStr}: <br> ${errorStr}`);
            }
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
            
            let stTitle = 'afterSubmit';
            let stLog = '';

            let isCreateMode = (scriptContext.type === scriptContext.UserEventType.CREATE) ? true : false;
            let isEditMode = (scriptContext.type === scriptContext.UserEventType.EDIT) ? true : false;
            let isViewMode = (scriptContext.type === scriptContext.UserEventType.VIEW) ? true : false;
            let isPrintMode = (scriptContext.type === scriptContext.UserEventType.PRINT) ? true : false;
            let isCopyMode = (scriptContext.type === scriptContext.UserEventType.COPY) ? true : false;

            let newRecord = scriptContext.newRecord;
            let oldRecord = scriptContext.oldRecord;
            let POId = newRecord.id;
            let recType = newRecord.type;
            let recId = newRecord.id;

            try
            {
                if (isCreateMode || isEditMode)
                {
                    var expenseLineObj = getExpenseLineObj(newRecord,oldRecord);
                    var linkArr = expenseLineObj.linkArr;
                    var unlinkArr = expenseLineObj.unlinkArr;
                    log.debug('linkArr',linkArr);
                    log.debug('unlinkArr',unlinkArr);
                    linkArr.forEach(taskId => {
                        let poArr = new Array;
                        let fieldLookUp = search.lookupFields({
                            type: search.Type.PROJECT_TASK,
                            id: taskId,
                            columns: ['custevent_ndi_potransaction']
                        });
                        if(!isEmpty(fieldLookUp.custevent_ndi_potransaction)){
                            let poObj = fieldLookUp.custevent_ndi_potransaction
                            log.debug('link poObj',JSON.stringify(poObj));
                            for(let key in poObj){
                                poArr.push(poObj[key].value)
                            }
                            log.debug('link poArr',poArr);
                            poArr.push(POId.toString())
                            log.debug('link poArr',poArr);
                            record.submitFields({
                                type: record.Type.PROJECT_TASK,
                                id: taskId,
                                values: {
                                    'custevent_ndi_potransaction': poArr
                                }
                            });
                        }else{
                            record.submitFields({
                                type: record.Type.PROJECT_TASK,
                                id: taskId,
                                values: {
                                    'custevent_ndi_potransaction': POId
                                }
                            });
                        }
                    });
                    
                    unlinkArr.forEach(taskId => {
                        let poArr = new Array;
                        var fieldLookUp = search.lookupFields({
                            type: search.Type.PROJECT_TASK,
                            id: taskId,
                            columns: ['custevent_ndi_potransaction']
                        });
                        if(!isEmpty(fieldLookUp.custevent_ndi_potransaction)){
                            let poObj = fieldLookUp.custevent_ndi_potransaction
                            for(let key in poObj){
                                poArr.push(poObj[key].value)
                            }
                            log.debug('unlink poArr',poArr);
                            poArr.splice(poArr.indexOf(POId.toString()),1);
                            log.debug('unlink poArr',poArr);
                            record.submitFields({
                                type: record.Type.PROJECT_TASK,
                                id: taskId,
                                values: {
                                    'custevent_ndi_potransaction': poArr
                                }
                            });
                        }
                    });

                    if (isCreateMode)
                    {
                        let fldCreatedFromButtValue = newRecord.getValue({ fieldId: 'custpage_ndi_hidden_fld_created_from_butt'});
                        let isCreatedFromButt = (fldCreatedFromButtValue == 'T') ? true : false;

                        if (isCreatedFromButt)
                        {
                            redirect.toRecord({ type: recType, id: recId, parameters: { 'createdFromButt': 'T' } });
                        }
                    }
                }
            }
                catch(ex)
            {
                let errorStr = (ex.getCode != null) ? `${ex.getCode()} <br> ${ex.getDetails()} <br> ${ex.getStackTrace().join('<br>')}` : ex.toString();
                log.debug(stTitle, `A problem occurred whilst ${stLog}: <br> ${errorStr}`);

            }
        }

        return {beforeLoad, afterSubmit}

        function getExpenseLineObj(newRecord, oldRecord){
            var linkArr = new Array
            , unlinkArr = new Array
            , tempArr = new Array;
            if(!isEmpty(oldRecord)){
                var oldLineCount = oldRecord.getLineCount('expense');
                for(var i = 0 ; i < oldLineCount ; i++){
                    let task = oldRecord.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'projecttask',
                        line: i
                    })
                    if(isEmpty(task)) continue;
                    if(tempArr.indexOf(task) == -1){
                        tempArr.push(task)
                    }
                }
                unlinkArr = tempArr;
            }
            var newLineCount = newRecord.getLineCount('expense');
            for(var x = 0 ; x < newLineCount ; x++){
                let task = newRecord.getSublistValue({
                    sublistId: 'expense',
                    fieldId: 'projecttask',
                    line: x
                })
                if(isEmpty(task)) continue;
                if(tempArr.length == 0){ //Creation of Record - Link Everything
                    if(linkArr.indexOf(task) == -1){
                        linkArr.push(task)
                    }
                }else{ //Edit of Record = Link and Delete
                    if(tempArr.indexOf(task) == -1){ //New Task = Link Task
                        linkArr.push(task)
                    }else{ //Existing Task = Remove from unlink Arr
                        unlinkArr.splice(unlinkArr.indexOf(task),1);
                    }
                }
            }
            return{
                linkArr : linkArr,
                unlinkArr : unlinkArr
            }
        }

        function isEmpty(value) {
            return value === null || value === undefined || value === '' || (typeof value === 'object' && Object.keys(value).length === 0);
        }

    });
