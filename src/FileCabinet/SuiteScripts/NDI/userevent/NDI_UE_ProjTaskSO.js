/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(['N/record', 'N/search', 'N/ui/serverWidget', 'N/file', 'N/query'],
    /**
 * @param{record} record
 * @param{serverWidget} serverWidget
 */
    (record, search, serverWidget, file, query) => {

        const FORM = {
            SUBTAB : {
                SO : {
                    ID : 'custpage_ndi_sosubtabprojecttasks',
                    LABEL : 'Create Project Task SO',
                    TAB : 'schedule'
                },
                PO : {
                    ID : 'custpage_ndi_posubtabprojecttasks',
                    LABEL : 'Create Payment Request Submission',
                    TAB : 'schedule'
                },
            },
            SUBTAB_FIELD : {
                PO : {
                    VENDOR : {
                        id : 'custpage_ndi_povendor',
                        type : serverWidget.FieldType.SELECT,
                        label : 'Vendor',
                        source : 'vendor',
                        container : 'custpage_ndi_posubtabprojecttasks'
                    }
                },
            },
            SUBLIST : {
                SO : {
                    ID : 'custpage_ndi_soprojecttasks',
                    LABEL : 'Create SO for Project Task',
                    FIELD : {
                        INCLUDE : {
                            id: 'custpage_ndi_soselect',
                            label: 'Include',
                            type: serverWidget.FieldType.CHECKBOX,
                            source: ''
                        },
                        ID : {
                            id: 'custpage_ndi_soid',
                            label: 'ID',
                            type: serverWidget.FieldType.TEXT,
                            source: ''
                        },
                        NAME : {
                            id: 'custpage_ndi_sotitle',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Name',
                            source: ''
                        },
                        ITEM : {
                            id: 'custpage_ndi_soitem',
                            type: serverWidget.FieldType.SELECT,
                            label: 'GBD SERVICES',
                            source: 'item'
                        },
                        BASE : {
                            id: 'custpage_ndi_sobase',
                            type: serverWidget.FieldType.TEXT,
                            label: 'BASE PRICE',
                            source: ''
                        },
                        RATE : {
                            id: 'custpage_ndi_soprice',
                            type: serverWidget.FieldType.TEXT,
                            label: 'NEGOTIATED PRICE',
                            source: ''
                        },
                        PROGRESS : {
                            id: 'custpage_sostatus',
                            type: serverWidget.FieldType.TEXT,
                            label: 'STATUS',
                            source: ''
                        },
                    }
                },
                PO : {
                    ID : 'custpage_ndi_poprojecttasks',
                    LABEL : 'Create Payment Request Submission',
                    FIELD : {
                        INCLUDE : {
                            id: 'custpage_ndi_poselect',
                            label: 'Include',
                            type: serverWidget.FieldType.CHECKBOX,
                            source: ''
                        },
                        ID : {
                            id: 'custpage_ndi_poid',
                            label: 'ID',
                            type: serverWidget.FieldType.TEXT,
                            source: ''
                        },
                        NAME : {
                            id: 'custpage_ndi_potitle',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Name',
                            source: ''
                        },
                        ITEM : {
                            id: 'custpage_ndi_poitem',
                            type: serverWidget.FieldType.SELECT,
                            label: 'GBD SERVICES',
                            source: 'item'
                        },
                        AMOUNT : {
                            id: 'custpage_ndi_poamount',
                            type: serverWidget.FieldType.FLOAT,
                            label: 'AMOUNT',
                            source: ''
                        },
                        PROGRESS : {
                            id: 'custpage_postatus',
                            type: serverWidget.FieldType.TEXT,
                            label: 'STATUS',
                            source: ''
                        },
                        POLIST : {
                            id: 'custpage_polist',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Associated PRs',
                            source: ''
                        },
                    }
                },
            }
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
            var mode = scriptContext.type;
            var recObj = scriptContext.newRecord;
            var form = scriptContext.form;
            
            if(mode == scriptContext.UserEventType.EDIT){
                form.clientScriptModulePath = '../client/NDI_CS_ProjTaskSO.js';

                let projTaskObj = getProjTask(recObj.id);

                for (const recKey in FORM.SUBTAB) {

                    form.addSubtab({
                        id: FORM.SUBTAB[recKey].ID,
                        label: FORM.SUBTAB[recKey].LABEL,
                        tab: FORM.SUBTAB[recKey].TAB
                    });

                    //ADD TAB FIELDS    
                    if(FORM.SUBTAB_FIELD.hasOwnProperty(recKey)){
                        for(const tabFldKey in FORM.SUBTAB_FIELD[recKey]){
                            form.addField(FORM.SUBTAB_FIELD[recKey][tabFldKey]);
                        }
                    }

                    var sublist = form.addSublist({
                        id : FORM.SUBLIST[recKey].ID,
                        type : serverWidget.SublistType.LIST,
                        label : FORM.SUBLIST[recKey].LABEL,
                        tab : FORM.SUBTAB[recKey].ID
                    });

                    for (const fldKey in FORM.SUBLIST[recKey].FIELD) {
                        let field = sublist.addField(FORM.SUBLIST[recKey].FIELD[fldKey]);
                        switch (fldKey) {
                            case 'INCLUDE':
                            case 'AMOUNT':
                                field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
                                break;
                            case 'ITEM':
                                field.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                                break;
                            default:
                                break;
                        }
                    }
                    
                    //CREATE Subtab
                    if(!isEmpty(projTaskObj[recKey])){

                        sublist.addMarkAllButtons();

                        let i = 0;
                        for (const taskId in projTaskObj[recKey]) {
                            for (const key in projTaskObj[recKey][taskId]) {
                                projTaskObj[recKey][taskId][key].line = i;
                                if(isEmpty(projTaskObj[recKey][taskId][key].value)) continue;
                                sublist.setSublistValue(projTaskObj[recKey][taskId][key]);
                            }
                            i++;
                        }

                        if(recKey == "SO"){
                            /** start D.A. **/
                            let buttCreateSoInNewWindow = sublist.addButton({id:'custpage_ndi_butt_create_so_in_new_window', label :'Create Sales Order', functionName: 'createSoInNewWindow()'});
                            buttCreateSoInNewWindow.isDisabled = true;
                            /**  end D.A.  **/
                        }else if(recKey == "PO"){
                            /** start D.A. **/
                            let buttCreatePoInNewWindow = sublist.addButton({id:'custpage_ndi_butt_create_po_in_new_window', label :'Create Payment Request', functionName: 'createPoInNewWindow()'});
                            buttCreatePoInNewWindow.isDisabled = true;
                            /**  end D.A.  **/
                        }
                    }
                }
                /** start D.A. **/

                // Embed jQuery script functions
                let fileJquery = file.load('../client/NDI_CS_ProjTaskSO_Jquery.js');
                let fileJqueryUrl = fileJquery.url;
                let fldJquery = form.addField({ id: 'custpage_ndi_embed_jquery', type: serverWidget.FieldType.INLINEHTML, label: ' '});
                let scriptTagWriter = `<script src="${fileJqueryUrl}"></script>`;
                fldJquery.defaultValue = scriptTagWriter;

                let arrObjStates = suiteSqlGetArrObjStates();
                let objCountryStateMapping = getObjCountryStateMapping(arrObjStates);

                let customerInternalId = recObj.getValue({ fieldId: 'parent'});
                log.debug('PROJECT DETAILS',JSON.stringify({
                    project: recObj.id,
                      customer: customerInternalId
                  }));
                let objCustomerCountryState = getObjCustomerCountryState(customerInternalId);
                let billcountry = objCustomerCountryState['billcountry'];
                let billstate = objCustomerCountryState['billstate'];

                let objCountryState = getObjCountryState(objCountryStateMapping, billcountry, billstate);
                let stateId = objCountryState[`id`];

                // Hidden Field - JSON Country State Mapping
                let fldJsonCountryStateMapping = form.addField({ type: 'LONGTEXT', id: 'custpage_ndi_hidden_fld_json_country_state_mapping', label: 'Hidden Field - JSON COUNTRY STATE MAPPING'}).updateDisplayType({displayType:serverWidget.FieldDisplayType.HIDDEN});
                fldJsonCountryStateMapping.defaultValue = JSON.stringify(objCountryStateMapping);

                // Hidden Field - Customer Bill State, Bill Country
                let fldCustomerBillCountry = form.addField({ type: 'LONGTEXT', id: 'custpage_ndi_hidden_fld_customer_billcountry', label: 'Hidden Field - CUSTOMER BILL COUNTRY'}).updateDisplayType({displayType:serverWidget.FieldDisplayType.HIDDEN});
                fldCustomerBillCountry.defaultValue = billcountry;
            
                let fldCustomerBillState = form.addField({ type: 'LONGTEXT', id: 'custpage_ndi_hidden_fld_customer_billstate', label: 'Hidden Field - CUSTOMER BILL STATE'}).updateDisplayType({displayType:serverWidget.FieldDisplayType.HIDDEN});
                fldCustomerBillState.defaultValue = billstate;

                // Hidden Field - State Id
                let fldStateId = form.addField({ type: 'LONGTEXT', id: 'custpage_ndi_hidden_fld_state_id', label: 'Hidden Field - STATE ID'}).updateDisplayType({displayType:serverWidget.FieldDisplayType.HIDDEN});
                fldStateId.defaultValue = stateId;

                /**  end D.A.  **/
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
        const afterSubmit = (scriptContext) => 
        {
            let stTitle = 'afterSubmit';
            let stLog = '';

            try
            {

            }
                catch(ex)
            {

            }
        }

        /** start D.A. **/
        const isNullOrEmpty = (valueStr) => 
        {
            return (valueStr == null || valueStr == "" || valueStr == undefined)
        }
    
        const isNullOrEmptyObject = (obj) =>
        {
            let hasOwnProperty = Object.prototype.hasOwnProperty;
          
            if (obj.length && obj.length > 0) { return false; }   
            for (let key in obj) { if (hasOwnProperty.call(obj, key)) return false; }
            return true;
        }
        
        const isObjectExist = (objFld) =>
        {
            let isObjExist = (typeof objFld != "undefined") ? true : false;
            return isObjExist;
        }

        const suiteSqlGetArrObjStates = () =>
        {
            let processName = 'suiteSqlGetArrObjStates';
            let processStr = '';
            let arrObjReturn = [];
    
            try
            {
                let stSqlStatement = `SELECT state.country, state.fullname, state.shortname, Location.id FROM State INNER JOIN Location ON State.fullname = Location.fullname`;
    
                let queryResults = query.runSuiteQL({ query: stSqlStatement }).asMappedResults();
                let arrObjResults = (!isNullOrEmpty(queryResults)) ? queryResults : [];
                let arrObjResultsTotal = (!isNullOrEmpty(arrObjResults)) ? arrObjResults.length : 0;
                let hasArrObjResults = (arrObjResultsTotal != 0) ? true : false;
                arrObjReturn = (hasArrObjResults) ? arrObjResults : [];
            }
                catch(ex)
            {
                let errorStr = (ex.getCode != null) ? `${ex.getCode()} <br> ${ex.getDetails()} <br> ${ex.getStackTrace().join('<br>')}` : ex.toString();
                log.debug(processName, `A problem occurred whilst ${processStr}: <br> ${errorStr}`);
            }
            return arrObjReturn;
        }
    
        const getObjCountryStateMapping = (paramArrObjStates) =>
        {
            let processName = 'getObjCountryStateMapping';
            let processStr = '';
            let objReturn = {};
    
            try
            {
                let arrObjStates = (!isNullOrEmpty(paramArrObjStates)) ? paramArrObjStates : [];
                let arrObjStatesTotal = (!isNullOrEmpty(arrObjStates)) ? arrObjStates.length : 0;
                let hasArrObjStates = (arrObjStatesTotal != 0) ? true : false;
    
                if (hasArrObjStates)
                {
                    for (let dx = 0; dx < arrObjStatesTotal; dx++)
                    {
                        let country = arrObjStates[dx][`country`];
                        let state = arrObjStates[dx][`shortname`];
    
                        let isObjKeyCountryExist = (isObjectExist(objReturn[`${country}`])) ? true : false;
    
                        if (!isObjKeyCountryExist)
                        {
                            objReturn[`${country}`] = {};
                            objReturn[`${country}`][`${state}`] = {};
                            objReturn[`${country}`][`${state}`] = arrObjStates[dx];
                        }
                        
                        if (isObjKeyCountryExist)
                        {
                            let isObjKeyStateExist = (isObjectExist(objReturn[`${country}`][`${state}`])) ? true : false;
    
                            if (!isObjKeyStateExist)
                            {
                                objReturn[`${country}`][`${state}`] = {};
                                objReturn[`${country}`][`${state}`] = arrObjStates[dx];
                            }
                        }
                    }
                }
            }
                catch(ex)
            {
                let errorStr = (ex.getCode != null) ? `${ex.getCode()} <br> ${ex.getDetails()} <br> ${ex.getStackTrace().join('<br>')}` : ex.toString();
                log.debug(processName, `A problem occurred whilst ${processStr}: <br> ${errorStr}`);
            }
            return objReturn;
        }
    
        const getObjCountryState = (paramObjCountryStateMapping, paramCountry, paramState) =>
        {
            let processName = 'getObjCountryState';
            let processStr = '';
            let objReturn = {};
            objReturn[`country`] = '';
            objReturn[`fullname`] = '';
            objReturn[`id`] = '';
            objReturn[`shortname`] = '';
    
            try
            {
                let objCountryStateMapping = paramObjCountryStateMapping;
                let hasObjCountryStateMapping = (!isNullOrEmptyObject(objCountryStateMapping)) ? true : false;
    
                if (hasObjCountryStateMapping)
                {
                    let country = paramCountry;
                    let state = paramState;
    
                    let hasCountry = (!isNullOrEmpty(country)) ? true : false;
                    let hasState = (!isNullOrEmpty(state)) ? true : false;
    
                    if (hasCountry && hasState)
                    {
                        let isObjKeyCountryExistInMapping = (isObjectExist(objCountryStateMapping[`${country}`])) ? true : false;
    
                        if (isObjKeyCountryExistInMapping)
                        {
                            let isObjKeyStateExistInMapping = (objCountryStateMapping[`${country}`][`${state}`]) ? true : false;
    
                            if (isObjKeyStateExistInMapping)
                            {
                                objReturn = objCountryStateMapping[`${country}`][`${state}`];
                            }
                        }
                    }
    
                }
            }
                catch(ex)
            {
                let errorStr = (ex.getCode != null) ? `${ex.getCode()} <br> ${ex.getDetails()} <br> ${ex.getStackTrace().join('<br>')}` : ex.toString();
                log.debug(processName, `A problem occurred whilst ${processStr}: <br> ${errorStr}`);
            }
            return objReturn;
        }
            
        const getObjCustomerCountryState = (paramCustomerId) =>
        {
            let processName = 'getObjCustomerCountryState';
            let processStr = '';
            let objReturn = {};
            objReturn[`billcountry`] = '';
            objReturn[`billstate`] = '';
    
            try
            {
                var fieldCustomerLookUp = search.lookupFields({ type: 'customer', id: paramCustomerId, columns: ['billcountry', 'billstate'] });
                objReturn[`billcountry`] = (!isNullOrEmpty(fieldCustomerLookUp['billcountry'])) ? fieldCustomerLookUp['billcountry'][0][`value`] : '';
                objReturn[`billstate`] = (!isNullOrEmpty(fieldCustomerLookUp['billstate'])) ? fieldCustomerLookUp['billstate'][0][`value`] : '';
    
            }
                catch(ex)
            {
                let errorStr = (ex.getCode != null) ? `${ex.getCode()} <br> ${ex.getDetails()} <br> ${ex.getStackTrace().join('<br>')}` : ex.toString();
                log.debug(processName, `A problem occurred whilst ${processStr}: <br> ${errorStr}`);
            }
            return objReturn;
        }
        
        /** end D.A. **/

        return {beforeLoad}

        function getProjTask(projId){
            let soTaskObj = new Object,
            poTaskObj = new Object;
            var projecttaskSearchObj = search.create({
                type: "projecttask",
                filters:
                [
                   ["project","anyof",projId], 
                   "AND", 
                   ["custevent_lscu_gbdservice","noneof","@NONE@"],
                ],
                columns:
                [
                   search.createColumn({name: "custevent_ndi_sotransaction", label: "SO"}),
                   search.createColumn({name: "custevent_ndi_potransaction", label: "PO"}),
                   search.createColumn({name: "title", label: "Name"}),
                   search.createColumn({name: "custevent_lscu_gbdservice", label: "GBD Services"}),
                   search.createColumn({name: "custevent_negotiated_price", label: "Negotiated Price"}),
                   search.createColumn({name: "status", label: "status"}),
                   search.createColumn({
                    name: "baseprice",
                    join: "CUSTEVENT_LSCU_GBDSERVICE",
                    label: "Base Price"
                 }),
                ]
             });
             var pagedData = projecttaskSearchObj.runPaged({pageSize : 1000});			
            for(var i = 0; i < pagedData.pageRanges.length; i++ ) {
                var currentPage = pagedData.fetch(i);
                currentPage.data.forEach(function(result) {
                    var soRec = result.getValue({ name: "custevent_ndi_sotransaction" })
                    var dataObj = {
                        ID : result.id,
                        NAME : result.getValue  ({ name: "title"}),
                        ITEM : result.getValue  ({ name: "custevent_lscu_gbdservice"}),

                        BASE : result.getValue  ({ name: "baseprice", join: "CUSTEVENT_LSCU_GBDSERVICE"}) || 0,
                        RATE : result.getValue  ({ name: "custevent_negotiated_price"}) || 0,

                        PROGRESS : result.getText ({ name: "status"}),
                        POLIST : result.getText({ name: "custevent_ndi_potransaction" })
                    };
                    if(dataObj.BASE != 0 || dataObj.RATE != 0){
                        if(isEmpty(soRec)){
                            soTaskObj[result.id] = new Object;
                            for (const key in dataObj) {
                                if(!FORM.SUBLIST.SO.FIELD.hasOwnProperty(key)) continue;
                                soTaskObj[result.id][key] = {
                                    id: FORM.SUBLIST.SO.FIELD[key].id, 
                                    value: dataObj[key]
                                }
                            }
                        }
                        poTaskObj[result.id] = new Object;
                        for (const key in dataObj) {
                            if(!FORM.SUBLIST.PO.FIELD.hasOwnProperty(key)) continue;
                            poTaskObj[result.id][key] = {
                                id: FORM.SUBLIST.PO.FIELD[key].id, 
                                value: dataObj[key]
                            }
                        }
                    }
                });
            }
            log.audit('projTaskObj',JSON.stringify({
                SO : soTaskObj,
                PO : poTaskObj
            }));

            return {
                SO : soTaskObj,
                PO : poTaskObj
            };
        }

        function isEmpty(value) {
            return value === null || value === undefined || value === '' || (typeof value === 'object' && Object.keys(value).length === 0);
        }

    });
