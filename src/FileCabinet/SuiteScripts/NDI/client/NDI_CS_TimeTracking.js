/**
 * Project: PROJ89 LSCU
 * Date: February 06, 2024
 * 
 *  Date Modified   Modified By		Reference		Notes
 *  Feb 06, 2024	cmartinez    	5550628			Initial Version 
 * 
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/https', 'N/url', 'N/runtime', 'N/ui/message', 'N/ui/dialog', 'N/currentRecord', 'N/search', 'N/url', 'N/currentRecord', 'N/xml'],

function(https, url, runtime, message, dialog, currentRecordModule, search, url, currentRecord, xml) {

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
    function fieldChanged(scriptContext) {
    	
    }

	function markAll()
	{
		var recCurrent = currentRecord.get();

		var intProjectTasks = recCurrent.getLineCount({
			sublistId: 'custpage_ndi_timetrackingprojecttasks'
		});

		for(var intLn = 0; intLn < intProjectTasks; intLn++)
		{
			recCurrent.selectLine({
				sublistId: 'custpage_ndi_timetrackingprojecttasks', 
				line: intLn, 
				value: true
			});
			recCurrent.setCurrentSublistValue({
				sublistId: 'custpage_ndi_timetrackingprojecttasks', 
				fieldId: 'custpage_subl_markforsubmit', 
				// line: intLn,
				value: true
			});
			recCurrent.commitLine({
				sublistId: 'custpage_ndi_timetrackingprojecttasks'
			});
		}
	}

	function unmarkAll()
	{
		var recCurrent = currentRecord.get();

		var intProjectTasks = recCurrent.getLineCount({
			sublistId: 'custpage_ndi_timetrackingprojecttasks'
		});

		for(var intLn = 0; intLn < intProjectTasks; intLn++)
		{
			recCurrent.selectLine({
				sublistId: 'custpage_ndi_timetrackingprojecttasks', 
				line: intLn, 
				value: true
			});
			recCurrent.setCurrentSublistValue({
				sublistId: 'custpage_ndi_timetrackingprojecttasks', 
				fieldId: 'custpage_subl_markforsubmit', 
				value: false
			});
			recCurrent.commitLine({
				sublistId: 'custpage_ndi_timetrackingprojecttasks'
			});
		}
	}

	function createTimeEntries()
	{
		var recCurrent = currentRecord.get();

		var intProjectTasks = recCurrent.getLineCount({
			sublistId: 'custpage_ndi_timetrackingprojecttasks'
		});

		var stProject = recCurrent.id;

		var arrTimeEntries = [];
		for(var intLn = 0; intLn < intProjectTasks; intLn++)
		{
			recCurrent.selectLine({
				sublistId: 'custpage_ndi_timetrackingprojecttasks', 
				line: intLn, 
				value: true
			});
			var boolSubmit = recCurrent.getCurrentSublistValue({
				sublistId: 'custpage_ndi_timetrackingprojecttasks', 
				fieldId: 'custpage_subl_markforsubmit'
			});
			var stDuration = recCurrent.getCurrentSublistValue({
				sublistId: 'custpage_ndi_timetrackingprojecttasks', 
				fieldId: 'custpage_subl_duration'
			});
			var dtDate = recCurrent.getCurrentSublistValue({
				sublistId: 'custpage_ndi_timetrackingprojecttasks', 
				fieldId: 'custpage_subl_timetrackdate'
			});

			var stDate = dtDate.getFullYear() + '-' + (dtDate.getMonth()+1) + '-' + dtDate.getDate();

			var stProjectTask = recCurrent.getCurrentSublistValue({
				sublistId: 'custpage_ndi_timetrackingprojecttasks', 
				fieldId: 'custpage_subl_internalid'
			});
			var stItem = recCurrent.getCurrentSublistValue({
				sublistId: 'custpage_ndi_timetrackingprojecttasks', 
				fieldId: 'custpage_subl_custevent_lscu_gbdservice'
			});
			var stComment = recCurrent.getCurrentSublistValue({
				sublistId: 'custpage_ndi_timetrackingprojecttasks', 
				fieldId: 'custpage_subl_timeentrycomments'
			});

			if(!isEmpty(stComment))
			{
				stComment = xml.escape({
					xmlText: stComment
				});
			}
			
			if(boolSubmit || boolSubmit == 'T')
			{
				if(isEmpty(stDuration) || forceFloat(stDuration) == 0 || stDuration == '0.00')
				{
					dialog.alert({
						title: 'Message',
						message: 'Unmark lines with blank or zero duration before submitting.'
					});
					return;
				}

				arrTimeEntries.push({
					duration: stDuration,
					date: stDate,
					task: stProjectTask,
					proj: stProject,
					item: stItem,
					note: stComment
				});
			}
			recCurrent.commitLine({
				sublistId: 'custpage_ndi_timetrackingprojecttasks'
			});
		}

		if(arrTimeEntries.length == 0)
		{
			dialog.alert({
				title: 'Message',
				message: 'No time tracking lines selected.'
			});
		}
		else
		{
			try
			{
				displayOverlay('Time Entry creation in progress...');
				var stSuiteletURL = url.resolveScript({
					scriptId: 'customscript_ndi_sl_timetracking',
					deploymentId: 'customdeploy_ndi_sl_timetracking',
					returnExternalUrl: false,
					params: {
						'data': JSON.stringify(arrTimeEntries)
					}
				});

				https.get.promise({
					url : stSuiteletURL
				}).then(function(response) {
					if(!isEmpty(response)) {
						removeOverlay();
						var obj = JSON.parse(response.body);

						var stMessage = 'Time Entry records created.';
						if(obj.success != true)
						{
							stMessage = 'Error encountered during Time Entry creation. Please check if your Employee record is allowed to book against the project task.';
							stMessage += '<br/><br/>Project Preferences:';
							stMessage += '<br/>ALLOW TIME ENTRY: ' + recCurrent.getValue({fieldId: 'allowtime'});
							stMessage += '<br/>LIMIT TIME AND EXPENSES TO RESOURCES: ' + recCurrent.getValue({fieldId: 'limittimetoassignees'});

							dialog.alert({
								title: 'Message',
								message: stMessage
							});
						}
						else
						{
							dialog.alert({
								title: 'Message',
								message: stMessage
							});
							
							window.ischanged = false;
							window.location.reload();
						}

						

						
					}
				}).catch(function onRejected(reason) {
					// log.debug({
					// 	title: 'Invalid Get Request: ',
					// 	details: reason
					// });
					console.log('ERROR = ' + reason);
				});
			}
			catch (e)
			{
				console.log(e.toString());
			}
		}
	}

	function startButtonLogic(intLine, stClientScriptPath)
	{
		var recCurrent = currentRecord.get();
		recCurrent.selectLine({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			line: intLine
		});
		var boolStart = recCurrent.getCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_start'
		});
		var boolPause = recCurrent.getCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_pause'
		});
		var boolStop = recCurrent.getCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_stop'
		});

		if(boolStart || boolPause || boolStop)
		{
			return;
		}

		recCurrent.setCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_timetrackstatus', 
			value: '2'
		});
		recCurrent.setCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_starttime', 
			value: new Date()
		});
		recCurrent.setCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_duration', 
			value: '0.00'
		});
		recCurrent.setCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_start',
			value: true,
			ignoreFieldChange: true
		});
		recCurrent.commitLine({
			sublistId: 'custpage_ndi_timetrackingprojecttasks'
		});
	}

	function pauseButtonLogic(intLine, stClientScriptPath)
	{
		var recCurrent = currentRecord.get();
		recCurrent.selectLine({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			line: intLine
		});
		var boolPause = recCurrent.getCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_pause'
		});
		var boolStop = recCurrent.getCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_stop'
		});
		var boolStart = recCurrent.getCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_start'
		});

		if(boolStop || !boolStart)
		{
			return;
		}

		if(boolPause)
		{
			recCurrent.setCurrentSublistValue({
				sublistId: 'custpage_ndi_timetrackingprojecttasks', 
				fieldId: 'custpage_subl_pause', 
				value: false
			});
			recCurrent.setCurrentSublistValue({
				sublistId: 'custpage_ndi_timetrackingprojecttasks', 
				fieldId: 'custpage_subl_timetrackstatus', 
				value: '2'
			});
		}
		else
		{
			recCurrent.setCurrentSublistValue({
				sublistId: 'custpage_ndi_timetrackingprojecttasks', 
				fieldId: 'custpage_subl_pause', 
				value: true
			});
			recCurrent.setCurrentSublistValue({
				sublistId: 'custpage_ndi_timetrackingprojecttasks', 
				fieldId: 'custpage_subl_timetrackstatus', 
				value: '3'
			});
		}
		boolPause = recCurrent.getCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_pause'
		});
		if(boolPause)
		{
			var stStartTime = recCurrent.getCurrentSublistValue({
				sublistId: 'custpage_ndi_timetrackingprojecttasks', 
				fieldId: 'custpage_subl_starttime'
			});
			var flDuration = forceFloat(recCurrent.getCurrentSublistValue({
				sublistId: 'custpage_ndi_timetrackingprojecttasks', 
				fieldId: 'custpage_subl_duration'
			}));
			recCurrent.setCurrentSublistValue({
				sublistId: 'custpage_ndi_timetrackingprojecttasks', 
				fieldId: 'custpage_subl_duration', 
				value: (flDuration + ((new Date() - new Date(stStartTime))/1000/60)).toFixed(2)
			});
		}
		else{
			recCurrent.setCurrentSublistValue({
				sublistId: 'custpage_ndi_timetrackingprojecttasks', 
				fieldId: 'custpage_subl_starttime', 
				value: new Date()
			});
		}
		recCurrent.commitLine({
			sublistId: 'custpage_ndi_timetrackingprojecttasks'
		});
	}

	function stopButtonLogic(intLine, stClientScriptPath)
	{
		var recCurrent = currentRecord.get();
		recCurrent.selectLine({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			line: intLine
		});
		var boolPause = recCurrent.getCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_pause'
		});
		var boolStop = recCurrent.getCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_stop'
		});
		var boolStart = recCurrent.getCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_start'
		});

		if(boolStop || !boolStart)
		{
			return;
		}

		recCurrent.setCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_timetrackstatus', 
			value: '4'
		});

		if(!boolPause)
		{
			var stStartTime = recCurrent.getCurrentSublistValue({
				sublistId: 'custpage_ndi_timetrackingprojecttasks', 
				fieldId: 'custpage_subl_starttime'
			});
			var flDuration = forceFloat(recCurrent.getCurrentSublistValue({
				sublistId: 'custpage_ndi_timetrackingprojecttasks', 
				fieldId: 'custpage_subl_duration'
			}));
			recCurrent.setCurrentSublistValue({
				sublistId: 'custpage_ndi_timetrackingprojecttasks', 
				fieldId: 'custpage_subl_duration', 
				value: (flDuration + ((new Date() - new Date(stStartTime))/1000/60)).toFixed(2)
			});
		}
		recCurrent.setCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_pause',
			value: false,
			ignoreFieldChange: true
		});
		recCurrent.setCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_stop',
			value: true,
			ignoreFieldChange: true
		});
		recCurrent.commitLine({
			sublistId: 'custpage_ndi_timetrackingprojecttasks'
		});
	}

	function resetButtonLogic(intLine, stClientScriptPath)
	{
		var recCurrent = currentRecord.get();
		recCurrent.selectLine({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			line: intLine
		});
		recCurrent.setCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_timetrackstatus', 
			value: '1'
		});
		recCurrent.setCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_pause',
			value: false,
			ignoreFieldChange: true
		});
		recCurrent.setCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_start',
			value: false,
			ignoreFieldChange: true
		});
		recCurrent.setCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_stop',
			value: false,
			ignoreFieldChange: true
		});
		recCurrent.setCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_duration',
			value: '',
			ignoreFieldChange: true
		});
		recCurrent.setCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_starttime',
			value: '',
			ignoreFieldChange: true
		});
		recCurrent.setCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_pausetime',
			value: '',
			ignoreFieldChange: true
		});
		recCurrent.setCurrentSublistValue({
			sublistId: 'custpage_ndi_timetrackingprojecttasks', 
			fieldId: 'custpage_subl_stoptime',
			value: '',
			ignoreFieldChange: true
		});
		recCurrent.commitLine({
			sublistId: 'custpage_ndi_timetrackingprojecttasks'
		});
	}

	function isEmpty(stValue)
        {
            return ((stValue === '' || stValue == null || stValue == undefined) ||
                (stValue.constructor === Array && stValue.length == 0) ||
                (stValue.constructor === Object && (function(v)
                {
                    for (var k in v) return false;
                    return true;
                })(stValue)));
        };

	/**
	 * Overlay screen with the text provided
	 * using jQuery
	 * @param text
	 */
	function displayOverlay(text)
	{
	    jQuery("<table id='overlay'><tbody><tr><td>" + text + "</td></tr></tbody></table>").css({
	        "position": "fixed",
	        "top": "0px",
	        "left": "0px",
	        "width": "100%",
	        "height": "100%",
	        "background-color": "rgba(0,0,0,.5)",
	        "z-index": "10000",
	        "vertical-align": "middle",
	        "text-align": "center",
	        "color": "#fff",
	        "font-size": "20px",
	        "font-weight": "bold",
	        "cursor": "wait"
	    }).appendTo("body");
	}

	/**
	 * Remove overlay of the screen
	 * using jQuery
	 */
	function removeOverlay() {
	    jQuery("#overlay").remove();
	}

	function forceFloat(stValue)
    {
    	var flValue = parseFloat(stValue);

    	if (isNaN(flValue) || (stValue == Infinity))
    	{
    		return 0.00;
    	}

    	return flValue;
    };

    return {
        fieldChanged: fieldChanged,
		markAll: markAll,
		unmarkAll: unmarkAll,
		createTimeEntries: createTimeEntries,
		startButtonLogic: startButtonLogic,
		pauseButtonLogic: pauseButtonLogic,
		stopButtonLogic: stopButtonLogic,
		resetButtonLogic: resetButtonLogic
    };
    
});
