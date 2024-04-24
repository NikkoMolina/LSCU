/**
 * Project: PROJ89 LSCU
 * Date: February 06, 2024
 * 
 *  Date Modified   Modified By		Reference		Notes
 *  Feb 06, 2024	cmartinez    	5550628			Initial Version 
 * 
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/ui/serverWidget', 'N/runtime'],
    /**
 * @param{search} search
 */
    (search, serverWidget, runtime) => {
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

            var stLogTitle = 'beforeLoad';

            try
            {
                var stEventType = scriptContext.type;
                if(stEventType == scriptContext.UserEventType.EDIT)
                {
                    var stProjectTaskSearch = runtime.getCurrentScript().getParameter('custscript_ndi_projtasksrc');
                    var stExemptedStatuses = runtime.getCurrentScript().getParameter('custscript_ndi_ue_exemptedstatuses');
                    var recProject = scriptContext.newRecord;
                    var stProject = recProject.id;
                    var stStatus = recProject.getValue({fieldId: 'entitystatus'});

                    if(!stProject || Utils.isEmpty(stStatus)) return;

                    if(stExemptedStatuses && stStatus)
                    {
                        var arrExemptedStatuses = Utils.splitAndTrim(stExemptedStatuses, ',');

                        log.debug(stLogTitle, 'stExemptedStatuses = ' + stExemptedStatuses + ' | stStatus = ' + stStatus);

                        if(arrExemptedStatuses.indexOf(stStatus) > -1)
                        {
                            return;
                        }
                    }

                    var arrProjectTasks = getProjectTaskList({
                        project: stProject,
                        search: stProjectTaskSearch
                    });

                    var objForm = scriptContext.form;
                    objForm.clientScriptModulePath = '../client/NDI_CS_TimeTracking.js';

                    objForm.addSubtab({
                        id: 'custpage_ndi_timetracking',
                        label: 'Time Tracking',
                        tab: 'schedule'
                    });

                    var objSublist = objForm.addSublist({
                        id : 'custpage_ndi_timetrackingprojecttasks',
                        type : serverWidget.SublistType.LIST,
                        label : 'Project Tasks',
                        tab : 'custpage_ndi_timetracking'
                    });

                    if(Utils.isEmpty(arrProjectTasks))
                    {
                        return;
                    }

                    var objFirstResult = arrProjectTasks[0];
                    var arrResColumns = objFirstResult.columns;
                    var intResCol = arrResColumns.length;
                    var arrListHeaders = [];

                    //Get search columns
                    for(var c = 0; c < intResCol; c++)
                    {
                        var objCol = arrResColumns[c];
                        var stSrcJoin = objCol.join;
                        var stSrcName = objCol.name;
                        var stLabel = objCol.label;
                        var stSummary = objCol.summary;
                        var stListColId = 'custpage_subl_' + stSrcName;
                        if(!Utils.isEmpty(stSrcJoin))
                        {
                            stListColId = 'custpage_subl_' + stSrcName + stSrcJoin;
                        }

                        log.debug(stLogTitle, 'stLabel = ' + stLabel
                        + ' | stSrcName = ' +stSrcName
                        + ' | stListColId = ' +stListColId);

                        var arrLabel = stLabel.split(':');
                        var stSrcLabel = arrLabel[0];
                        var boolCurrency = false;
                        var boolHidden = false;

                        if(arrLabel.length > 1)
                        {
                            if(arrLabel[1].toUpperCase() == 'ISCURRENCY')
                            {
                                boolCurrency = true;
                            }
                            else if(arrLabel[1].toUpperCase() == 'ISHIDDEN')
                            {
                                boolHidden = true;
                            }
                        }

                        arrListHeaders.push({
                            name: stSrcName,
                            join: stSrcJoin,
                            label: stSrcLabel,
                            field: stListColId.toLowerCase(),
                            iscurrency: boolCurrency,
                            ishidden: boolHidden,
                            summary: stSummary
                        });
                    }

                    for(var h = 0; h < arrListHeaders.length; h++)
                    {
                        var stListColType = serverWidget.FieldType.TEXTAREA;
                        var stListColDisplayType = serverWidget.FieldDisplayType.NORMAL;

                        if(Utils.isEmpty(arrListHeaders[h].join) && (arrListHeaders[h].name == 'recordtype'))
                        {
                            continue;
                        }

                        if(arrListHeaders[h].iscurrency == true)
                        {
                            stListColType = serverWidget.FieldType.CURRENCY;
                        }
                        if(arrListHeaders[h].ishidden == true || arrListHeaders[h].name == 'internalid')
                        {
                            stListColDisplayType = serverWidget.FieldDisplayType.HIDDEN;
                        }
                        
                        if(arrListHeaders[h].field == 'custpage_subl_custevent_lscu_gbdservice')
                        {
                            objSublist.addField({
                                id : arrListHeaders[h].field,
                                type : serverWidget.FieldType.SELECT,
                                label : arrListHeaders[h].label,
                                source: 'item'
                            }).updateDisplayType({
                                displayType : serverWidget.FieldDisplayType.DISABLED
                            });
                        }
                        else
                        {
                            objSublist.addField({
                                id : arrListHeaders[h].field,
                                type : stListColType,
                                label : arrListHeaders[h].label
                            }).updateDisplayType({
                                displayType : stListColDisplayType
                            });
                        }
                    }

                    objSublist.addField({
                        id : 'custpage_subl_timetrackdate',
                        type : serverWidget.FieldType.DATE,
                        label : 'Date'
                    }).updateDisplayType({
                        displayType : serverWidget.FieldDisplayType.ENTRY
                    }).defaultValue = new Date();

                    objSublist.addField({
                        id : 'custpage_subl_start',
                        type : serverWidget.FieldType.CHECKBOX,
                        label : 'Start'
                    }).updateDisplayType({
                        displayType : serverWidget.FieldDisplayType.HIDDEN
                    });

                    objSublist.addField({
                        id : 'custpage_subl_pause',
                        type : serverWidget.FieldType.CHECKBOX,
                        label : 'Pause'
                    }).updateDisplayType({
                        displayType : serverWidget.FieldDisplayType.HIDDEN
                    });

                    objSublist.addField({
                        id : 'custpage_subl_stop',
                        type : serverWidget.FieldType.CHECKBOX,
                        label : 'Stop'
                    }).updateDisplayType({
                        displayType : serverWidget.FieldDisplayType.HIDDEN
                    });

                    //Buttons
                    objSublist.addField({
                        id : 'custpage_subl_startbtn',
                        type : serverWidget.FieldType.TEXTAREA,
                        label : ' '
                    }).updateDisplayType({
                        displayType : stListColDisplayType
                    });

                    objSublist.addField({
                        id : 'custpage_subl_pausebtn',
                        type : serverWidget.FieldType.TEXTAREA,
                        label : ' '
                    }).updateDisplayType({
                        displayType : stListColDisplayType
                    });

                    objSublist.addField({
                        id : 'custpage_subl_stopbtn',
                        type : serverWidget.FieldType.TEXTAREA,
                        label : ' '
                    }).updateDisplayType({
                        displayType : stListColDisplayType
                    });

                    objSublist.addField({
                        id : 'custpage_subl_resetbtn',
                        type : serverWidget.FieldType.TEXTAREA,
                        label : ' '
                    }).updateDisplayType({
                        displayType : stListColDisplayType
                    });

                    var objTimeTrackStatus = objSublist.addField({
                        id : 'custpage_subl_timetrackstatus',
                        type : serverWidget.FieldType.SELECT,
                        label : 'Time Tracking Status'
                    }).updateDisplayType({
                        displayType : serverWidget.FieldDisplayType.DISABLED
                    });
                    objTimeTrackStatus.addSelectOption({
                        value : '1',
                        text : 'Not Started'
                    });
                    objTimeTrackStatus.addSelectOption({
                        value : '2',
                        text : 'Tracking Time...'
                    });
                    objTimeTrackStatus.addSelectOption({
                        value : '3',
                        text : 'Paused'
                    });
                    objTimeTrackStatus.addSelectOption({
                        value : '4',
                        text : 'Stopped'
                    });

                    objSublist.addField({
                        id : 'custpage_subl_starttime',
                        type : serverWidget.FieldType.TEXT,
                        label : 'Start Time'
                    }).updateDisplayType({
                        displayType : serverWidget.FieldDisplayType.HIDDEN
                    });

                    objSublist.addField({
                        id : 'custpage_subl_pausetime',
                        type : serverWidget.FieldType.TEXT,
                        label : ' '
                    }).updateDisplayType({
                        displayType : serverWidget.FieldDisplayType.HIDDEN
                    });

                    objSublist.addField({
                        id : 'custpage_subl_stoptime',
                        type : serverWidget.FieldType.TEXT,
                        label : 'Stop Time'
                    }).updateDisplayType({
                        displayType : serverWidget.FieldDisplayType.HIDDEN
                    });

                    objSublist.addField({
                        id : 'custpage_subl_duration',
                        type : serverWidget.FieldType.TEXT,
                        label : 'Duration (Mins)'
                    }).updateDisplayType({
                        displayType : serverWidget.FieldDisplayType.ENTRY
                    });

                    objSublist.addField({
                        id : 'custpage_subl_timeentrycomments',
                        type : serverWidget.FieldType.TEXTAREA,
                        label : 'Comments'
                    }).updateDisplayType({
                        displayType : serverWidget.FieldDisplayType.ENTRY
                    });

                    objSublist.addField({
                        id : 'custpage_subl_markforsubmit',
                        type : serverWidget.FieldType.CHECKBOX,
                        label : 'Mark For Submission'
                    }).updateDisplayType({
                        displayType : stListColDisplayType
                    });

                    objSublist.addButton({
                        label: 'Mark All',
                        id: 'custpage_subl_timetrackmarkall',
                        functionName: 'markAll()'
                    });
                    objSublist.addButton({
                        label: 'Unmark All',
                        id: 'custpage_subl_timetrackumarkall',
                        functionName: 'unmarkAll()'
                    });
                    objSublist.addButton({
                        label: 'Create Time Entries',
                        id: 'custpage_subl_timetrackcreate',
                        functionName: 'createTimeEntries()'
                    });

                    var intCount = 0;
                    for(var d = 0; d < arrProjectTasks.length; d++)
                    {
                        for(var h = 0; h < arrListHeaders.length; h++)
                        {
                            var stResName = arrListHeaders[h].name;
                            var stResJoin = arrListHeaders[h].join;
                            var stResSummary = arrListHeaders[h].summary;

                            var stResValue = arrProjectTasks[d].getText({
                                name: stResName,
                                join: stResJoin,
                                summary: stResSummary
                            });

                            if(Utils.isEmpty(stResValue) || stResName == 'custevent_lscu_gbdservice')
                            {
                                stResValue = arrProjectTasks[d].getValue({
                                    name: stResName,
                                    join: stResJoin,
                                    summary: stResSummary
                                });
                            }

                            if(!Utils.isEmpty(stResValue))
                            {
                                if(stResValue === false)
                                {
                                    stResValue = 'No';
                                }
                                else if(stResValue === true)
                                {
                                    stResValue = 'Yes';
                                }

                                objSublist.setSublistValue({
                                    id : arrListHeaders[h].field,
                                    line : d,
                                    value : stResValue
                                });
                            }

                            //Set button HTML
                            var intLine = d;
                            var stClientScriptPath = 'SuiteScripts/NDI/client/NDI_CS_TimeTracking.js';
                            var stStartHTML = 
				    	
                            '<button onclick=' + "'startButton(" + '' + intLine + ',' + '"' + stClientScriptPath + '"' + ")'" + '><b>Start</b></button>' +
                            '<script>' +
                            '	function startButton(formSublistLineNum, stClientScriptPath){'+
                            '		require(["' + stClientScriptPath + '"], function (lib1) {' +
                            '			return lib1.startButtonLogic(formSublistLineNum, stClientScriptPath);' +
                            '		})' +
                            '	}' +
                            '</script>';
                            objSublist.setSublistValue({
                                id : 'custpage_subl_startbtn',
                                line : d,
                                value : stStartHTML
                            });

                            var stPauseHTML = 
				    	
                            '<button onclick=' + "'pauseButton(" + '' + intLine + ',' + '"' + stClientScriptPath + '"' + ")'" + '><b>Pause/Continue</b></button>' +
                            '<script>' +
                            '	function pauseButton(formSublistLineNum, stClientScriptPath){'+
                            '		require(["' + stClientScriptPath + '"], function (lib1) {' +
                            '			return lib1.pauseButtonLogic(formSublistLineNum, stClientScriptPath);' +
                            '		})' +
                            '	}' +
                            '</script>';
                            objSublist.setSublistValue({
                                id : 'custpage_subl_pausebtn',
                                line : d,
                                value : stPauseHTML
                            });

                            var stStopHTML = 
				    	
                            '<button onclick=' + "'stopButton(" + '' + intLine + ',' + '"' + stClientScriptPath + '"' + ")'" + '><b>Stop</b></button>' +
                            '<script>' +
                            '	function stopButton(formSublistLineNum, stClientScriptPath){'+
                            '		require(["' + stClientScriptPath + '"], function (lib1) {' +
                            '			return lib1.stopButtonLogic(formSublistLineNum, stClientScriptPath);' +
                            '		})' +
                            '	}' +
                            '</script>';
                            objSublist.setSublistValue({
                                id : 'custpage_subl_stopbtn',
                                line : d,
                                value : stStopHTML
                            });

                            var stResetHTML = 
				    	
                            '<button onclick=' + "'resetButton(" + '' + intLine + ',' + '"' + stClientScriptPath + '"' + ")'" + '><b>Reset</b></button>' +
                            '<script>' +
                            '	function resetButton(formSublistLineNum, stClientScriptPath){'+
                            '		require(["' + stClientScriptPath + '"], function (lib1) {' +
                            '			return lib1.resetButtonLogic(formSublistLineNum, stClientScriptPath);' +
                            '		})' +
                            '	}' +
                            '</script>';
                            objSublist.setSublistValue({
                                id : 'custpage_subl_resetbtn',
                                line : d,
                                value : stResetHTML
                            });
                        }

                        intCount++;
                    }
                }
            }
            catch(e)
            {
                log.debug(stLogTitle, 'Error = ' + e.toString());
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

        }

        function getProjectTaskList(options)
        {
            var stLogTitle = 'getProjectTaskList';
            var arrProjTaskResults = [];

            try
            {
                var arrProjTaskFilters = [];
                arrProjTaskFilters.push(new search.createFilter({
                    name: 'project',
                    operator: 'anyof',
                    values: [options.project]
                }));
                arrProjTaskFilters.push(new search.createFilter({
                    name: 'custevent_lscu_gbdservice',
                    operator: 'noneof',
                    values: ["@NONE@"]
                }));

                arrProjTaskResults = Utils.search(null, options.search, arrProjTaskFilters);
            }
            catch(e)
            {
                log.debug(stLogTitle, 'Error = ' + e.toString());
            }

            return arrProjTaskResults;
        }
        
        var Utils = {};
	
        Utils.addDays = function(dtDate, intDays) 
        {
            var dtResult = new Date(dtDate);
            dtResult.setDate(dtResult.getDate() + intDays);
            return dtResult;
        }
    
        Utils.isEmpty = function(stValue)
        {
            return ((stValue === '' || stValue == null || stValue == undefined) ||
                (stValue.constructor === Array && stValue.length == 0) ||
                (stValue.constructor === Object && (function(v)
                {
                    for (var k in v) return false;
                    return true;
                })(stValue)));
        };
        
        Utils.forceInt = function(stValue)
        {
            var intValue = parseInt(stValue, 10);
    
            if (isNaN(intValue) || (stValue == Infinity))
            {
                return 0;
            }
    
            return intValue;
        };
    
        Utils.forceFloat = function(stValue)
        {
            var flValue = parseFloat(stValue);
    
            if (isNaN(flValue) || (stValue == Infinity))
            {
                return 0.00;
            }
    
            return flValue;
        };
    
        Utils.getListRecordValue = function(objValue)
        {
            var retVal = '';
    
            if(Utils.isEmpty(objValue))
            {
                retVal = '';
            }
            else if(objValue == true || objValue == false)
            {
                retVal = objValue;
            }
            else
            {
                if(Utils.isEmpty(objValue[0].value))
                {
                    retVal = objValue;
                }
                else
                {
                    retVal = objValue[0].value;   
                }
            }
    
            return retVal;
        };
    
        Utils.splitAndTrim = function(stValue, stSplitter)
        {
            if(!stValue) return null;
    
            return stValue.toLowerCase().replace(/\s+/g,'').split(stSplitter);
        };
    
        Utils.inArray = function(stValue, arrValue)
        {
            for (var i = arrValue.length - 1; i >= 0; i--)
            {
                if (stValue == arrValue[i])
                {
                    break;
                }
            }
            return (i > -1);
        };
    
        Utils.search = function(stRecordType, stSearchId, arrSearchFilter, arrSearchColumn, arrSearchSetting, intNumResults)
        {
            if (stRecordType == null && stSearchId == null)
            {
                error.create(
                    {
                        name : 'SSS_MISSING_REQD_ARGUMENT',
                        message : 'search: Missing a required argument. Either stRecordType or stSearchId should be provided.',
                        notifyOff : false
                    });
            }
    
            var arrReturnSearchResults = new Array();
            var objSavedSearch;
    
            var maxResults = 1000;
    
            if (stSearchId != null)
            {
                objSavedSearch = search.load(
                    {
                        id : stSearchId
                    });
    
                // add search filter if one is passed
                if (arrSearchFilter != null)
                {
                    if (arrSearchFilter[0] instanceof Array || (typeof arrSearchFilter[0] == 'string'))
                    {
                        objSavedSearch.filterExpression = objSavedSearch.filterExpression.concat(arrSearchFilter);
                    }
                    else
                    {
                        objSavedSearch.filters = objSavedSearch.filters.concat(arrSearchFilter);
                    }
                }
    
                // add search column if one is passed
                if (arrSearchColumn != null)
                {
                    objSavedSearch.columns = objSavedSearch.columns.concat(arrSearchColumn);
                }
            }
            else
            {
                objSavedSearch = search.create(
                    {
                        type : stRecordType
                    });
    
                // add search filter if one is passed
                if (arrSearchFilter != null)
                {
                    if (arrSearchFilter[0] instanceof Array || (typeof arrSearchFilter[0] == 'string'))
                    {
                        objSavedSearch.filterExpression = arrSearchFilter;
                    }
                    else
                    {
                        objSavedSearch.filters = arrSearchFilter;
                    }
                }
    
                // add search column if one is passed
                if (arrSearchColumn != null)
                {
                    objSavedSearch.columns = arrSearchColumn;
                }
                
                // add search setting if one is passed
                if (arrSearchSetting != null)
                {
                    objSavedSearch.settings = arrSearchSetting;
                }
            }
    
            var objResultset = objSavedSearch.run();
            var intSearchIndex = 0;
            var arrResultSlice = null;
            if(intNumResults)
            {
                arrResultSlice = objResultset.getRange(intSearchIndex, intNumResults);
                if (arrResultSlice != null)
                {
                    arrReturnSearchResults = arrReturnSearchResults.concat(arrResultSlice);
                }
            }
            else
            {
                do
                {
                    arrResultSlice = objResultset.getRange(intSearchIndex, intSearchIndex + maxResults);
                    if (arrResultSlice == null)
                    {
                        break;
                    }
    
                    arrReturnSearchResults = arrReturnSearchResults.concat(arrResultSlice);
                    intSearchIndex = arrReturnSearchResults.length;
                }
                while (arrResultSlice.length >= maxResults);
            }
    
            return arrReturnSearchResults;
        };

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
