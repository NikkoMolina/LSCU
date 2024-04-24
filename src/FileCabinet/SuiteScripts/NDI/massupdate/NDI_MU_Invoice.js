/**
 /**
 * @NApiVersion 2.1
 * @NScriptType MassUpdateScript
 */
const INV_REC = {
    FIELDS : {
        FORM : 'customform',
        PROJECT : 'job',
        PROJ_TYPE : 'custbody_lscu_project_type',
        PROJ_MGR : 'custbody_lscu_project_manager'
    },
    FORM : {
        GBD : 184
    }
}
const JOB_REC = {
    FIELDS : {
        TYPE : 'jobtype',
        MANAGER : 'projectmanager'
    }
}
define(['N/record', 'N/search'],
    /**
 * @param{record} record
 * @param{search} search
 */
    (record, search) => {
        /**
         * Defines the Mass Update trigger point.
         * @param {Object} params
         * @param {string} params.type - Record type of the record being processed
         * @param {number} params.id - ID of the record being processed
         * @since 2016.1
         */
        const each = (params) => {
            try {
                var recType = params.type,
                    recId   = params.id,
                    valObj = new Object;
                var invObj  = record.load({
                    type: recType,
                    id: recId
                });
                var recForm = invObj.getValue(INV_REC.FIELDS.FORM)

                if(recForm==INV_REC.FORM.GBD){
                    var jobId = invObj.getValue(INV_REC.FIELDS.PROJECT);
                    if(jobId){
                        var jobObj = record.load({
                            type: record.Type.JOB,
                            id: jobId
                        });
                        var jobType = jobObj.getValue(JOB_REC.FIELDS.TYPE),
                            jobMgr  = jobObj.getValue(JOB_REC.FIELDS.MANAGER);
                        
                        if(jobType) 
                            valObj[INV_REC.FIELDS.PROJ_TYPE] = jobType;
                        if(jobMgr) 
                            valObj[INV_REC.FIELDS.PROJ_MGR] = jobMgr;
                    }
                }
                
                if(valObj)
                    record.submitFields({
                        type: record.Type.INVOICE,
                        id: recId,
                        values: valObj,
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields : true
                        }
                    });
            } catch (error) {
                log.audit('Failed to update invoice',params.id)
            }
        }

        return {each}

    });
