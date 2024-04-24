/**
 * Project: PROJ89 LSCU
 * Date: February 06, 2024
 * 
 *  Date Modified   Modified By		Reference		Notes
 *  Feb 06, 2024	cmartinez    	5550628			Initial Version 
 * 
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/error', 'N/https', 'N/record', 'N/runtime', 'N/search'],
    /**
 * @param{error} error
 * @param{https} https
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 */
    (error, https, record, runtime, search) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest_timeTracking = (scriptContext) => {
            
            var stLogTitle = 'onRequest_timeTracking';

            var boolSuccess = true;

            try
            {
                log.debug(stLogTitle, 'DATA = ' + scriptContext.request.parameters.data);

                var stData = scriptContext.request.parameters.data;

                log.debug(stLogTitle, 'Length of data sting = ' + stData.length);
                
                var arrTimeToBeCreated = JSON.parse(stData);
                var intTimeCount = arrTimeToBeCreated.length;
                log.debug(stLogTitle, 'intTimeCount = ' + intTimeCount);

                var stDefaultDepartment = runtime.getCurrentScript().getParameter('custscript_ndi_sl_defaultdepartment');

                var stEmployee = runtime.getCurrentUser().id;
                log.debug(stLogTitle, 'stEmployee = ' + stEmployee);

                for(var intTime = 0; intTime < intTimeCount; intTime++)
                {
                    var objTime = arrTimeToBeCreated[intTime];
                    log.debug(stLogTitle, 'objTime.date = ' + objTime.date);
                    var arrDate = objTime.date.split('-');

                    var dtActualDate = new Date();
                    dtActualDate.setDate(1);
                    dtActualDate.setFullYear(forceInt(arrDate[0]));
                    dtActualDate.setMonth(forceInt(arrDate[1])-1);
                    dtActualDate.setDate(forceInt(arrDate[2]));

                    var recTime = record.create({
                        type: 'timebill',
                        isDynamic: true
                    });
                    recTime.setValue({
                        fieldId: 'employee',
                        value: stEmployee
                    });
                    recTime.setValue({
                        fieldId: 'customer',
                        value: objTime.proj
                    });
                    recTime.setValue({
                        fieldId: 'casetaskevent',
                        value: objTime.task
                    });
                    if(objTime.item)
                    {
                        recTime.setValue({
                            fieldId: 'item',
                            value: objTime.item
                        });

                        try
                        {
                            var objItem = search.lookupFields({
                                type: 'item',
                                id: objTime.item,
                                columns: ['class']
                            });
                            if(objItem['class'])
                            {
                                recTime.setValue({
                                    fieldId: 'class',
                                    value: objItem['class'][0].value
                                });
                            }
                        }
                        catch(e)
                        {
                            log.debug(stLogTitle, 'Error = ' + e.toString());
                        }
                    }
                    if(stDefaultDepartment)
                    {
                        recTime.setValue({
                            fieldId: 'department',
                            value: stDefaultDepartment
                        });
                    }
                    if(objTime.note)
                    {
                        recTime.setValue({
                            fieldId: 'memo',
                            value: objTime.note
                        });
                    }
                    recTime.setValue({
                        fieldId: 'trandate',
                        value: dtActualDate
                    });
                    var flHours = roundDecimalAmount(forceFloat(objTime.duration)/60, 2);
                    recTime.setValue({
                        fieldId: 'hours',
                        value: flHours
                    });
                    log.audit(stLogTitle, 'HOURS = ' + flHours);
                    var stTimeEntry = recTime.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    log.audit(stLogTitle, 'CREATED Time Entry record. stTimeEntry = ' + stTimeEntry);
                }
            }
            catch(e)
            {
                log.error(stLogTitle, 'ERROR = ' + e.toString());
                boolSuccess = false;
            }

            scriptContext.response.write(JSON.stringify({
                success: boolSuccess
            }));
        }

        function forceInt(stValue)
        {
            var intValue = parseInt(stValue, 10);

            if (isNaN(intValue) || (stValue == Infinity))
            {
                return 0;
            }

            return intValue;
        }

        function forceFloat(stValue)
        {
            var flValue = parseFloat(stValue);

            if (isNaN(flValue) || (stValue == Infinity))
            {
                return 0.00;
            }

            return flValue;
        }

        function roundDecimalAmount(flDecimalNumber, intDecimalPlace)
        {
            //this is to make sure the rounding off is correct even if the decimal is equal to -0.995
            var bNegate = false;
            if (flDecimalNumber < 0)
            {
                flDecimalNumber = Math.abs(flDecimalNumber);
                bNegate = true;
            }

            var flReturn = 0.00;
            intDecimalPlace = (intDecimalPlace == null || intDecimalPlace == '') ? 0 : intDecimalPlace;

            var intMultiplierDivisor = Math.pow(10, intDecimalPlace);
            flReturn = Math.round((parseFloat(flDecimalNumber) * intMultiplierDivisor)) / intMultiplierDivisor;
            flReturn = (bNegate) ? (flReturn * -1) : flReturn;

            return flReturn.toFixed(intDecimalPlace);
        }

        return {
            onRequest: onRequest_timeTracking
        }

    });
