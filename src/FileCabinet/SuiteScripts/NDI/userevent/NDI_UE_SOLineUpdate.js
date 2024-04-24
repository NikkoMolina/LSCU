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
    FORM : {
        GBD : 202
    },
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

        const getArrObjProjectTaskToSalesOrder = (paramFilterArrProjectTasks, paramSubsidiary, paramLocation) =>
        {
            let processName = 'getArrObjProjectTaskToSalesOrder';
            let processStr = '';
            let arrObjReturn = [];
    
            try
            {
                let subsidiary = (!isNullOrEmpty(paramSubsidiary)) ? paramSubsidiary : '';
                let hasSubsidiary = (!isNullOrEmpty(subsidiary)) ? true : false;

                let location = (!isNullOrEmpty(paramLocation)) ? paramLocation : '';
                let hasLocation = (!isNullOrEmpty(location)) ? true : false;

                let department = (hasSubsidiary && subsidiary == _CONFIG.SUBSIDIARY.GBD) ? _CONFIG.DEPT.MARKETING : '';
                let funcExp = (hasSubsidiary && subsidiary == _CONFIG.SUBSIDIARY.GBD) ? _CONFIG.FUNC_EXP.F_MNGMNT : '';
    
                let arrProjectTaskIds = (!isNullOrEmpty(paramFilterArrProjectTasks)) ? paramFilterArrProjectTasks : [];
                let arrProjectTaskIdsTotal = (!isNullOrEmpty(arrProjectTaskIds)) ? arrProjectTaskIds.length : 0;
                let hasArrProjectTaskIds = (arrProjectTaskIdsTotal != 0) ? true : false;
    
                if (hasArrProjectTaskIds)
                {
                    let stFormulaFilter01 = `CASE WHEN {custevent_negotiated_price} != 0 OR {custevent_lscu_gbdservice.price} != 0 THEN '1' ELSE '0' END`;
                    let stFormulaColumn01 = `CASE WHEN {custevent_negotiated_price} != 0 THEN '-1' ELSE '1' END`;
                    
                    let arrFilters = [  { name: 'internalid', operator: 'anyof', values: arrProjectTaskIds } 
                                      , { name: 'formulatext', formula: stFormulaFilter01, join: null, operator: 'is', values: '1' }  
                                     ];
    
                    let arrColumns = [  { name: 'id' }
                                      , { name: 'internalid', sort: search.Sort.ASC }
                                      , { name: 'title' } 
                                      , { name: 'custevent_lscu_gbdservice' } 
                                      , { name: 'description', join: 'CUSTEVENT_LSCU_GBDSERVICE' } 
                                      , { name: 'baseprice', join: 'CUSTEVENT_LSCU_GBDSERVICE' } 
                                      , { name: 'custevent_negotiated_price' } 
                                      , { name: 'formulatext', formula: stFormulaColumn01 }
                                      , { name: 'class', join: 'CUSTEVENT_LSCU_GBDSERVICE' } 
                                      , { name: 'status' } 
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
                                let price = result.getValue({ name: 'formulatext', formula: stFormulaColumn01 });
                                let isCustomPrice = (price == '-1') ? true : false;
                                
                                let objRef = {};
                                objRef['item'] = result.getValue({ name: 'custevent_lscu_gbdservice' });
                                objRef['quantity'] = 1;
                                objRef['description'] = result.getValue({ name: 'description', join: 'CUSTEVENT_LSCU_GBDSERVICE' }).toString();
                                objRef['price'] = price;
                                objRef['rate'] = (isCustomPrice) ? result.getValue({ name: 'custevent_negotiated_price' }) : result.getValue({ name: 'baseprice', join: 'CUSTEVENT_LSCU_GBDSERVICE' });
                                objRef['amount'] = objRef['rate']
                                objRef['department'] = department;
                                objRef['class'] = result.getValue({ name: 'class', join: 'CUSTEVENT_LSCU_GBDSERVICE' });
                                objRef['location'] = location;
                                objRef['cseg_npo_exp_type'] = funcExp;
                                objRef['custcol_ndi_projecttask'] = result.getValue({ name: 'internalid' });
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
                let urlParamCreatedFromButt = urlParams[`createdFromButt`];
                let urlParamLocation =  !(isNullOrEmpty(urlParams[`record.location`])) ? urlParams[`record.location`] : '';
                let isCreatedFromButt = (!isNullOrEmpty(urlParamCreatedFromButt) && urlParamCreatedFromButt == 'T') ? true : false;
                
                if (isCreateMode && isCreatedFromButt)
                {
                    let urlParamArrProjectTaskIds = scriptContext.request.parameters.projectTaskIds;
                    let arrProjectTaskIds = getArrProjectTaskIdsFromUrlParam(urlParamArrProjectTaskIds);
                    let arrProjectTaskIdsTotal = (!isNullOrEmpty(arrProjectTaskIds)) ? arrProjectTaskIds.length : 0;
                    let hasArrProjectTaskIds = (arrProjectTaskIdsTotal != 0) ? true : false;



                    if (hasArrProjectTaskIds)
                    {
                        let arrObjSalesOrderItems = getArrObjProjectTaskToSalesOrder(arrProjectTaskIds, urlParamSubsidiary, urlParamLocation);
                        let arrObjSalesOrderItemsTotal = (!isNullOrEmpty(arrObjSalesOrderItems)) ? arrObjSalesOrderItems.length : 0;
                        let hasArrObjSalesOrderItems = (arrObjSalesOrderItemsTotal != 0) ? true : false;


                        if (hasArrObjSalesOrderItems)
                        {

                            let fldSkipFlag = form.addField({ type: 'LONGTEXT', id: 'custpage_ndi_hidden_fld_skip_flag', label: 'Hidden Field - SKIP FLAG'}).updateDisplayType({displayType:serverWidget.FieldDisplayType.HIDDEN});
                            fldSkipFlag.defaultValue = 'T';

                            let fldCreatedFromButt = form.addField({ type: 'LONGTEXT', id: 'custpage_ndi_hidden_fld_created_from_butt', label: 'Hidden Field - CREATED FROM BUTT'}).updateDisplayType({displayType:serverWidget.FieldDisplayType.HIDDEN});
                            fldCreatedFromButt.defaultValue = 'T';

                            log.debug(processName, `arrObjSalesOrderItems: ${JSON.stringify(arrObjSalesOrderItems, 'key', '\t')}`);
                            newRecord.setValue({ fieldId: 'custbody_ndi_json_container_salesorder', value: JSON.stringify(arrObjSalesOrderItems), ignoreFieldChange: true });
                            newRecord.setValue({ fieldId: 'subsidiary', value: urlParamSubsidiary, ignoreFieldChange: false });
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
            
            let stTitle = 'afterSubmit';
            let stLog = '';

           //let isExecutionCtxUserInterface = (runtime.executionContext === runtime.ContextType.USER_INTERFACE) ? true : false;
            let isCreateMode = (scriptContext.type === scriptContext.UserEventType.CREATE) ? true : false;
            let isEditMode = (scriptContext.type === scriptContext.UserEventType.EDIT) ? true : false;
            let isViewMode = (scriptContext.type === scriptContext.UserEventType.VIEW) ? true : false;
            let isPrintMode = (scriptContext.type === scriptContext.UserEventType.PRINT) ? true : false;
            let isCopyMode = (scriptContext.type === scriptContext.UserEventType.COPY) ? true : false;

            let newRecord = scriptContext.newRecord;
            let SOId = newRecord.id;
            let recType = newRecord.type;
            let recId = newRecord.id;

            try
            {

                if (isCreateMode || isEditMode)
                {
                    
                    var projectId = newRecord.getValue({ fieldId: 'job' });
                    
                    // Create a search to find project tasks for the specified project
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
                                name: 'internalid',
                                label: 'Internal ID'
                            }),
                            search.createColumn({
                                name: 'custevent_ndi_sotransaction',
                                label: 'Transaction'
                            }),
                            search.createColumn({
                                name: 'custevent_lscu_gbdservice',
                                label: 'Service'
                            }),
                            search.createColumn({
                                name: "custitem_ndi_ada_check",
                                join: "CUSTEVENT_LSCU_GBDSERVICE",
                                label: "ADA Item"
                             })
                            // Add more columns as needed
                        ]
                    });
            
                    // Run the search and retrieve the results
                    var searchResults = projectTaskSearch.run().getRange({ start: 0, end: 1000 }); // Adjust the range as needed
    
        
                    for (var i = 0; i < searchResults.length; i++)
                    {
                        var lineTask = searchResults[i].getValue({ name: 'internalid' });
    
                        //Check if it exists in SO List
                        var existsLineNum = newRecord.findSublistLineWithValue({ sublistId: 'item', fieldId: 'custcol_ndi_projecttask', value: lineTask });
    
                        //If it exists, add the SO connection
                        if (existsLineNum != -1)
                        {
                            var adaCheck = searchResults[i].getValue({ name: "custitem_ndi_ada_check", join: "CUSTEVENT_LSCU_GBDSERVICE" });
                            log.debug('adaCheck', adaCheck);
    
                            if (!(adaCheck)) //If item is not ADA item, mark as complete
                            {
                                record.submitFields({ type: record.Type.PROJECT_TASK, id: lineTask, values: { 'custevent_ndi_sotransaction' : SOId, 'status' : 'COMPLETE' }  });
                            }else{
                                record.submitFields({ type: record.Type.PROJECT_TASK, id: lineTask, values: { 'custevent_ndi_sotransaction' : SOId }  });
                            }
                        }
                            else 
                        {
                            //Check if it HAD a connection to current SO
                            var projTaskRec = record.load({ type: record.Type.PROJECT_TASK, id: lineTask });
                            var transactionId = projTaskRec.getValue({ fieldId: 'custevent_ndi_sotransaction'});
                            
                            //Remove connection if it was part of the SO
                            if (transactionId == SOId) 
                            {
                                record.submitFields({ type: record.Type.PROJECT_TASK, id: lineTask, values: { 'custevent_ndi_sotransaction' : null, 'status' : 'PROGRESS' } });
                            }
                        }
                    }
                    
                    //Check if project has all completed proj tasks, set proj to complete NEED TO TEST
                    projectTaskSearch = search.create({
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
                    searchResults = projectTaskSearch.run().getRange({
                        start: 0,
                        end: 1000 // Adjust the range as needed
                    });
                    //Check if project has all completed tasks, if so complete status
                    var progressFlag = true;
                    for (var i = 0; i < searchResults.length; i++){
                        var progressCheck = searchResults[i].getValue({
                            name: 'status'
                        });
                        //If it exists, add the SO connection
                        if (progressCheck != 'COMPLETE'){
                            progressFlag = false
                        }
                    }
                    if (progressFlag){
                        record.submitFields({
                            type: record.Type.JOB,
                            id: projectId,
                            values: {
                                'entitystatus' : 17 //Complete status id
                            },
                        });
                    }

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
                
                if (scriptContext.type == scriptContext.UserEventType.DELETE)
                {
                    var oldRecord = scriptContext.oldRecord;
                    var projectId = oldRecord.getValue({
                        fieldId: 'job'
                    });
        
                    // Create a search to find project tasks for the specified project
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
                                name: 'internalid',
                                label: 'Internal ID'
                            }),
                            search.createColumn({
                                name: 'custevent_ndi_sotransaction',
                                label: 'Transaction'
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
        
                    for (var i = 0; i < searchResults.length; i++){
                        var lineTask = searchResults[i].getValue({
                            name: 'internalid'
                        });
    
                        //Check if it existed in SO List
                        var existsLineNum = oldRecord.findSublistLineWithValue({
                            sublistId: 'item',
                            fieldId: 'custcol_ndi_projecttask',
                            value: lineTask
                        });
    
                        //If it exists, delete the link and set to in progress
                        if (existsLineNum != -1){
                            record.submitFields({
                                type: record.Type.PROJECT_TASK,
                                id: lineTask,
                                values: {
                                    'custevent_ndi_sotransaction' : null,
                                    'status' : 'PROGRESS'
                                },
                            });
    
                        }
                    }
                    //When deleted SO, set Project record to In Progress
                    record.submitFields({ type: record.Type.JOB, id: projectId, values: { 'entitystatus' : 2 } });
                }
    

                
            }
                catch(ex)
            {
                let errorStr = (ex.getCode != null) ? `${ex.getCode()} <br> ${ex.getDetails()} <br> ${ex.getStackTrace().join('<br>')}` : ex.toString();
                log.debug(stTitle, `A problem occurred whilst ${stLog}: <br> ${errorStr}`);

            }                

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
