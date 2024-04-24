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
    FORM : {
        GBD : 202
    },
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
define(['N/log', 'N/record','N/search','N/url', 'N/currentRecord'],
/**
 * @param{log} log
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 */
function(log, record, search, url, currentRecord) {
    

    function isNullOrEmpty(valueStr)
    {
        return(valueStr == null || valueStr == "" || valueStr == undefined); 
    }
    
    function isNullOrEmptyObject(obj) 
    {
        var hasOwnProperty = Object.prototype.hasOwnProperty;

        if (obj.length && obj.length > 0) { return false; }   
        for (var key in obj) { if (hasOwnProperty.call(obj, key)) return false; }
        return true;
    }
            
    function isObjectExist(objFld)
    {
        var isObjExist = (typeof objFld != "undefined") ? true : false;
        return isObjExist;
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
        
        try
        {
              
        }
            catch(ex)
        {
            //console.log('pageInit Error: ' + ex.toString() );
        }

    }

    return {
        pageInit: pageInit,
        createSoInNewWindow: createSoInNewWindow,
        createPoInNewWindow: createPoInNewWindow,
    };

    function createSoInNewWindow()
    {
        var processName = 'createSoInNewWindow';
        var processStr = '';

        try
        {
            var objRec = currentRecord.get();
            var sublistLineTotal = objRec.getLineCount({ sublistId: 'custpage_ndi_soprojecttasks' });
            var arrProjectTaskIds = [];
            
            for (var dx = 0; dx < sublistLineTotal; dx++)
            {
                var isIncludeCheckboxChecked = objRec.getSublistValue({ sublistId: 'custpage_ndi_soprojecttasks', fieldId: 'custpage_ndi_soselect', line: dx});

                if (isIncludeCheckboxChecked)
                {
                    var projectTaskInternalId = objRec.getSublistValue({ sublistId: 'custpage_ndi_soprojecttasks', fieldId: 'custpage_ndi_soid', line: dx });
                    arrProjectTaskIds.push(projectTaskInternalId);
                }
            }

            var arrItemIdsTotal = (!isNullOrEmpty(arrProjectTaskIds)) ? arrProjectTaskIds.length : 0;
            var hasArrItemIds = (arrItemIdsTotal != 0) ? true : false;

            if (hasArrItemIds)
            {
                var entityValue = objRec.getValue({ fieldId: 'parent' });
                var subsidiaryValue = objRec.getValue({ fieldId: 'subsidiary' });
                var startDateValue = objRec.getValue({ fieldId: 'startdate' });
                var locationValue = objRec.getValue({ fieldId: 'custpage_ndi_hidden_fld_state_id' });
                var departmentValue = (subsidiaryValue ==_CONFIG.SUBSIDIARY.GBD) ? _CONFIG.DEPT.MARKETING : '';
                
                var objUrlParams = {};
                objUrlParams['entity'] = entityValue;
                objUrlParams['cf'] = _CONFIG.FORM.GBD;
                objUrlParams['record.job'] = objRec.id;
                objUrlParams['subsidiary'] = subsidiaryValue;
                objUrlParams['record.startdate'] = nlapiDateToString(startDateValue);
                objUrlParams['record.department'] = departmentValue;
                objUrlParams['record.location'] = locationValue;
                objUrlParams['projectTaskIds'] = JSON.stringify(arrProjectTaskIds);
                objUrlParams['createdFromButt'] = 'T';

                var newSalesOrderUrl = url.resolveRecord({ recordType: record.Type.SALES_ORDER, isEditMode: true, params: objUrlParams });
                window.open(newSalesOrderUrl);
            }
        }
            catch(ex)
        {
            console.log('Error in ' + processName + ': ' + ex.toString())
        }            
    }

    function createPoInNewWindow()
    {
        var processName = 'createPoInNewWindow';
        var processStr = '';

        try
        {
            var objRec = currentRecord.get();
            var sublistLineTotal = objRec.getLineCount({ sublistId: 'custpage_ndi_poprojecttasks' });
            var arrProjectTaskIds = [];
            var arrProjectTaskAmounts = [];
            var hasAmount = true;

            var poVendor = objRec.getValue('custpage_ndi_povendor');
            if(isEmpty(poVendor)) {
                alert("Please select a Vendor before creating a Payment Request.");
                return;
            }

            for (var dx = 0; dx < sublistLineTotal; dx++)
            {
                var isIncludeCheckboxChecked = objRec.getSublistValue({ sublistId: 'custpage_ndi_poprojecttasks', fieldId: 'custpage_ndi_poselect', line: dx});

                if (isIncludeCheckboxChecked)
                {
                    var poAmount = objRec.getSublistValue({ sublistId: 'custpage_ndi_poprojecttasks', fieldId: 'custpage_ndi_poamount', line: dx });
                    if(isEmpty(poAmount) || poAmount == 0) {
                        alert("You have included tasks that have no amount. Please address them and try again.");
                        return;
                    }
                    var projectTaskInternalId = objRec.getSublistValue({ sublistId: 'custpage_ndi_poprojecttasks', fieldId: 'custpage_ndi_poid', line: dx });
                    arrProjectTaskIds.push(projectTaskInternalId);
                    arrProjectTaskAmounts.push(poAmount);
                }
            }

            var arrItemIdsTotal = (!isNullOrEmpty(arrProjectTaskIds)) ? arrProjectTaskIds.length : 0;
            var hasArrItemIds = (arrItemIdsTotal != 0) ? true : false;

            if (hasArrItemIds)
            {
                var subsidiaryValue = objRec.getValue({ fieldId: 'subsidiary' });
                var startDateValue = objRec.getValue({ fieldId: 'startdate' });
                var locationValue = objRec.getValue({ fieldId: 'custpage_ndi_hidden_fld_state_id' });
                var departmentValue = (subsidiaryValue ==_CONFIG.SUBSIDIARY.GBD) ? _CONFIG.DEPT.MARKETING : '';
                
                var objUrlParams = {};
                objUrlParams['entity'] = poVendor;
                objUrlParams['cf'] = _CONFIG.POFORM.GBD;
                objUrlParams['record.job'] = objRec.id;
                objUrlParams['subsidiary'] = subsidiaryValue;
                objUrlParams['account'] = _CONFIG.ACCOUNT.GBD;
                objUrlParams['record.startdate'] = nlapiDateToString(startDateValue);
                objUrlParams['record.department'] = departmentValue;
                objUrlParams['record.location'] = locationValue;
                objUrlParams['projectTaskIds'] = JSON.stringify(arrProjectTaskIds);
                objUrlParams['projectTaskAmts'] = JSON.stringify(arrProjectTaskAmounts);
                objUrlParams['createdFromButt'] = 'T';

                var newPurchOrderUrl = url.resolveRecord({ recordType: record.Type.PURCHASE_ORDER, isEditMode: true, params: objUrlParams });
                window.open(newPurchOrderUrl);
            }
        }
            catch(ex)
        {
            console.log('Error in ' + processName + ': ' + ex.toString())
        }            
    }

    function isEmpty(value) {
        return value === null || value === undefined || value === '' || (typeof value === 'object' && Object.keys(value).length === 0);
    }

});
